#!/usr/bin/env node
/**
 * Lender Request Reminder SMS Script — 2-phase escalation (10.0 PR-4)
 *
 * Sends up to two follow-up SMS to the lender if they haven't accepted or
 * rejected a borrow request within the 24-hour expiration window:
 *   - 60m phase (gentle nudge)
 *   - 22h phase (final warning, 2h before expiration)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * WHY / WHAT
 * ──────────────────────────────────────────────────────────────────────────
 * A borrower creates a request and the lender is notified immediately via
 * the initial lender SMS (see server/api/initiate-privileged.js). Under
 * the 10.0 24h expire window (process.edn v5), requests auto-expire at
 * min(firstEnteredPreauthorized + 24h, bookingStart + 1d, bookingEnd).
 *
 * If the lender doesn't act, this worker nudges them twice:
 *   - 60m: "Don't leave ${first} hanging! ... Just tap before it expires"
 *   - 22h: "⚠️ Final call — your ${payout} payout is about to expire."
 *
 * ──────────────────────────────────────────────────────────────────────────
 * PHASE WINDOWS
 * ──────────────────────────────────────────────────────────────────────────
 * Phases are non-overlapping age buckets evaluated per-tx per-cron-tick:
 *
 *   60m phase: [60m, 22h)   — gentle nudge
 *   22h phase: [22h, 24h)   — final warning
 *
 * Each phase has its own Redis dedupe key, so a tx that passes through
 * both windows on successive cron ticks gets exactly one SMS per phase
 * (two total). Txs outside both windows are skipped.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * QUIET-HOURS POLICY
 * ──────────────────────────────────────────────────────────────────────────
 * The 60m phase respects the standard withinSendWindow gate (8am-11pm PT;
 * out-of-window cron ticks defer until in-window, which works because the
 * 60m window is 21 hours wide and absorbs any quiet-hours gap).
 *
 * The 22h phase BYPASSES quiet-hours. Rationale: the phase window is only
 * 2 hours wide. Borrowers who check out between 1am-3am PT would have
 * their 22h final warning land entirely in the 11pm-1am PT quiet-hours
 * block; by the time 8am rolls around, the tx has already expired and
 * the warning is lost. A brief after-hours text when money is 2h from
 * expiring is preferable to a silent miss (operator decision, April 23,
 * 2026).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * IDEMPOTENCY CONTRACT (Redis-backed, per-phase)
 * ──────────────────────────────────────────────────────────────────────────
 * Keys per transaction per phase:
 *
 *   lenderReminder:{txId}:{phase}:sent     (TTL 7 days)
 *   lenderReminder:{txId}:{phase}:inFlight (TTL 10 min)
 *
 * where {phase} is "60m" or "22h". The send sequence is per-phase:
 *
 *   1. If {phase}:sent exists → skip phase.
 *   2. If {phase}:inFlight exists → skip (crash auto-clears at 10m).
 *   3. SET {phase}:inFlight with 10-min TTL.
 *   4. Call sendSMS() with phase-specific copy + tag.
 *   5a. On success → SET {phase}:sent (7-day TTL), DEL {phase}:inFlight.
 *   5b. On failure → DEL {phase}:inFlight so next cron tick can retry.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * MISSED_FINAL WATCHDOG (10.0 PR-4)
 * ──────────────────────────────────────────────────────────────────────────
 * After the main loop, a second query pass looks for transactions that
 * transitioned to :state/expired within the last 30 minutes (two cron
 * ticks) and checks whether their 22h:sent key exists in Redis. If not,
 * the 22h final warning was missed and we log [MISSED_FINAL] for ops
 * visibility. Steady-state: count=0; non-zero counts indicate clock skew,
 * phase-boundary bugs, or other slippage worth investigating.
 *
 * Per-tx dedupe: because the 30-min lookback overlaps two consecutive
 * 15-min cron ticks, each missed-final tx would otherwise log on both
 * ticks. A Redis key `lenderReminder:{txId}:missedFinal:logged` (1h TTL)
 * ensures we log + count exactly once per occurrence.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * CRON SCHEDULING (Render)
 * ──────────────────────────────────────────────────────────────────────────
 * Run every 15 minutes:
 *   *\/15 * * * * npm run worker:lender-request-reminders
 *
 * Local testing (no real SMS, no Redis writes):
 *   npm run test:lender-request-reminders
 */
