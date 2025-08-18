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
   * GET /:transactionId
   * Redirects to a valid Shippo QR code, refreshing if expired
   */
  router.get('/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    
    try {
      // Fetch the transaction with expand so we get protectedData
      const tx = await sharetribeSdk.transactions.show({
        id: req.params.transactionId,
        queryParams: { expand: true }
      });
      const pd = tx?.data?.data?.attributes?.protectedData || {};
      
      // Log the keys we care about (masked)
      const mask = v => (typeof v === 'string' ? v.slice(0,8) + '…' : v);
      console.log('[QR] pd keys', {
        hasQr: !!pd.outboundQrCodeUrl,
        hasShippoTx: !!pd.outboundShippoTxId,
        hasTrack: !!pd.outboundTrackingNumber,
      });
      
      // If no outboundQrCodeUrl, but outboundShippoTxId exists, retrieve from Shippo and update pd
      if (!pd.outboundQrCodeUrl && pd.outboundShippoTxId) {
        const rtx = await shippo.transaction.retrieve(pd.outboundShippoTxId);
        const freshQr = rtx?.qr_code_url || null;
        if (freshQr) {
          // persist back via privileged transition (merge!)
          await sharetribeSdk.transactions.transition({
            id: req.params.transactionId,
            transition: 'transition/store-shipping-urls',
            params: { protectedData: { ...pd, outboundQrCodeUrl: freshQr } }
          });
          pd.outboundQrCodeUrl = freshQr;
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
        return res.redirect(302, pd.outboundQrCodeUrl);
      }
      return res.status(410).send('QR not available yet for this transaction. Try again in a minute.');
      
    } catch (err) {
      console.error(`❌ [QR] Error processing QR request for ${req.params.transactionId}:`, err.message);
      res.status(500).send('Service temporarily unavailable. Please try again later.');
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

  // Debug routes for quick checks (gated by QR_DEBUG env var)
  router.get('/_debug/ping', (req, res) => {
    if (process.env.QR_DEBUG !== 'true') return res.status(404).end();
    res.status(204).end();
  });
  
  router.get('/_debug/tx/:transactionId', async (req, res) => {
    if (process.env.QR_DEBUG !== 'true') return res.status(404).end();
    
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
        keys: Object.keys(pd)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
