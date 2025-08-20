// server/api/qr.js

const express = require('express');

module.exports = ({ getTrustedSdk }) => {
  const router = express.Router();

  // quick health-check
  router.get('/_debug/ping', (_req, res) => res.sendStatus(204));

  // TEMP: visibility into what SDK the route sees
  router.get('/_debug/sdk', async (req, res) => {
    let sdk = null;
    try {
      if (typeof getTrustedSdk === 'function') {
        // important: pass BOTH req and res, and await
        sdk = await getTrustedSdk(req, res);
      }
    } catch (e) {
      console.error('[QR] getTrustedSdk threw', e);
    }
    sdk = sdk || req.app.get('integrationSdk') || req.app.get('apiSdk');

    return res.status(sdk ? 200 : 500).json({
      hasSdk: !!sdk,
      hasTransactionsShow: !!sdk?.transactions?.show,
      from: {
        getTrustedSdk: typeof getTrustedSdk === 'function',
        integrationSdk: !!req.app.get('integrationSdk'),
        apiSdk: !!req.app.get('apiSdk'),
      },
    });
  });

  router.get('/:txId', async (req, res) => {
    // --- resolve SDK robustly ---
    let sdk = null;
    try {
      if (typeof getTrustedSdk === 'function') {
        sdk = await getTrustedSdk(req, res); // <— this is the usual gotcha
      }
    } catch (e) {
      console.error('[QR] getTrustedSdk threw', e);
    }
    sdk = sdk || req.app.get('integrationSdk') || req.app.get('apiSdk');

    if (!sdk || !sdk.transactions || !sdk.transactions.show) {
      console.error('[QR] SDK not wired — transactions.show missing');
      return res.status(500).send('Server misconfiguration: SDK unavailable');
    }

    const { txId } = req.params;

    try {
      // if your SDK expects UUID, adapt accordingly
      const tx = await sdk.transactions.show({ id: txId }, { expand: true });

      const pd = tx?.data?.data?.attributes?.protectedData;
      const shippo = pd?.shippo || {};
      // try common keys
      const qr =
        shippo?.outbound?.qr_code_url ||
        shippo?.return?.qr_code_url ||
        shippo?.qr_code_url;

      if (qr) return res.redirect(302, qr);

      return res.status(404).send('Label not ready yet');
    } catch (err) {
      console.error('[QR] transactions.show failed', err);
      return res.status(500).send('Failed to load transaction');
    }
  });

  return router;
};
