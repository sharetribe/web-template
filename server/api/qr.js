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
      ok: !!sdk,
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
      // 1. Try Flex first: sdk.transactions.show({ id }). If found and `protectedData.shippo.outbound.qrCodeUrl`, redirect 302 to it.
      const resp = await sdk.transactions.show({ id: txId, include: ['lineItems'] });
      const tx = resp?.data?.data;
      const pData = tx?.attributes?.protectedData || {};
      const shippo = pData?.shippo || {};
      const outbound = shippo.outbound || {};

      if (outbound.qrCodeUrl) {
        console.log(`qr:redirect source=flex`);
        return res.redirect(302, outbound.qrCodeUrl);
      }

      // 2. Else check qrCache.get(id). If present and not expired, redirect 302.
      // Import qrCache from transition-privileged module
      let qrCache = null;
      try {
        const transitionPrivileged = require('./transition-privileged');
        qrCache = transitionPrivileged.qrCache;
      } catch (err) {
        console.warn('[QR] Could not import qrCache:', err.message);
      }

      if (qrCache && qrCache.has(txId)) {
        const cachedData = qrCache.get(txId);
        const now = Date.now();
        
        // Check if not expired (expiresAt is in seconds, convert to milliseconds)
        if (!cachedData.expiresAt || (cachedData.expiresAt * 1000) > now) {
          console.log(`qr:redirect source=cache`);
          return res.redirect(302, cachedData.qrCodeUrl);
        } else {
          console.log(`[QR] Cached QR data expired for transaction ${txId}`);
          qrCache.delete(txId); // Clean up expired entry
        }
      }

      // 3. Else return 202 with JSON: { ok: false, status: 'pending', message: 'Label not ready yet' }.
      // Never return 404 for a known tx unless you're sure the label failed.
      console.log(`[QR] No QR data available for transaction ${txId} - returning 202 pending`);
      res.set('Cache-Control', 'no-store'); // So devices will re-poll
      return res.status(202).json({ 
        ok: false, 
        status: 'pending', 
        message: 'Label not ready yet' 
      });

    } catch (err) {
      // If we can't even read the transaction, it might not exist
      if (err.response?.status === 404) {
        return res.status(404).json({ ok: false, error: 'Transaction not found' });
      }
      return res.status(500).json({ ok: false, error: `Failed to read transaction: ${String(err)}` });
    }
  });

  return router;
};
