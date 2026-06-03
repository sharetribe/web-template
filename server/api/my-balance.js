'use strict';

const express = require('express');
const { getSdk } = require('../api-util/sdk');
const { createTTLCache } = require('../api-util/cache');

const router = express.Router();

// Per-user summary cache. 60s is a reasonable balance: hides repeat hits during
// a session, but a fresh sale shows up within a minute.
// Cache key includes the transition lists so changes invalidate naturally.
const summaryCache = createTTLCache(60);

// Hard caps to bound worst-case latency.
const PER_PAGE = 100;
const MAX_PAGES = 50; // 5000 transactions per bucket

// Fully paginate `sdk.transactions.query` over `params` until totalPages or MAX_PAGES.
async function paginateAll(sdk, params) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await sdk.transactions.query({ ...params, page, perPage: PER_PAGE });
    const data = res?.data?.data || [];
    all.push(...data);
    totalPages = res?.data?.meta?.totalPages || 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);
  return all;
}

function sumPayout(txs) {
  let total = 0;
  let currency = null;
  for (const tx of txs) {
    const payout = tx?.attributes?.payoutTotal;
    if (payout) {
      total += payout.amount;
      if (!currency) currency = payout.currency;
    }
  }
  return { total, currency };
}

// Parse a comma-separated list query param into a clean array.
function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function computeSummary(sdk, { completed, refunded, processNames }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const baseParams = {
    only: 'sale',
    processNames,
    'fields.transaction': ['payoutTotal', 'lastTransition'],
  };
  const monthParams = { ...baseParams, createdAtStart: monthStart };
  const skip = new Set([...completed, ...refunded]);

  const [
    completedTxs,
    refundedTxs,
    pendingTxs,
    mCompletedTxs,
    mRefundedTxs,
    mPendingTxs,
  ] = await Promise.all([
    paginateAll(sdk, { ...baseParams, lastTransitions: completed }),
    paginateAll(sdk, { ...baseParams, lastTransitions: refunded }),
    paginateAll(sdk, baseParams).then(all =>
      all.filter(tx => !skip.has(tx?.attributes?.lastTransition))
    ),
    paginateAll(sdk, { ...monthParams, lastTransitions: completed }),
    paginateAll(sdk, { ...monthParams, lastTransitions: refunded }),
    paginateAll(sdk, monthParams).then(all =>
      all.filter(tx => !skip.has(tx?.attributes?.lastTransition))
    ),
  ]);

  const { total: completedTotalAmount, currency: c1 } = sumPayout(completedTxs);
  const { total: pendingTotalAmount, currency: c2 } = sumPayout(pendingTxs);
  const { total: currentMonthCompletedAmount, currency: c3 } = sumPayout(mCompletedTxs);
  const { total: currentMonthPendingAmount } = sumPayout(mPendingTxs);

  return {
    completedTotalAmount,
    pendingTotalAmount,
    cancelledCount: refundedTxs.length,
    currentMonthCompletedAmount,
    currentMonthPendingAmount,
    currentMonthCancelledCount: mRefundedTxs.length,
    currency: c1 || c2 || c3 || null,
  };
}

router.get('/summary', async (req, res) => {
  const sdk = getSdk(req, res);

  let userId;
  try {
    const me = await sdk.currentUser.show();
    userId = me?.data?.data?.id?.uuid;
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const completed = parseList(req.query.completed);
  const refunded = parseList(req.query.refunded);
  const processNames = parseList(req.query.processNames);
  if (completed.length === 0 || refunded.length === 0 || processNames.length === 0) {
    return res.status(400).json({ ok: false, error: 'missing_transition_params' });
  }

  // Cache key incorporates the transition shape so deploy-time process changes invalidate.
  const cacheKey = `${userId}|${completed.join(',')}|${refunded.join(',')}|${processNames.join(
    ','
  )}`;
  const { data: cached } = summaryCache[cacheKey] || {};
  if (cached) {
    return res.json({ ok: true, ...cached });
  }

  try {
    const summary = await computeSummary(sdk, { completed, refunded, processNames });
    summaryCache[cacheKey] = summary;
    return res.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[my-balance] summary computation failed:', err);
    return res.status(502).json({ ok: false, error: 'summary_failed' });
  }
});

module.exports = router;
