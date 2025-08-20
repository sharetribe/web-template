module.exports = ({ getTrustedSdk }) => {
  const express = require('express');
  const router = express.Router();

  // health check
  router.get('/_debug/ping', (req, res) => res.sendStatus(204));

  router.get('/_debug/tx/:txId', async (req, res) => {
    const sdk = getTrustedSdk(req);
    if (!sdk?.transactions?.show) {
      console.error('[QR] SDK not wired — transactions.show missing');
      return res.status(500).send({ ok:false, reason:'sdk-miswired' });
    }
    const { txId } = req.params;
    try {
      const tx = await sdk.transactions.show({ id: txId, include: ['listing'] });
      return res.json({ ok:true, id: txId, hasData: !!tx?.data, keys: Object.keys(tx?.data?.data?.attributes?.protectedData || {}) });
    } catch (e) {
      console.error('[QR][_debug/tx] fetch failed', e?.response?.data || e);
      return res.status(404).json({ ok:false, reason:'not-found' });
    }
  });

  router.get('/:txId', async (req, res) => {
    const { txId } = req.params;
    const sdk = getTrustedSdk(req);

    if (!sdk?.transactions?.show) {
      console.error('[QR] SDK not wired — transactions.show missing');
      return res.status(500).type('text/plain')
        .send('Service temporarily unavailable. Please try again later.');
    }

    try {
      const r = await sdk.transactions.show({ id: txId });
      const pd = r?.data?.data?.attributes?.protectedData || {};
      const shippo = pd.shippo || {};
      const url = shippo.qr_code_url || shippo.label_url || shippo.tracking_url || shippo.tracking_url_provider;

      // no URL yet → 404 with a friendly message
      if (!url) {
        res.set('Cache-Control', 'no-store');
        return res.status(404).type('text/plain')
          .send('Label not ready yet. Try again in a minute.');
      }

      res.set({
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Robots-Tag': 'noindex, nofollow',
      });

      return res.redirect(302, url);
    } catch (e) {
      console.error('[QR] fetch failed', e?.response?.data || e);
      return res.status(500).type('text/plain')
        .send('Service temporarily unavailable. Please try again later.');
    }
  });

  return router;
};