require('dotenv').config();

let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve();
}

const getFlexSdk = require('../util/getFlexSdk');
const { shortLink } = require('../api-util/shortlink');
const { saleUrl } = require('../util/url');
const { getRedis } = require('../redis');
const { withinSendWindow, getNow } = require('../util/time');
const {
  calculateLenderPayoutTotal,
  formatMoneyServerSide,
} = require('../api-util/lenderEarnings');

// ---- CLI flags / env guards ----
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const getOpt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = has('--dry-run') || process.env.DRY_RUN === '1' || process.env.SMS_DRY_RUN === '1';
const VERBOSE = has('--verbose') || process.env.VERBOSE === '1';
const LIMIT = parseInt(getOpt('--limit', process.env.LIMIT || '0'), 10) || 0;
const ONLY_PHONE = process.env.ONLY_PHONE;

// Full cron coverage of the 24h expiration window (10.0 PR-4).
const MAX_AGE_MS = 24 * 60 * 60 * 1000;             // 24 hours
const INFLIGHT_TTL_SEC = 10 * 60;                   // 10 minutes — longer than any one SMS send
const SENT_TTL_SEC = 7 * 24 * 60 * 60;              // 7 days — comfortably outlasts 24h window
// The watchdog's 30-min lookback window overlaps across two consecutive
// cron ticks, so a single missed-final tx would otherwise log twice.
// 1h TTL is long enough to cover the lookback window with margin and
// short enough to free the key before the next day's possible recurrence.
const MISSED_FINAL_DEDUPE_TTL_SEC = 60 * 60;        // 1 hour

// 2-phase escalation: 60m gentle nudge, 22h final warning. Phase windows
// are non-overlapping by construction — a tx in [60m, 22h) hits the 60m
// phase only, [22h, 24h) hits the 22h phase only. Each phase has its own
// Redis dedupe key so a tx surviving both windows gets exactly 2 SMS.
//
// 22h BYPASSES quiet-hours (bypassQuietHours: true); 60m respects it.
const PHASES = [
  {
    key: '60m',
    minAgeMs: 60 * 60 * 1000,      // 1 hour
    maxAgeMs: 22 * 60 * 60 * 1000, // 22 hours
    tag: 'lender_request_reminder_60m',
    bypassQuietHours: false,
  },
  {
    key: '22h',
    minAgeMs: 22 * 60 * 60 * 1000, // 22 hours
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    tag: 'lender_request_reminder_22h',
    bypassQuietHours: true,
  },
];

const redisKey = (txId, suffix) => `lenderReminder:${txId}:${suffix}`;

// Compose the per-phase Redis key suffix (e.g., "60m:sent", "22h:inFlight").
const phaseKey = (phase, kind) => `${phase.key}:${kind}`;

const REQUEST_TRANSITIONS = new Set([
  'transition/request-payment',
  'transition/request-payment-after-inquiry',
  // confirm-payment fires automatically (Stripe) within seconds of
  // request-payment, so by the 60-min mark the lastTransition is almost
  // always confirm-payment and the state is preauthorized.
  'transition/confirm-payment',
]);

if (DRY) {
  const realSend = sendSMS;
  sendSMS = async (to, body, opts = {}) => {
    const { tag, meta } = opts;
    const metaJson = meta ? JSON.stringify(meta) : '{}';
    const bodyJson = JSON.stringify(body);
    console.log(`[SMS:OUT] tag=${tag || 'none'} to=${to} meta=${metaJson} body=${bodyJson} dry-run=true`);
    if (VERBOSE) console.log('opts:', opts);
    return { dryRun: true };
  };
}

