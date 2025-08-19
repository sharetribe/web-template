const express = require('express');
const router = express.Router();

module.exports = ({ sharetribeSdk, shippo }) => {
  /**
   * Helper function to mask sensitive strings (first 8 chars + "...")
   * @param {string} str - The string to mask
   * @returns {string} - Masked string
   */
  function mask(str) {
    if (!str || typeof str !== 'string') return str;
    return str.slice(0, 8) + '…';
  }

  /**
   * Helper function to mask URLs (strip query params and truncate path)
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

  /**
   * Helper function to pick specific keys from an object
   * @param {object} obj - The object to pick from
   * @param {string[]} keys - Array of keys to pick
   * @returns {object} - Object with only the specified keys
   */
  function pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return {};
    const result = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    });
    return result;
  }

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
   * GET /_debug/ping
   * Debug endpoint to test if QR router is working
   */
  router.get('/_debug/ping', (req, res) => {
    res.status(204).end();
  });

  /**
   * GET /_debug/tx/:transactionId
   * Debug endpoint to inspect transaction data and protected data
   */
  router.get('/_debug/tx/:transactionId', async (req, res) => {
    try {
      const tx = await sharetribeSdk.transactions.show({ 
        id: req.params.transactionId, 
        queryParams: { expand: true } 
      });
      const pd = tx?.data?.data?.attributes?.protectedData || {};
      
      res.json({
        hasQr: !!pd.outboundQrCodeUrl,
        hasShippoTx: !!pd.outboundShippoTxId,
        hasTrack: !!pd.outboundTrackingNumber,
        pdKeys: Object.keys(pd),
        shippoTxIdMasked: mask(pd.outboundShippoTxId),
        qrMasked: maskUrl(pd.outboundQrCodeUrl)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * GET /:transactionId
   * Redirects to a valid Shippo QR code, refreshing if expired
   */
  router.get('/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    
    // Log the request at the top
    console.log('[QR] hit', { txId: transactionId });
    
    try {
      // Fetch the transaction with expand so we get protectedData
      const tx = await sharetribeSdk.transactions.show({
        id: transactionId,
        queryParams: { expand: true }
      });
      const pd = tx?.data?.data?.attributes?.protectedData || {};
      
      // Log what we have
      console.log('[QR] pd keys', { 
        hasQr: !!pd.outboundQrCodeUrl, 
        hasShippoTx: !!pd.outboundShippoTxId, 
        hasTrack: !!pd.outboundTrackingNumber 
      });
      
      // If no outboundQrCodeUrl, but outboundShippoTxId exists, retrieve from Shippo and update pd
      if (!pd.outboundQrCodeUrl && pd.outboundShippoTxId) {
        try {
          const rtx = await shippo.transaction.retrieve(pd.outboundShippoTxId);
          
          // Debug logging when SHIPPO_DEBUG is enabled
          if (process.env.SHIPPO_DEBUG === 'true') {
            const maskedFields = pick(rtx, ['object_id', 'status', 'qr_code_url', 'tracking_number', 'tracking_url_provider']);
            console.log('[SHIPPO][RETRIEVE]', {
              object_id: mask(maskedFields.object_id),
              status: maskedFields.status,
              qr_code_url: maskUrl(maskedFields.qr_code_url),
              tracking_number: mask(maskedFields.tracking_number),
              tracking_url_provider: maskUrl(maskedFields.tracking_url_provider)
            });
          }
          
          const freshQr = rtx?.qr_code_url || null;
          if (freshQr) {
            // persist back via privileged transition (merge!)
            try {
              await sharetribeSdk.transactions.transition({
                id: transactionId,
                transition: 'transition/store-shipping-urls',
                params: { protectedData: { ...pd, outboundQrCodeUrl: freshQr } }
              });
              pd.outboundQrCodeUrl = freshQr;
            } catch (transitionErr) {
              // If transition returns 409, catch it and just log a warning
              if (transitionErr.status === 409) {
                console.warn('[QR] Transition 409 - shipping URLs already stored', { txId: transactionId });
              } else {
                throw transitionErr;
              }
            }
          }
        } catch (shippoErr) {
          console.error('[QR] Shippo transaction retrieve failed', { 
            txId: transactionId, 
            shippoTxId: mask(pd.outboundShippoTxId),
            error: shippoErr.message 
          });
        }
      }
      
      // If we now have pd.outboundQrCodeUrl, 302 to it with no-store headers; else return a 410
      if (pd.outboundQrCodeUrl) {
        res.set({
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Robots-Tag': 'noindex, nofollow',
        });
        
        console.log('[QR] 302 to Shippo QR', maskUrl(pd.outboundQrCodeUrl));
        return res.redirect(302, pd.outboundQrCodeUrl);
      }
      
      // No QR available
      console.log('[QR] 410 pending', { txId: transactionId });
      return res.status(410).send('QR not available yet; try again in a minute.');
      
    } catch (err) {
      console.error(`❌ [QR] Error processing QR request for ${transactionId}:`, err.message);
      res.status(500).send('Service temporarily unavailable. Please try again later.');
    }
  });

  return router;
};
