const express = require('express');
const router = express.Router();

module.exports = ({ sharetribeSdk, shippo }) => {
  /**
   * Parse the Expires parameter from a Shippo URL
   * @param {string} url - The Shippo URL with Expires query parameter
   * @returns {number|null} - Expiry timestamp in seconds, or null if not found
   */
  function parseExpiresParam(url) {
    try {
      const u = new URL(url);
      const exp = u.searchParams.get('Expires');
      return exp ? Number(exp) : null;
    } catch {
      return null;
    }
  }

  /**
   * GET /api/qr/:transactionId
   * Redirects to a valid Shippo QR code, refreshing if expired
   */
  router.get('/api/qr/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    
    try {
      console.log(`🔍 [QR] Processing request for transaction: ${transactionId}`);
      
      // Get the transaction with protectedData (privileged)
      const txRes = await sharetribeSdk.transactions.show({ 
        id: transactionId, 
        include: [] 
      });
      
      const tx = txRes?.data?.data;
      if (!tx) {
        console.warn(`⚠️ [QR] Transaction not found: ${transactionId}`);
        return res.status(404).send(`
          <html>
            <body>
              <h2>QR Code Not Found</h2>
              <p>The requested QR code for transaction ${transactionId} could not be found.</p>
              <p>Please contact support if you believe this is an error.</p>
            </body>
          </html>
        `);
      }
      
      const pd = tx?.attributes?.protectedData || {};
      let { outboundQrCodeUrl, outboundQrCodeExpiry, outboundShippoTxId } = pd;
      
      console.log(`📱 [QR] Transaction found, checking QR code availability:`, {
        hasQrUrl: !!outboundQrCodeUrl,
        hasExpiry: !!outboundQrCodeExpiry,
        hasShippoTxId: !!outboundShippoTxId,
        currentTime: Math.floor(Date.now() / 1000),
        expiryTime: outboundQrCodeExpiry
      });
      
      const nowSec = Math.floor(Date.now() / 1000);
      const freshNeeded = !outboundQrCodeUrl || 
                         !outboundQrCodeExpiry || 
                         outboundQrCodeExpiry < (nowSec + 120); // 2-minute buffer
      
      if (freshNeeded && outboundShippoTxId) {
        console.log(`🔄 [QR] QR code expired or missing, refreshing from Shippo...`);
        
        try {
          // Re-retrieve Shippo transaction to get fresh signed URLs
          const shippoTx = await shippo.transaction.retrieve(outboundShippoTxId);
          
          if (shippoTx?.qr_code_url) {
            outboundQrCodeUrl = shippoTx.qr_code_url;
            outboundQrCodeExpiry = parseExpiresParam(outboundQrCodeUrl);
            
            console.log(`✅ [QR] Successfully refreshed QR code:`, {
              newUrl: maskUrl(outboundQrCodeUrl),
              newExpiry: outboundQrCodeExpiry,
              expiresIn: outboundQrCodeExpiry ? outboundQrCodeExpiry - nowSec : 'unknown'
            });
            
            // Save refreshed values back to Flex via privileged transition
            try {
              await sharetribeSdk.transactions.transition({
                id: transactionId,
                transition: 'transition/store-shipping-urls',
                params: {
                  protectedData: {
                    outboundQrCodeUrl,
                    outboundQrCodeExpiry
                  }
                }
              });
              console.log(`💾 [QR] Refreshed QR code saved to transaction`);
            } catch (transitionError) {
              console.warn(`⚠️ [QR] Failed to save refreshed QR code:`, transitionError.message);
              // Continue with the redirect even if save fails
            }
          } else {
            console.warn(`⚠️ [QR] Shippo transaction retrieval failed or no QR code URL`);
          }
        } catch (shippoError) {
          console.error(`❌ [QR] Error refreshing from Shippo:`, shippoError.message);
          // Continue with existing URL if available
        }
      }
      
      if (!outboundQrCodeUrl) {
        console.warn(`⚠️ [QR] No QR code URL available for transaction: ${transactionId}`);
        return res.status(404).send(`
          <html>
            <body>
              <h2>QR Code Not Available</h2>
              <p>The QR code for transaction ${transactionId} is not currently available.</p>
              <p>This may be due to:</p>
              <ul>
                <li>The shipping label has expired</li>
                <li>The transaction is still being processed</li>
                <li>A system error occurred</li>
              </ul>
              <p>Please contact support for assistance.</p>
            </body>
          </html>
        `);
      }
      
      // Log the redirect (masked for security)
      console.log(`🔄 [QR] Redirecting to QR code:`, {
        transactionId,
        redirectUrl: maskUrl(outboundQrCodeUrl),
        expiresIn: outboundQrCodeExpiry ? outboundQrCodeExpiry - nowSec : 'unknown'
      });
      
      // 302 redirect to the (fresh) Shippo QR URL with cache control and robots headers
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Robots-Tag': 'noindex, nofollow'
      });
      res.redirect(302, outboundQrCodeUrl);
      
    } catch (err) {
      console.error(`❌ [QR] Error processing QR request for ${transactionId}:`, err.message);
      res.status(500).send(`
        <html>
          <body>
            <h2>Service Temporarily Unavailable</h2>
            <p>We're experiencing technical difficulties loading the QR code.</p>
            <p>Please try again in a few minutes or contact support if the problem persists.</p>
          </body>
        </html>
      `);
    }
  });

  /**
   * Mask sensitive parts of URLs in logs
   * @param {string} url - The URL to mask
   * @returns {string} - Masked URL for logging
   */
  function maskUrl(url) {
    if (!url) return 'null';
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}${u.pathname}...`;
    } catch {
      return '[invalid-url]';
    }
  }

  return router;
};
