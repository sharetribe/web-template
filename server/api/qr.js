// server/api/qr.js

module.exports = ({ getTrustedSdk }) => {
  const express = require('express');
  const router = express.Router();

  // Healthcheck: GET /api/qr/_debug/ping -> 204
  router.get('/_debug/ping', (req, res) => res.sendStatus(204));

  // GET /api/qr/:txId -> 302 redirect to Shippo QR/label/tracking URL saved on the transaction
  router.get('/:txId', async (req, res) => {
    const { txId } = req.params || {};

    // Prefer the same SDK used by privileged routes; fall back to app locals if present
    const sdk =
      (typeof getTrustedSdk === 'function' ? getTrustedSdk(req) : null) ||
      req.app.get('integrationSdk') ||
      req.app.get('apiSdk');

    if (!sdk || !sdk.transactions || !sdk.transactions.show) {
      console.error('[QR] SDK not wired — transactions.show missing');
      return res
        .status(500)
        .type('text/plain')
        .send('Service temporarily unavailable. Please try again later.');
    }

    try {
      // Fetch the transaction to read protectedData.shippo
      const r = await sdk.transactions.show({ id: txId });
      const attrs = r?.data?.data?.attributes;
      const pd = attrs?.protectedData || {};
      const shippo = pd.shippo || {};

      // Choose the best available target; preference: QR -> label -> tracking
      const target =
        shippo.qr_code_url ||
        shippo.label_url ||
        shippo.tracking_url ||
        shippo.tracking_url_provider;

      // No URL persisted yet -> show a gentle 404
      if (!target) {
        res.set('Cache-Control', 'no-store');
        return res
          .status(404)
          .type('text/plain')
          .send('Label not ready yet. Try again in a minute.');
      }

      // Avoid caching/SEO on the redirect
      res.set({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Robots-Tag': 'noindex, nofollow',
      });

      return res.redirect(302, target);
    } catch (e) {
      console.error('[QR] fetch failed', e?.response?.data || e);
      return res
        .status(500)
        .type('text/plain')
        .send('Service temporarily unavailable. Please try again later.');
    }
  });

  return router;
};
