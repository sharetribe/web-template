'use strict';

const { getIntegrationSdk } = require('./integrationSdk');
const { sendWelcomeEmail } = require('./welcomeEmailService');
const { sendAdminAlert, sendUserWhatsApp, lookupUserPhone } = require('./whatsappService');
const { loadCursor, saveCursor } = require('./eventPollerCursor');
const { createTTLCache } = require('../api-util/cache');
const { withRetry } = require('./retry');

// Run notifications in parallel; log each rejection independently.
async function runNotifications(tasks) {
  const results = await Promise.allSettled(tasks.map(t => withRetry(t.fn, { label: t.label })));
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[eventPoller] ${tasks[i].label} failed after retries:`, r.reason);
    }
  });
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
// Defer the first poll so the dyno's listen() callback returns and the load
// balancer can route a health check before the poller's I/O burst kicks in.
const INITIAL_POLL_DELAY_MS = 5 * 1000;
const RECENT_EVENT_IDS_CAP = 500;

// Customer/provider relationships are immutable once a transaction exists, so
// 3 minutes is safe and absorbs message bursts within a single thread.
const TX_RELATIONSHIPS_CACHE_TTL_SECONDS = 180;
const txRelationshipsCache = createTTLCache(TX_RELATIONSHIPS_CACHE_TTL_SECONDS);

async function loadTransactionRelationships(sdk, transactionId) {
  if (!transactionId) return null;
  const { data: cached } = txRelationshipsCache[transactionId] || {};
  if (cached && cached.customerId !== undefined) return cached;

  const res = await sdk.transactions.show({ id: transactionId });
  const tx = res?.data?.data;
  const value = {
    customerId: tx?.relationships?.customer?.data?.id?.uuid || null,
    providerId: tx?.relationships?.provider?.data?.id?.uuid || null,
  };
  txRelationshipsCache[transactionId] = value;
  return value;
}

// Cursor — loaded from disk on startup; on a totally fresh boot we look back
// 10 minutes to avoid missing events during deployments.
let lastSequenceId = null;

// Insertion-ordered Set; keeps the last RECENT_EVENT_IDS_CAP processed event
// IDs so a duplicate poll (after restart with overlapping window) skips them.
const recentEventIds = new Set();

// Concurrency guard — a slow poll must not overlap with the next interval tick.
let isPolling = false;

function rememberEventId(eventId) {
  if (!eventId) return;
  if (recentEventIds.has(eventId)) {
    // Re-add to push it to the end of the insertion order.
    recentEventIds.delete(eventId);
  }
  recentEventIds.add(eventId);
  while (recentEventIds.size > RECENT_EVENT_IDS_CAP) {
    const oldest = recentEventIds.values().next().value;
    recentEventIds.delete(oldest);
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleNewUser(resource) {
  const attrs = resource?.attributes;
  if (!attrs) return;

  const email = attrs.email;
  const profile = attrs.profile || {};
  const firstName = profile.firstName || 'Usuario';
  const lastName = profile.lastName || '';
  const phone = profile.protectedData?.phoneNumber || null;

  console.log(`[eventPoller] New user: ${email}`);

  const tasks = [
    { label: 'welcome email', fn: () => sendWelcomeEmail({ email, firstName, lastName }) },
    { label: 'admin WhatsApp alert', fn: () => sendAdminAlert({ firstName, lastName, email }) },
  ];
  if (phone) {
    tasks.push({
      label: 'user welcome WhatsApp',
      fn: () =>
        sendUserWhatsApp({
          phone,
          templateName: 'av_welcome_user',
          params: [firstName],
        }),
    });
  }

  await runNotifications(tasks);
}

// Maps transition name fragments → { buyerTemplate, sellerTemplate, notifyBoth }
const TRANSITION_MAP = {
  '/purchased': {
    buyerTemplate: 'av_purchase_confirmed',
    sellerTemplate: 'av_sale_received',
    notifyBoth: true,
  },
  '/delivered': {
    buyerTemplate: 'av_delivered',
    notifyBoth: false,
  },
  '/cancelled': {
    buyerTemplate: 'av_cancelled',
    sellerTemplate: 'av_cancelled',
    notifyBoth: true,
  },
  '/accepted': {
    buyerTemplate: 'av_booking_accepted',
    notifyBoth: false,
  },
  '/declined': {
    buyerTemplate: 'av_booking_declined',
    notifyBoth: false,
  },
  '/offer-made': {
    sellerTemplate: 'av_new_message',
    notifyBoth: false,
  },
};

async function handleTransactionEvent(resource) {
  const sdk = getIntegrationSdk();
  const attrs = resource?.attributes || {};
  const transition = attrs.lastTransition || '';
  const relationships = resource?.relationships || {};

  // Find matching rule
  const matchedKey = Object.keys(TRANSITION_MAP).find(k => transition.endsWith(k));
  if (!matchedKey) return;

  const rule = TRANSITION_MAP[matchedKey];

  // Resolve user IDs from relationships
  const customerId = relationships.customer?.data?.id?.uuid;
  const providerId = relationships.provider?.data?.id?.uuid;

  const [customerPhone, providerPhone] = await Promise.all([
    customerId ? lookupUserPhone(sdk, customerId) : Promise.resolve(null),
    providerId ? lookupUserPhone(sdk, providerId) : Promise.resolve(null),
  ]);

  const tasks = [];
  if (rule.buyerTemplate && customerPhone) {
    tasks.push({
      label: 'buyer WhatsApp',
      fn: () => sendUserWhatsApp({ phone: customerPhone, templateName: rule.buyerTemplate }),
    });
  }
  if (rule.sellerTemplate && providerPhone) {
    tasks.push({
      label: 'seller WhatsApp',
      fn: () => sendUserWhatsApp({ phone: providerPhone, templateName: rule.sellerTemplate }),
    });
  }
  await runNotifications(tasks);
}

async function handleMessageEvent(resource) {
  const sdk = getIntegrationSdk();
  const relationships = resource?.relationships || {};

  // Determine the recipient: the other party in the transaction
  const transactionId = relationships.transaction?.data?.id?.uuid;
  const senderId = relationships.sender?.data?.id?.uuid;

  if (!transactionId) return;

  try {
    const { customerId, providerId } = await loadTransactionRelationships(sdk, transactionId);

    // The recipient is whichever party is NOT the sender
    const recipientId = senderId === customerId ? providerId : customerId;
    if (!recipientId) return;

    const recipientPhone = await lookupUserPhone(sdk, recipientId);
    if (recipientPhone) {
      await runNotifications([
        {
          label: 'message WhatsApp',
          fn: () =>
            sendUserWhatsApp({ phone: recipientPhone, templateName: 'av_new_message' }),
        },
      ]);
    }
  } catch (err) {
    console.error('[eventPoller] Message event handler failed:', err);
  }
}

// ─── Polling loop ─────────────────────────────────────────────────────────────

async function pollEvents() {
  if (isPolling) {
    console.warn('[eventPoller] Previous poll still running — skipping this tick');
    return;
  }
  isPolling = true;
  try {
    const sdk = getIntegrationSdk();

    // Cap each tick at 100 events; remainder is picked up on the next poll via lastSequenceId.
    const params = lastSequenceId
      ? { sequenceIdStart: lastSequenceId + 1, perPage: 100 }
      : { createdAtStart: new Date(Date.now() - 10 * 60 * 1000).toISOString(), perPage: 100 };

    let res;
    try {
      res = await sdk.events.query(params);
    } catch (err) {
      console.error('[eventPoller] Integration API query failed:', err);
      return;
    }

    const events = res?.data?.data || [];
    if (events.length > 0) {
      console.log(`[eventPoller] Processing ${events.length} event(s)`);
    }

    for (const event of events) {
      const { eventType, resource, sequenceId } = event.attributes;
      const eventId = event.id?.uuid || event.id;

      // Skip events we've already processed in a previous (overlapping) poll.
      if (eventId && recentEventIds.has(eventId)) {
        lastSequenceId = sequenceId;
        continue;
      }

      // Collect all handlers for this event type, then fire them in parallel.
      // Events are still processed in sequenceId order; only per-event handlers run concurrently.
      const handlers = [];
      if (eventType === 'user/created') handlers.push(() => handleNewUser(resource));
      else if (eventType === 'transaction/transitioned') handlers.push(() => handleTransactionEvent(resource));
      else if (eventType === 'message/created') handlers.push(() => handleMessageEvent(resource));

      if (handlers.length > 0) {
        await Promise.allSettled(
          handlers.map(h =>
            h().catch(err =>
              console.error(`[eventPoller] Handler error for event type "${eventType}":`, err)
            )
          )
        );
      }

      rememberEventId(eventId);
      lastSequenceId = sequenceId;
    }
  } finally {
    // Persist cursor + dedupe set after every poll. Failures are non-fatal
    // (logged inside saveCursor) so a transient disk error never wedges polling.
    await saveCursor({
      lastSequenceId,
      recentEventIds: Array.from(recentEventIds),
    });
    isPolling = false;
  }
}

/**
 * Start the polling loop. Safe to call multiple times (idempotent via interval ID check).
 */
let pollIntervalId = null;

async function startPoller() {
  if (pollIntervalId) return;

  console.log('[eventPoller] Starting Integration API event poller (interval: 5 min)');

  // Seed cursor + dedupe set from persisted state. On a totally fresh boot
  // this is a no-op and we fall back to the 10-minute lookback window.
  try {
    const seed = await loadCursor();
    lastSequenceId = seed.lastSequenceId;
    for (const id of seed.recentEventIds) recentEventIds.add(id);
    console.log(
      `[eventPoller] Loaded cursor: lastSequenceId=${lastSequenceId}, dedupe size=${recentEventIds.size}`
    );
  } catch (err) {
    console.warn('[eventPoller] Cursor seed failed, starting fresh:', err);
  }

  // Defer the first poll so the dyno can finish warming up; subsequent polls
  // run on the regular interval.
  const initialTimer = setTimeout(() => {
    pollEvents().catch(err => console.error('[eventPoller] Initial poll failed:', err));
  }, INITIAL_POLL_DELAY_MS);
  initialTimer.unref?.();

  pollIntervalId = setInterval(() => {
    pollEvents().catch(err => console.error('[eventPoller] Poll failed:', err));
  }, POLL_INTERVAL_MS);

  // Allow process to exit normally even with active interval
  if (pollIntervalId.unref) {
    pollIntervalId.unref();
  }
}

module.exports = { startPoller };