/**
 * Redis-backed idempotency helpers — per-phase. No-op writes in DRY mode.
 * `phase` is a PHASES entry; keys resolve to e.g. "lenderReminder:{txId}:60m:sent".
 */
async function markInFlight(redis, txId, phase) {
  const key = redisKey(txId, phaseKey(phase, 'inFlight'));
  if (DRY) {
    console.log(`[lender-request-reminder] DRY-RUN: Would SET ${key} (TTL ${INFLIGHT_TTL_SEC}s)`);
    return;
  }
  await redis.set(key, new Date().toISOString(), 'EX', INFLIGHT_TTL_SEC);
}

async function clearInFlight(redis, txId, phase) {
  const key = redisKey(txId, phaseKey(phase, 'inFlight'));
  if (DRY) {
    console.log(`[lender-request-reminder] DRY-RUN: Would DEL ${key}`);
    return;
  }
  await redis.del(key);
}

async function markSent(redis, txId, phase) {
  const sentKey = redisKey(txId, phaseKey(phase, 'sent'));
  const inFlightKey = redisKey(txId, phaseKey(phase, 'inFlight'));
  if (DRY) {
    console.log(`[lender-request-reminder] DRY-RUN: Would SET ${sentKey} (TTL ${SENT_TTL_SEC}s)`);
    return;
  }
  await redis.set(sentKey, new Date().toISOString(), 'EX', SENT_TTL_SEC);
  await redis.del(inFlightKey);
}

