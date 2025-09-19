// server/api/qr.js
const express = require('express');

module.exports = ({ getTrustedSdk }) => {
  const router = express.Router();

  async function resolveSdk(req) {
    // 1) Preferred: privileged SDK via getTrustedSdk
    if (typeof getTrustedSdk === 'function') {
      try {
        const s = await getTrustedSdk(req);     // <-- IMPORTANT: await
        if (s) return { sdk: s, src: 'getTrustedSdk' };
      } catch (_) {}
    }

    // 2) Fallbacks from app locals
    const integration = req.app.get('integrationSdk');
    if (integration) return { sdk: integration, src: 'integrationSdk' };

    const api = req.app.get('apiSdk');
    if (api) return { sdk: api, src: 'apiSdk' };

    return { sdk: null, src: null };
  }

  // quick health-check
  router.get('/_debug/ping', (_req, res) => res.sendStatus(204));

  // Debug: /api/qr/_debug/sdk
  router.get('/_debug/sdk', async (req, res) => {
    try {
      const { sdk, src } = await resolveSdk(req);
      const hasTransactionsShow = !!(sdk && sdk.transactions && typeof sdk.transactions.show === 'function');
      res.json({
        ok: !!sdk && hasTransactionsShow,
        hasTransactionsShow,
        from: {
          getTrustedSdk: src === 'getTrustedSdk',
          integrationSdk: src === 'integrationSdk',
          apiSdk: src === 'apiSdk',
        },
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Main QR redirect: /api/qr/:txId (constrained to UUID format)
  router.get('/:txId([0-9a-fA-F-]{36})', async (req, res) => {
    const { txId } = req.params;

    // Add guard log if PUBLIC_BASE_URL is missing
    if (!process.env.PUBLIC_BASE_URL) console.warn('[qr] PUBLIC_BASE_URL not set');

    const { sdk } = await resolveSdk(req);
    const wired = !!(sdk && sdk.transactions && typeof sdk.transactions.show === 'function');
    if (!wired) {
      console.error('[QR] SDK not wired — transactions.show missing');
      return res.status(500).json({ ok: false, error: 'SDK not wired — transactions.show missing' });
    }

    try {
      // 1. Redis cache first (faster than Flex, should have data immediately after label creation)
      const { getRedis } = require('../redis');
      const redis = getRedis();
      
      try {
        const raw = await redis.get(`qr:${txId}`);
        if (raw) {
          const data = JSON.parse(raw);
          if (data?.qrCodeUrl) {
            console.log(`qr:redirect source=redis`);
            return res.redirect(302, data.qrCodeUrl);
          }
        }
      } catch (e) {
        console.warn('[QR] redis get failed', e);
      }

      // 2. Flex fallback (in case Redis was missed but Flex has persisted data)
      const resp = await sdk.transactions.show({ id: txId, include: ['lineItems'] });
      const tx = resp?.data?.data;
      const pData = tx?.attributes?.protectedData || {};
      const shippo = pData?.shippo || {};
      const outbound = shippo.outbound || {};

      if (outbound.qrCodeUrl) {
        console.log(`qr:redirect source=flex`);
        return res.redirect(302, outbound.qrCodeUrl);
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