async function sendLenderRequestReminders() {
  console.log('[lender-request-reminder] Starting lender request reminder SMS script...');

  try {
    const sdk = getFlexSdk();
    const redis = getRedis();

    const integrationClientId = process.env.INTEGRATION_CLIENT_ID || 'MISSING';
    const integrationBaseUrl =
      process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL ||
      process.env.SHARETRIBE_SDK_BASE_URL ||
      process.env.FLEX_INTEGRATION_API_BASE_URL ||
      'MISSING';

    console.log('[lender-request-reminder] Integration env summary', {
      hasClientId: !!integrationClientId && integrationClientId !== 'MISSING',
      integrationClientIdPrefix: integrationClientId !== 'MISSING' ? integrationClientId.slice(0, 6) : null,
      integrationBaseUrl,
    });

    console.log('[lender-request-reminder] SDK initialized');

    const query = {
      lastTransitions:
        'transition/request-payment,transition/request-payment-after-inquiry,transition/confirm-payment',
      include: ['listing', 'provider', 'customer'],
      'fields.listing': 'title',
      'fields.provider': 'profile',
      'fields.customer': 'profile',
      per_page: 100,
    };

    let transactions, included;
    try {
      const response = await sdk.transactions.query(query);
      transactions = response?.data?.data || [];
      included = new Map();
      for (const inc of response?.data?.included || []) {
        const key = `${inc.type}/${inc.id?.uuid || inc.id}`;
        included.set(key, inc);
      }
    } catch (queryError) {
      const responseBody =
        queryError.response?.data ||
        (typeof queryError.toJSON === 'function' ? queryError.toJSON() : null) ||
        queryError;
      console.error('[lender-request-reminder] Flex query failed', {
        status: queryError.response?.status,
        statusText: queryError.response?.statusText,
        data: queryError.response?.data,
        headers: queryError.response?.headers && {
          'x-sharetribe-request-id': queryError.response.headers['x-sharetribe-request-id'],
        },
        message: queryError.message,
        code: queryError.code,
        fallbackBody: responseBody,
      });
      try {
        console.error('[lender-request-reminder] Raw error dump:', JSON.stringify(responseBody, null, 2));
      } catch {
        console.error('[lender-request-reminder] Raw error (non-serializable):', responseBody);
      }
      throw queryError;
    }

    console.log(`[lender-request-reminder] Found ${transactions.length} eligible transactions`);
    if (transactions.length > 0) {
      // Log first few transactions for debugging state/transition visibility
      for (const t of transactions.slice(0, 5)) {
        const a = t?.attributes || {};
        const ageMin = a.createdAt ? Math.round((Date.now() - new Date(a.createdAt).getTime()) / 60000) : '?';
        console.log(`[lender-request-reminder]   tx=${t?.id?.uuid} state=${a.state} last=${a.lastTransition} ageMin=${ageMin}`);
      }
      if (transactions.length > 5) console.log(`[lender-request-reminder]   ... and ${transactions.length - 5} more`);
    }

    const now = new Date();
    const nowMs = now.getTime();
    let sent = 0, skipped = 0, failed = 0, processed = 0;

    for (const tx of transactions) {
      processed++;

      const txId = tx?.id?.uuid || tx?.id;
      const attrs = tx?.attributes || {};
      const state = attrs.state;
      const lastTransition = attrs.lastTransition;
      const protectedData = attrs.protectedData || {};

      // Re-check state & transition (query is a starting point, not a lock).
      // pending-payment: Stripe hasn't confirmed yet (rare at 60m, but possible).
      // preauthorized: Stripe confirmed, lender hasn't acted yet (the common case).
      // Note: Integration SDK returns namespaced states (e.g. 'state/preauthorized')
      const normalizedState = state?.replace(/^state\//, '') || '';
      if ((normalizedState !== 'pending-payment' && normalizedState !== 'preauthorized') || !REQUEST_TRANSITIONS.has(lastTransition)) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} — state=${state} lastTransition=${lastTransition}`);
        skipped++;
        continue;
      }

      // Age check + phase selection (10.0 PR-4).
      const createdAt = attrs.createdAt ? new Date(attrs.createdAt).getTime() : null;
      if (!createdAt) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} — no createdAt`);
        skipped++;
        continue;
      }
      const ageMs = nowMs - createdAt;
      // A tx can match at most one phase by construction (non-overlapping windows).
      const phase = PHASES.find(p => ageMs >= p.minAgeMs && ageMs < p.maxAgeMs);
      if (!phase) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} — ageMin=${Math.round(ageMs / 60000)} in no phase window`);
        skipped++;
        continue;
      }

      // Per-phase idempotency: inspect Redis flags for THIS phase only.
      let sentFlag = null;
      let inFlightFlag = null;
      try {
        sentFlag = await redis.get(redisKey(txId, phaseKey(phase, 'sent')));
        inFlightFlag = await redis.get(redisKey(txId, phaseKey(phase, 'inFlight')));
      } catch (redisErr) {
        console.error(`[lender-request-reminder] Redis read failed for tx ${txId} phase=${phase.key}, skipping to be safe:`, redisErr.message);
        skipped++;
        continue;
      }
      if (sentFlag) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} phase=${phase.key} — already sent at ${sentFlag}`);
        skipped++;
        continue;
      }
      if (inFlightFlag) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} phase=${phase.key} — inFlight since ${inFlightFlag}`);
        skipped++;
        continue;
      }

      // Resolve provider (lender) phone
      const providerRef = tx?.relationships?.provider?.data;
      const providerKey = providerRef ? `${providerRef.type}/${providerRef.id?.uuid || providerRef.id}` : null;
      const provider = providerKey ? included.get(providerKey) : null;
      const providerPhone =
        provider?.attributes?.profile?.protectedData?.phone ||
        provider?.attributes?.profile?.protectedData?.phoneNumber ||
        null;

      if (!providerPhone) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} — no provider phone`);
        skipped++;
        continue;
      }
      if (ONLY_PHONE && providerPhone !== ONLY_PHONE) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping ${providerPhone} (ONLY_PHONE=${ONLY_PHONE})`);
        skipped++;
        continue;
      }

      // Borrower first name
      const customerRef = tx?.relationships?.customer?.data;
      const customerKey = customerRef ? `${customerRef.type}/${customerRef.id?.uuid || customerRef.id}` : null;
      const customer = customerKey ? included.get(customerKey) : null;
      let borrowerFirstName =
        customer?.attributes?.profile?.firstName ||
        customer?.attributes?.profile?.displayName?.split(/\s+/)[0] ||
        null;
      if (!borrowerFirstName) {
        const rawName = protectedData.customerName;
        if (typeof rawName === 'string' && rawName.trim()) {
          borrowerFirstName = rawName.trim().split(/\s+/)[0];
        }
      }
      if (!borrowerFirstName) borrowerFirstName = 'your borrower';

      // Lender payout from persisted line items
      const lineItems = attrs.lineItems || [];
      const payoutTotal = calculateLenderPayoutTotal(lineItems);
      const formattedPayout = payoutTotal ? formatMoneyServerSide(payoutTotal) : null;
      if (!formattedPayout) {
        if (VERBOSE) console.log(`[lender-request-reminder] Skipping tx ${txId} — could not compute lender payout from lineItems`);
        skipped++;
        continue;
      }

      // Short link to sale page (matches initial lender SMS)
      const fullSaleUrl = saleUrl(txId);
      let shortUrl = fullSaleUrl;
      try {
        shortUrl = await shortLink(fullSaleUrl);
      } catch (e) {
        console.warn(`[lender-request-reminder] shortLink failed for tx ${txId}, using full URL:`, e.message);
      }

      // Per-phase SMS copy. 22h refresh 2026-04-29: dropped explicit "in
      // 2 hours" — actual time-to-expire at the first tick is ~1h47m and
      // shrinks on each subsequent tick, so the literal claim was wrong.
      // New copy reframes around the payout being lost, no time mention.
      const message = phase.key === '60m'
        ? `Sherbrt 🍧: Don't leave ${borrowerFirstName} hanging! ${formattedPayout} is waiting for you! 🤑🤑🤑 Just tap before it expires: ${shortUrl}.`
        : `Sherbrt 🍧: ⚠️ Final call — your ${formattedPayout} payout is about to expire. Accept ${borrowerFirstName}'s borrow request now: ${shortUrl}`;

      const listingRef = tx?.relationships?.listing?.data;
      const listingId = listingRef?.id?.uuid || listingRef?.id || null;

      // Quiet-hours gate: applies to 60m phase only. 22h bypasses — a
      // brief after-hours text when money is 2h from expiring beats a
      // silent miss (operator decision, April 23, 2026).
      if (!phase.bypassQuietHours && !withinSendWindow(getNow())) {
        console.log(`[lender-request-reminder][QUIET-HOURS] tx=${txId} phase=${phase.key} age=${Math.round(ageMs / 60000)}m — deferred`);
        continue;
      }

      // Step 1: flag inFlight BEFORE sending (10-min TTL auto-clears on crash).
      try {
        await markInFlight(redis, txId, phase);
      } catch (flagErr) {
        console.error(`[lender-request-reminder] Failed to write inFlight flag for tx ${txId} phase=${phase.key}, skipping:`, flagErr.message);
        failed++;
        continue;
      }

      // Step 2: send
      let smsResult;
      try {
        smsResult = await sendSMS(providerPhone, message, {
          role: 'lender',
          tag: phase.tag,
          meta: { transactionId: txId, listingId, phase: phase.key },
        });
      } catch (smsErr) {
        console.error(`[lender-request-reminder] SMS failed for tx ${txId} phase=${phase.key}:`, smsErr?.message || smsErr);
        // Rollback: clear inFlight so next cron tick can retry (if still in window).
        try {
          await clearInFlight(redis, txId, phase);
        } catch (rollbackErr) {
          console.error(`[lender-request-reminder] Rollback DEL failed for tx ${txId} phase=${phase.key}:`, rollbackErr.message);
        }
        failed++;
        continue;
      }

      if (smsResult?.skipped) {
        console.log(`[lender-request-reminder] SMS skipped by sendSMS (${smsResult.reason}) for tx ${txId} phase=${phase.key}`);
        try {
          await clearInFlight(redis, txId, phase);
        } catch (e) {
          console.error(`[lender-request-reminder] Failed to clear inFlight after sendSMS skip:`, e.message);
        }
        skipped++;
        continue;
      }

      // Step 3: mark sent. If this write fails, inFlight stays set until
      // its 10-min TTL expires — by then the tx has aged past the phase
      // window and won't re-enter this branch. No double-text.
      try {
        await markSent(redis, txId, phase);
        sent++;
        console.log(`[lender-request-reminder] Sent ${phase.key} reminder for tx ${txId}`);
      } catch (postWriteErr) {
        console.error(`[lender-request-reminder] SMS sent but Redis SET :${phase.key}:sent failed for tx ${txId} — inFlight will TTL-expire:`, postWriteErr.message);
        sent++;
      }

      if (LIMIT && sent >= LIMIT) {
        console.log(`[lender-request-reminder] Limit reached (${LIMIT}). Stopping.`);
        break;
      }
    }

    // MISSED_FINAL watchdog (10.0 PR-4) + borrower-expired SMS dispatcher
    // (May 7, 2026 — 1c-SMS). After the main loop, query for transactions
    // that transitioned to :state/expired in the last 30 min (two 15-min
    // cron ticks) and:
    //   1. Confirm their 22h:sent key exists in Redis (MISSED_FINAL log).
    //      Missing keys mean the 22h final warning was lost — typically
    //      due to clock skew, phase-boundary miscalculation, or a cron
    //      outage. Steady-state log: [MISSED_FINAL_SUMMARY] count=0.
    //   2. Send the borrower a "request not accepted" SMS (1c-SMS) once
    //      per tx, dedupe key `lenderReminder:{txId}:borrowerExpired:sent`
    //      (7d TTL). Fires within 30 min of transition/expire — close
    //      enough to the moment of expire for borrowers (vs. building a
    //      separate cron). Includes a re-shop short link to the dresses
    //      grid so they can book another look right away.
    //      See sherbrt_transaction_comms_v13 → Log tab → 1c-SMS row.
    const WATCHDOG_LOOKBACK_MS = 30 * 60 * 1000;
    const expireWindow = new Date(Date.now() - WATCHDOG_LOOKBACK_MS);
    // Sept 11, 2026: the old /r/ short link had expired and rendered as
    // "invalid/expired link" for borrowers. Point at the canonical search
    // results page instead — no shortener, nothing to expire. Kept in sync
    // with the 2b-SMS link in server/api/transition-privileged.js.
    const BORROWER_EXPIRED_RESHOP_LINK = process.env.BORROWER_RESHOP_URL || 'https://sherbrt.com/s';

    try {
      const expiredResp = await sdk.transactions.query({
        lastTransitions: 'transition/expire',
        // Include customer so we can resolve borrower phone for 1c-SMS.
        include: ['customer'],
        // Sharetribe's query API doesn't filter on lastTransitionedAt
        // server-side; we over-fetch and filter client-side below.
        per_page: 50,
      });
      // Build included map for customer lookup (mirrors main loop pattern).
      const expiredIncluded = new Map();
      for (const inc of expiredResp?.data?.included || []) {
        const key = `${inc.type}/${inc.id?.uuid || inc.id}`;
        expiredIncluded.set(key, inc);
      }
      let missedFinalCount = 0;
      let borrowerExpiredSmsSent = 0;
      for (const tx of expiredResp?.data?.data || []) {
        const lastAt = tx?.attributes?.lastTransitionedAt;
        if (!lastAt || new Date(lastAt) < expireWindow) continue;
        const txId = tx?.id?.uuid || tx?.id;
        let twentyTwoSent = null;
        try {
          twentyTwoSent = await redis.get(redisKey(txId, '22h:sent'));
        } catch (redisErr) {
          console.warn(`[lender-request-reminder][WATCHDOG] Redis read failed for tx=${txId}:`, redisErr.message);
          continue;
        }
        if (!twentyTwoSent) {
          // Dedupe across consecutive cron ticks: the 30-min lookback
          // window overlaps the 15-min tick interval, so a single missed
          // tx would otherwise log on two ticks and inflate count by 2x.
          // 1h TTL is the cheapest fix (scope doc v3.1 step 7 spec).
          const dedupeKey = redisKey(txId, 'missedFinal:logged');
          let alreadyLogged = null;
          try {
            alreadyLogged = await redis.get(dedupeKey);
          } catch (redisErr) {
            console.warn(`[lender-request-reminder][WATCHDOG] Dedupe read failed for tx=${txId}, logging anyway:`, redisErr.message);
          }
          if (alreadyLogged) {
            // Already counted on a prior tick; skip silently.
            continue;
          }
          console.log(`[lender-request-reminder][MISSED_FINAL] tx=${txId} — expired without 22h warning fired`);
          missedFinalCount++;
          if (!DRY) {
            try {
              await redis.set(dedupeKey, new Date().toISOString(), 'EX', MISSED_FINAL_DEDUPE_TTL_SEC);
            } catch (redisErr) {
              console.warn(`[lender-request-reminder][WATCHDOG] Dedupe write failed for tx=${txId}:`, redisErr.message);
            }
          }
        }

        // 1c-SMS: borrower expired-request notification. Fires once per tx
        // when transition/expire is observed in the watchdog window.
        // Redis dedupe key is the source of truth (7d TTL outlasts any
        // realistic re-tick window — `transition/expire` is terminal,
        // tx can't re-fire it). DRY mode skips Redis writes.
        //
        // Quiet-hours: BYPASSED, same rationale as the 22h phase above.
        // The watchdog's lookback window is only 30 min wide (2 cron
        // ticks). A tx that hits expire during quiet hours (11pm-8am PT)
        // would, if deferred, fall out of the lookback before the next
        // in-window tick and the borrower SMS would be lost forever.
        // Tradeoff vs 22h: 1c isn't time-critical (borrower can re-shop
        // any time), but a silent miss is worse than a brief late-night
        // text saying "your request wasn't accepted." Operator decision
        // — flag here so the bypass is explicit.
        try {
          const borrowerSentKey = redisKey(txId, 'borrowerExpired:sent');
          let alreadySent = null;
          try {
            alreadySent = await redis.get(borrowerSentKey);
          } catch (redisErr) {
            console.warn(`[lender-request-reminder][1c-SMS] Redis read failed for tx=${txId}:`, redisErr.message);
            continue;
          }
          if (alreadySent) {
            if (VERBOSE) console.log(`[lender-request-reminder][1c-SMS] tx=${txId} already sent at ${alreadySent}`);
            continue;
          }

          // Resolve borrower phone — checkout protectedData wins over profile,
          // matching the precedence used in sendReturnReminders.js. Mirrors
          // its normalizePhoneCandidate() length check (>=7 chars) and emits
          // the same [PHONE-SELECTED] log line for ops parity.
          const normalizePhoneCandidate = (val) => {
            const trimmed = val && String(val).trim();
            if (!trimmed) return null;
            return trimmed.length >= 7 ? trimmed : null;
          };
          const customerRef = tx?.relationships?.customer?.data;
          const customerKey = customerRef ? `${customerRef.type}/${customerRef.id?.uuid || customerRef.id}` : null;
          const customer = customerKey ? expiredIncluded.get(customerKey) : null;
          const pd = tx?.attributes?.protectedData || {};
          const checkoutPhone = normalizePhoneCandidate(
            pd.customerPhone ||
            pd.phone ||
            pd.customer_phone ||
            pd?.checkoutDetails?.customerPhone ||
            pd?.checkoutDetails?.phone
          );
          const profilePhone = normalizePhoneCandidate(
            customer?.attributes?.profile?.protectedData?.phoneNumber ||
            customer?.attributes?.profile?.protectedData?.phone
          );
          const borrowerPhone = checkoutPhone || profilePhone || null;

          if (!borrowerPhone) {
            console.warn(`[lender-request-reminder][1c-SMS] tx=${txId} no borrower phone — skipping`);
            continue;
          }
          if (ONLY_PHONE && borrowerPhone !== ONLY_PHONE) {
            if (VERBOSE) console.log(`[lender-request-reminder][1c-SMS] tx=${txId} ONLY_PHONE filter — skipping`);
            continue;
          }
          console.log(`[lender-request-reminder][1c-SMS][PHONE-SELECTED] tx=${txId} used=${checkoutPhone ? 'checkoutPhone(protectedData)' : 'profilePhone'}`);

          const borrowerExpiredMessage =
            `😔 Sherbrt 🍧: Your borrow request was not accepted this time. ` +
            `Don't worry — there's still time to book another look you love!  ` +
            `Check them out now! ${BORROWER_EXPIRED_RESHOP_LINK}`;

          const smsResult = await sendSMS(borrowerPhone, borrowerExpiredMessage, {
            role: 'customer',
            tag: 'borrower_request_expired',
            meta: { transactionId: txId, smsNumber: '1c' },
          });

          if (smsResult?.skipped) {
            console.log(`[lender-request-reminder][1c-SMS] tx=${txId} skipped by sendSMS (${smsResult.reason})`);
            continue;
          }

          if (!DRY) {
            try {
              await redis.set(borrowerSentKey, new Date().toISOString(), 'EX', SENT_TTL_SEC);
            } catch (redisErr) {
              console.warn(`[lender-request-reminder][1c-SMS] Redis SET sent flag failed for tx=${txId}:`, redisErr.message);
            }
          }
          borrowerExpiredSmsSent++;
          console.log(`[lender-request-reminder][1c-SMS] sent to borrower for tx=${txId}`);
        } catch (borrowerSmsErr) {
          // Borrower-SMS failures must not block missed-final logging or
          // subsequent txns. Log and move on.
          console.error(`[lender-request-reminder][1c-SMS] failed for tx=${txId}:`, borrowerSmsErr?.message || borrowerSmsErr);
        }
      }
      console.log(`[lender-request-reminder][MISSED_FINAL_SUMMARY] count=${missedFinalCount} lookbackMs=${WATCHDOG_LOOKBACK_MS}`);
      console.log(`[lender-request-reminder][BORROWER_EXPIRED_SMS_SUMMARY] sent=${borrowerExpiredSmsSent} lookbackMs=${WATCHDOG_LOOKBACK_MS}`);
    } catch (watchdogErr) {
      // Watchdog failures must not block the main cron. Log and continue.
      console.warn('[lender-request-reminder][WATCHDOG_ERROR]', watchdogErr?.message || watchdogErr);
    }

    console.log(`\n[lender-request-reminder] Done. Sent=${sent} Skipped=${skipped} Failed=${failed} Processed=${processed}`);
    if (DRY) {
      console.log('[lender-request-reminder] DRY-RUN mode: no real SMS were sent and no Redis keys were written.');
    }
  } catch (err) {
    console.error('[lender-request-reminder] Fatal:', {
      status: err.response && err.response.status,
      data: err.response && err.response.data,
      message: err.message,
      code: err.code,
    });
    process.exit(1);
  }
}

if (require.main === module) {
  sendLenderRequestReminders()
    .then(() => {
      console.log('[lender-request-reminder] Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[lender-request-reminder] Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { sendLenderRequestReminders };
