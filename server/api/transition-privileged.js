const axios = require('axios');
const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');
const { getIntegrationSdk, txUpdateProtectedData } = require('../api-util/integrationSdk');
const { upsertProtectedData } = require('../lib/txData');
const { maskPhone } = require('../api-util/phone');
const { computeShipBy, computeShipByDate, formatShipBy, getBookingStartISO, keepStreet2, logShippoPayload, pickCheapestPreferredRate } = require('../lib/shipping');
const { contactEmailForTx, contactPhoneForTx } = require('../util/contact');
const { normalizePhoneE164 } = require('../util/phone');
const { buildShipLabelLink, orderUrl, saleUrl } = require('../util/url');
const { shortLink } = require('../api-util/shortlink');
const { timestamp } = require('../util/time');
const { getPublicTrackingUrl } = require('../lib/trackingLinks');
const { extractArtifacts } = require('../lib/shipping/extractArtifacts');
const { buildLenderShipByMessage } = require('../lib/sms/buildLenderShipByMessage');
const { buildShippoAddress } = require('../shippo/buildAddress');
const { validateAddress } = require('../shippo/validateAddress');
const { sendTransactionalEmail } = require('../email/emailClient');
const borrowerReturnLabelEmail = require('../email/borrower/borrowerReturnLabel');
const lenderOutboundLabelEmail = require('../email/lender/lenderOutboundLabel');

// ---- helpers (add once, top-level) ----
const safePick = (obj, keys = []) =>
  Object.fromEntries(keys.map(k => [k, obj && typeof obj === 'object' ? obj[k] : undefined]));

// Step 3 of persistent lender shipping address: hydrate missing provider*
// fields on the accept-transition params from the provider's saved
// profile.protectedData.lenderShippingAddress. Mutates params in place,
// writing to both flattened keys (params[k]) and params.protectedData[k]
// so the downstream missingProvider validation and the SDK transition
// call both observe the hydrated values. Empty/whitespace strings in the
// profile do NOT hydrate, and any client-supplied value wins.
function hydrateProviderFieldsFromProfile(params, lenderShippingAddress, providerEmail) {
  if (!params) return [];
  const addr = lenderShippingAddress || {};

  if (!params.protectedData) params.protectedData = {};
  const pd = params.protectedData;

  const isMissing = v =>
    v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  const nonEmpty = v => typeof v === 'string' && v.trim() !== '';

  const mapping = [
    ['providerStreet', addr.streetAddress],
    ['providerStreet2', addr.streetAddress2],
    ['providerCity', addr.city],
    ['providerState', addr.state],
    ['providerZip', addr.zipCode],
    ['providerPhone', addr.phoneNumber],
    ['providerEmail', providerEmail],
  ];

  const hydrated = [];
  for (const [key, valueFromProfile] of mapping) {
    const current = params[key] ?? pd[key];
    if (isMissing(current) && nonEmpty(valueFromProfile)) {
      params[key] = valueFromProfile;
      pd[key] = valueFromProfile;
      hydrated.push(key);
    }
  }

  return hydrated;
}

// Helper to check if customer has complete shipping address
const hasCustomerShipAddress = (pd) => {
  return !!(pd?.customerStreet?.trim() && pd?.customerZip?.trim());
};


const maskUrl = (u) => {
  try {
    if (!u) return '';
    const url = new URL(u);
    // keep origin + first 3 path signatures
    const parts = url.pathname.split('/').filter(Boolean).slice(0, 3);
    return `${url.origin}/${parts.join('/')}${parts.length ? '/...' : ''}`;
  } catch {
    return String(u || '').split('?')[0];
  }
};

// Helper function to parse expiry from QR code URL
function parseExpiresParam(url) {
  try {
    const u = new URL(url);
    const raw = u.searchParams.get('Expires');
    if (!raw) return null;
    const seconds = Number(raw);
    if (!Number.isFinite(seconds)) return null;
    return new Date(seconds * 1000).toISOString(); // normalize to ISO
  } catch {
    return null;
  }
}

const logTx = (tx) => ({
  object_id: tx?.object_id,
  status: tx?.status,
  tracking_number: tx?.tracking_number,
  tracking_url_provider: tx?.tracking_url_provider,
  label_url: tx?.label_url,
  qr_code_url: tx?.qr_code_url,
});

// Minimal masking for Shippo tokens to avoid leaking credentials in logs
const maskTokenTail = (token) => {
  if (!token) return null;
  const str = String(token);
  return `***${str.slice(-4)}`;
};

// Shippo metadata must be <= 100 chars; keep it minimal but still correlate webhooks
const SHIPPO_METADATA_MAX = 100;
function buildShippoMetadataString({ txId, direction }) {
  const metadata = `tx=${txId || 'missing'}|dir=${direction || 'unknown'}`;
  if (metadata.length > SHIPPO_METADATA_MAX) {
    console.warn('[SHIPPO][METADATA][TRUNCATE]', {
      len: metadata.length,
      max: SHIPPO_METADATA_MAX,
      direction,
      txId,
    });
    return metadata.slice(0, SHIPPO_METADATA_MAX);
  }
  return metadata;
}

// Identify whether we are using a Shippo test or live token
const detectShippoMode = (token) => {
  if (!token) return 'missing';
  const str = String(token);
  if (str.includes('test')) return 'test';
  if (str.includes('live')) return 'live';
  return 'unknown';
};

let shippoEnvLogged = false;
function logShippoEnvOnce() {
  if (shippoEnvLogged) return;
  shippoEnvLogged = true;
  const token = process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_TOKEN || '';
  console.log('[SHIPPO][ENV][BOOT]', {
    tokenVar: process.env.SHIPPO_API_TOKEN ? 'SHIPPO_API_TOKEN' : (process.env.SHIPPO_TOKEN ? 'SHIPPO_TOKEN' : 'missing'),
    tokenSuffix: token ? token.slice(-4) : null,
    mode: detectShippoMode(token),
    hasToken: !!token,
  });
  // NOTE: Shippo test tokens surface labels in the Shippo test dashboard (Transactions tab).
  // Live dashboards will not display purchases made with test tokens.
}

// Choose the best link to send in SMS according to business rules:
// 1) UPS preferred: use QR if present, else label.
// 2) If USPS fallback: use label (never QR).
// 3) Else: any label.
// 4) Else: tracking.
function pickBestOutboundLink({ carrier, qrUrl, labelUrl, trackingUrl }) {
  const c = (carrier || '').toUpperCase();
  // UPS first: prefer QR, then label
  if (c === 'UPS') {
    if (qrUrl) return qrUrl;
    if (labelUrl) return labelUrl;
  }
  // USPS fallback: label only (no QR)
  if (c === 'USPS') {
    if (labelUrl) return labelUrl;
  }
  // Any other carrier: prefer label if present
  if (labelUrl) return labelUrl;
  // Last resort: tracking
  if (trackingUrl) return trackingUrl;
  return null;
}

/**
 * Retry wrapper with exponential backoff for UPS 10429 "Too Many Requests" errors
 * @param {Function} fn - Async function to execute
 * @param {Object} opts - Options { retries, baseMs }
 * @returns {Promise} Result of fn() or throws error after retries exhausted
 */
async function withBackoff(fn, { retries = 2, baseMs = 600 } = {}) {
  try {
    return await fn();
  } catch (e) {
    // Extract error code from various response shapes
    const code = e?.response?.data?.messages?.[0]?.code || 
                 e?.response?.data?.error?.code ||
                 e?.code || '';
    
    // Check if this is a UPS 10429 rate limit error
    const isRateLimit = String(code).includes('10429') || 
                        (e?.response?.status === 429) ||
                        (e?.message && e.message.includes('Too Many Requests'));
    
    if (retries > 0 && isRateLimit) {
      const wait = baseMs * Math.pow(2, 2 - retries);
      
      if (process.env.DEBUG_SHIPPO === '1') {
        console.warn('[shippo][retry] UPS 10429 or rate limit detected, backing off', { 
          retriesLeft: retries, 
          waitMs: wait,
          code: code || 'unknown'
        });
      }
      
      await new Promise(r => setTimeout(r, wait));
      return withBackoff(fn, { retries: retries - 1, baseMs });
    }
    
    throw e;
  }
}
// ---------------------------------------

const { preferredServices: CONFIG_PREFERRED_SERVICES } = require('../config/shipping');
const SAFETY_BUFFER_DAYS = Number(process.env.SHIP_SAFETY_BUFFER || 1);

/**
 * Select the cheapest allowed shipping rate that meets the deadline,
 * preferring UPS Ground when it fits. 10.0 PR-1 step 4 refactor:
 *   - Drops the old `shipByDate` param; takes `daysUntilBookingStart` directly.
 *   - Actually filters by `preferredServices` config list FIRST (was missing).
 *   - Reads `SAFETY_BUFFER_DAYS` from env instead of hardcoded buffer=1.
 *   - Last-resort fallback is cheapest-of-preferred, not cheapest-of-all,
 *     so we don't accidentally select a disabled carrier.
 *
 * @param {Array} availableRates - Rate objects from Shippo
 * @param {Object} opts
 * @param {number} opts.daysUntilBookingStart - Calendar days from now to bookingStart
 * @param {Array<string>} [opts.preferredProviders=['UPS','USPS']] - Provider preference order
 * @returns {Object|null} Selected rate object or null if no rates
 */
function pickCheapestAllowedRate(availableRates, { daysUntilBookingStart, preferredProviders = ['UPS', 'USPS'] }) {
  if (!Array.isArray(availableRates) || availableRates.length === 0) return null;

  const daysUntil = daysUntilBookingStart ?? 999;
  const buffer = SAFETY_BUFFER_DAYS;

  // Strip trademark symbols (® U+00AE, ™ U+2122). Shippo returns several
  // UPS services with ® in servicelevel.name (e.g., "UPS 2nd Day Air®",
  // "UPS Next Day Air Saver®"). Config entries are plain ASCII — without
  // this strip, those services would fail the preferredServices filter.
  const nameOf = r => `${r.provider || r.carrier || ''} ${r.servicelevel?.name || r.service?.name || r.provider_service || ''}`.replace(/[®™]/g, '').trim();

  const norm = availableRates.map(r => ({
    provider: String(r.provider || '').toUpperCase(),
    token: r.servicelevel?.token || r.service?.token || '',
    name: nameOf(r),
    amount: Number(r.amount ?? r.amount_local ?? r.rate ?? 1e9),
    estDays: Number(r.estimated_days ?? r.duration_terms ?? 999),
    raw: r,
  }));

  // Filter to preferred services FIRST (this is what was missing)
  const preferredFiltered = CONFIG_PREFERRED_SERVICES.length
    ? norm.filter(n => CONFIG_PREFERRED_SERVICES.includes(n.name))
    : norm;

  // Then apply provider preference order within the preferred set
  let candidates = [];
  for (const p of preferredProviders.map(p => p.toUpperCase())) {
    const subset = preferredFiltered.filter(n => n.provider === p);
    if (subset.length) { candidates = subset; break; }
  }
  if (!candidates.length) candidates = preferredFiltered.length ? preferredFiltered : norm;

  // Prefer UPS Ground if it meets the deadline
  const ground = candidates.filter(n => n.token === 'ups_ground').sort((a, b) => a.amount - b.amount);
  if (ground.length && (ground[0].estDays + buffer) <= daysUntil) return ground[0].raw;

  // Otherwise cheapest that meets the deadline
  const feasible = candidates.filter(n => (n.estDays + buffer) <= daysUntil).sort((a, b) => a.amount - b.amount);
  if (feasible.length) return feasible[0].raw;

  // Last resort: cheapest within the preferred candidates set (expedited
  // lands here for very tight bookings). Not cheapest-of-all.
  return candidates.sort((a, b) => a.amount - b.amount)[0].raw;
}

// task #29: $2 cents threshold for ops-alerting on a re-rate price delta
// between the checkout-time locked rate and the accept-time fresh rate.
const LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS = 200;

/**
 * Find a fresh-shipment rate that matches the checkout-time locked rate
 * by `provider` (case-insensitive) + `servicelevel.token` (exact). Used at
 * accept time so we re-rate against the freshly-created shipment (with
 * canonical, USPS-validated addresses) rather than purchasing the locked
 * rate's object_id directly — Shippo binds rates to their original
 * shipment, and the checkout-time shipment had ZIP-only ('N/A') addresses
 * that USPS rejects at /transactions/.
 *
 * Exact-or-fail by design: never falls back to "cheapest" when the locked
 * service-level is missing from fresh rates. A silent carrier swap would
 * change the borrower's quote — caller must hard-fail with
 * `unprintable_at_accept` instead.
 *
 * @param {Array} freshRates - Rate objects from the fresh accept-time shipment
 * @param {Object} lockedRate - { provider, servicelevel:{token,name}, ... }
 * @returns {Object|null} The matching fresh rate, or null if no match.
 */
function findMatchingRate(freshRates, lockedRate) {
  if (!Array.isArray(freshRates) || !freshRates.length) return null;
  if (!lockedRate) return null;

  const lockedProvider = String(lockedRate.provider || '').toUpperCase();
  const lockedToken = lockedRate?.servicelevel?.token || '';
  if (!lockedProvider || !lockedToken) return null;

  return freshRates.find(r => {
    const provider = String(r.provider || r.carrier || '').toUpperCase();
    const token = r?.servicelevel?.token || r?.service?.token || '';
    return provider === lockedProvider && token === lockedToken;
  }) || null;
}

// ---------------------------------------

// Conditional import of sendSMS to prevent module loading errors
let sendSMS = null;
try {
  const smsModule = require('../api-util/sendSMS');
  sendSMS = smsModule.sendSMS;
} catch (error) {
  console.warn('⚠️ SMS module not available — SMS functionality disabled');
  sendSMS = () => Promise.resolve(); // No-op function
}

// QR delivery reliability: Redis cache for transaction QR data
const { getRedis } = require('../redis');
const redis = getRedis();
const { setTrackingIndex } = require('../lib/trackingIndex');

// Log cache mode on startup
console.log('[qr-cache] mode:', redis.status === 'mock' ? 'in-memory' : 'redis');

// Note: Legacy persistWithRetry function has been removed.
// Use upsertProtectedData from server/lib/txData.js instead for all Shippo label persistence.

console.log('🚦 transition-privileged endpoint is wired up');

// Helper function to get borrower phone number with fallbacks
// DEPRECATED: Use contactPhoneForTx from util/contact.js instead
const getBorrowerPhone = (params, tx) => {
  const txPD = tx?.protectedData || tx?.attributes?.protectedData || {};
  const cust = tx?.relationships?.customer?.attributes;
  const profilePhone = cust?.profile?.protectedData?.phone ?? cust?.protectedData?.phone;
  
  // Use PD-first helper
  return contactPhoneForTx(tx, profilePhone);
};

// Helper function to get lender phone number with fallbacks
const getLenderPhone = (params, tx) => {
  const txPD = tx?.protectedData || tx?.attributes?.protectedData || {};
  const prov = tx?.relationships?.provider?.attributes;
  const profilePhone = prov?.profile?.protectedData?.phone ?? prov?.protectedData?.phone;
  
  // Provider phone uses similar PD-first logic
  return txPD.providerPhone && String(txPD.providerPhone).trim()
    ? String(txPD.providerPhone).trim()
    : (profilePhone && String(profilePhone).trim() ? String(profilePhone).trim() : null);
};

// --- Shippo label creation logic extracted to a function ---
//
// RETURN LABEL FLOW DOCUMENTATION:
// - Return label is created here: Lines ~848-1148 (inside createShippingLabels function)
//   Specifically, return label purchase happens at lines ~1007-1019 (returnTransactionRes)
// - Return label URL/short link is stored as: 
//   - protectedData.returnQrUrl (preferred for USPS, QR code URL)
//   - protectedData.returnLabelUrl (fallback, PDF label URL)
//   - Both persisted via upsertProtectedData() at lines ~1035-1054
// - Day-of-return SMS pulls label link from: 
//   - sendReturnReminders.js line ~204-209 checks: returnData.label?.url || pd.returnLabelUrl || pd.returnQrUrl
//   - Uses shortLink() helper to create short URL for SMS
// - Lender outbound label email: Sent immediately after outbound label SMS (line ~813+)
//   - Uses same outboundLabelUrl/outboundQrUrl as SMS
//   - Idempotency via protectedData.lenderOutboundLabelEmailSent flag
//   - Provider email retrieved from transaction/listing relationships
// - Return label email: Sent immediately after return label creation (line ~1142+)
//   - Uses same returnQrUrl/returnLabelUrl as SMS
//   - Idempotency via protectedData.borrowerReturnLabelEmailSent flag
//
async function createShippingLabels({ 
  txId, 
  listing, 
  protectedData, 
  providerPhone, 
  integrationSdk, 
  sendSMS, 
  normalizePhone, 
  selectedRate,
  transaction
}) {
  console.log('🚀 [SHIPPO] Starting label creation for transaction:', txId);
  console.log('📋 [SHIPPO] Using protectedData:', protectedData);
  
  // ──────────────────────────────────────────────────────────────────────────────
  // EMAIL SUPPRESSION CONFIGURATION
  // ──────────────────────────────────────────────────────────────────────────────
  // Check if recipient email suppression is enabled (to prevent UPS Quantum View emails)
  const suppress = String(process.env.SHIPPO_SUPPRESS_RECIPIENT_EMAIL || '').toLowerCase() === 'true';
  console.log('[SHIPPO] Recipient email suppression:', suppress ? 'ON' : 'OFF');
  logShippoEnvOnce();
  const shippoToken = process.env.SHIPPO_API_TOKEN || process.env.SHIPPO_TOKEN || '';
  const shippoMode = detectShippoMode(shippoToken);
  
  // Extract raw address data from protectedData
  const rawProviderAddress = {
    name: protectedData.providerName || 'Provider',
    street1: protectedData.providerStreet,
    street2: protectedData.providerStreet2,
    city: protectedData.providerCity,
    state: protectedData.providerState,
    zip: protectedData.providerZip,
    country: 'US',
    email: protectedData.providerEmail,
    phone: protectedData.providerPhone,
  };
  
  const rawCustomerAddress = {
    name: protectedData.customerName || 'Customer',
    street1: protectedData.customerStreet,
    street2: protectedData.customerStreet2,
    city: protectedData.customerCity,
    state: protectedData.customerState,
    zip: protectedData.customerZip,
    country: 'US',
    email: protectedData.customerEmail,
    phone: protectedData.customerPhone,
  };
  
  // Build Shippo-compatible addresses with email suppression logic
  // Lender (provider) always keeps email for shippo notifications
  let addressFrom = buildShippoAddress(rawProviderAddress, { suppressEmail: false });
  // Borrower (customer) email suppressed when flag is ON (to prevent UPS emails)
  let addressTo = buildShippoAddress(rawCustomerAddress, { suppressEmail: suppress });
  
  // ──────────────────────────────────────────────────────────────────────────────
  // EXPLICIT STREET2 GUARD: Ensure street2 is preserved in Shippo payload
  // ──────────────────────────────────────────────────────────────────────────────
  // Outbound: from.street2 = providerStreet2, to.street2 = customerStreet2
  // If buildShippoAddress dropped street2, re-apply from raw data
  if (rawProviderAddress.street2 && !addressFrom.street2) {
    console.warn('[STREET2-GUARD] Re-applying addressFrom.street2 from raw data');
    addressFrom.street2 = rawProviderAddress.street2;
  }
  if (rawCustomerAddress.street2 && !addressTo.street2) {
    console.warn('[STREET2-GUARD] Re-applying addressTo.street2 from raw data');
    addressTo.street2 = rawCustomerAddress.street2;
  }
  
  // Log addresses for debugging
  console.log('🏷️ [SHIPPO] Provider address (from):', addressFrom);
  console.log('🏷️ [SHIPPO] Customer address (to):', addressTo);
  
  // Runtime guard: ensure no email leaks when suppression is ON
  if (suppress && addressTo.email) {
    console.warn('[SHIPPO] Removing email due to suppression flag.');
    delete addressTo.email;
  }
  
  // Validate that we have complete address information
  const hasCompleteProviderAddress = addressFrom.street1 && addressFrom.city && addressFrom.state && addressFrom.zip;
  const hasCompleteCustomerAddress = addressTo.street1 && addressTo.city && addressTo.state && addressTo.zip;
  
  if (!hasCompleteProviderAddress) {
    console.warn('⚠️ [SHIPPO] Incomplete provider address — skipping label creation');
    return { success: false, reason: 'incomplete_provider_address' };
  }
  
  if (!hasCompleteCustomerAddress) {
    console.warn('⚠️ [SHIPPO] Incomplete customer address — skipping label creation');
    return { success: false, reason: 'incomplete_customer_address' };
  }
  
  if (!process.env.SHIPPO_API_TOKEN) {
    console.warn('⚠️ [SHIPPO] SHIPPO_API_TOKEN missing — skipping label creation');
    return { success: false, reason: 'missing_api_token' };
  }
  
  let outboundLabelResult = null;
  let returnLabelResult = null;
  let shippoTransactionId = null;
  let shippoRateId = null;

  try {
    console.log('📦 [SHIPPO] Creating outbound shipment (provider → customer)...');
    
    // Define the required parcel
    const parcel = {
      length: '12',
      width: '10',
      height: '1',
      distance_unit: 'in',
      weight: '0.75',
      mass_unit: 'lb'
    };

    // ──────────────────────────────────────────────────────────────────────────────
    // PRE-SHIPPO DIAGNOSTIC LOGGING (OUTBOUND)
    // ──────────────────────────────────────────────────────────────────────────────
    const redactPhone = s => s ? s.replace(/\d(?=\d{2})/g, '•') : s;
    
    console.info('[shippo][pre] outbound=true carrier=UPS/USPS');
    console.info('[shippo][pre] address_from (provider→customer)', {
      name: addressFrom?.name,
      street1: addressFrom?.street1,
      street2: addressFrom?.street2,     // ← MUST NOT be empty if we have an apt
      city: addressFrom?.city,
      state: addressFrom?.state,
      zip: addressFrom?.zip,
      phone: redactPhone(addressFrom?.phone)
    });
    console.info('[shippo][pre] address_to (customer)', {
      name: addressTo?.name,
      street1: addressTo?.street1,
      street2: addressTo?.street2,       // ← MUST NOT be empty if recipient has an apt
      city: addressTo?.city,
      state: addressTo?.state,
      zip: addressTo?.zip,
      phone: redactPhone(addressTo?.phone)
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // RE-APPLY STREET2 GUARD: Preserve street2 if normalizer/validator dropped it
    // ──────────────────────────────────────────────────────────────────────────────
    addressFrom = keepStreet2(rawProviderAddress, addressFrom);
    addressTo = keepStreet2(rawCustomerAddress, addressTo);

    // ──────────────────────────────────────────────────────────────────────────────
    // PRE-VALIDATE ADDRESSES via Shippo /addresses/?validate=true
    // ──────────────────────────────────────────────────────────────────────────────
    // USPS at /transactions/ (label-print) is stricter than at /addresses/ —
    // without ZIP+4, multi-unit addresses get rejected as "Address not found".
    // Pre-validate, then thread the canonical (with ZIP+4) into the shipment
    // payload so USPS sees the form it just approved. Hard-fail on is_valid:false
    // (don't print a label that USPS will reject); transient errors fall through
    // to the un-normalized address (don't block on Shippo outage).
    {
      const [provValidation, custValidation] = await Promise.all([
        validateAddress(addressFrom),
        validateAddress(addressTo),
      ]);

      const failedSide = !provValidation.valid && !provValidation.transient
        ? 'provider'
        : (!custValidation.valid && !custValidation.transient ? 'customer' : null);

      if (failedSide) {
        const failed = failedSide === 'provider' ? provValidation : custValidation;
        const reason = failedSide === 'provider' ? 'invalid_provider_address' : 'invalid_recipient_address';
        const failedAddress = failedSide === 'provider' ? addressFrom : addressTo;

        console.warn(`⚠️ [SHIPPO] ${failedSide === 'provider' ? 'Provider' : 'Customer'} address failed USPS validation`, {
          txId,
          messages: failed.messages,
          address: {
            street1: failedAddress.street1,
            street2: failedAddress.street2,
            city: failedAddress.city,
            state: failedAddress.state,
            zip: failedAddress.zip,
          },
        });

        // Persist failure to protectedData so the client can render a banner
        // on its next refresh (createShippingLabels is fire-and-forget — the
        // HTTP response has already been sent at this point).
        try {
          await upsertProtectedData(txId, {
            labelCreationError: {
              code: reason,
              failedSide,
              validationMessages: failed.messages,
              occurredAt: timestamp(),
            },
          }, { source: 'shippo' });
        } catch (persistErr) {
          console.error('❌ [PERSIST] Failed to save labelCreationError:', persistErr.message);
        }

        // Surface to ops via the existing OPS_ALERT_EMAIL channel.
        try {
          await sendTransactionalEmail({
            to: process.env.OPS_ALERT_EMAIL || 'amalyb@gmail.com',
            subject: `[Sherbrt] Label blocked — ${reason} (tx ${txId?.slice(0, 8)})`,
            text: [
              `Label creation was blocked because USPS rejected the ${failedSide} address.`,
              ``,
              `tx: ${txId}`,
              `side: ${failedSide}`,
              `reason: ${reason}`,
              `address: ${failedAddress.street1}${failedAddress.street2 ? ', ' + failedAddress.street2 : ''}, ${failedAddress.city}, ${failedAddress.state} ${failedAddress.zip}`,
              ``,
              `validation messages:`,
              ...failed.messages.map(m => `  - ${m}`),
              ``,
              `The accept transition succeeded; only the label was blocked. Manually contact the user to confirm the address.`,
            ].join('\n'),
          });
        } catch (emailErr) {
          console.error('❌ [OPS-ALERT] Failed to send label-blocked email:', emailErr.message);
        }

        return { success: false, reason, validationMessages: failed.messages };
      }

      // Soft-warning pass-through: log but proceed.
      if (provValidation.valid && provValidation.messages.length) {
        console.info('[SHIPPO] Provider address validated with warnings:', provValidation.messages);
      }
      if (custValidation.valid && custValidation.messages.length) {
        console.info('[SHIPPO] Customer address validated with warnings:', custValidation.messages);
      }

      // Use the canonical (USPS-approved, with ZIP+4) for the rest of the flow.
      // Transient failures fall through with normalized:null, leaving addresses untouched.
      if (provValidation.normalized) {
        addressFrom = { ...addressFrom, ...provValidation.normalized };
      }
      if (custValidation.normalized) {
        addressTo = { ...addressTo, ...custValidation.normalized };
      }

      // Defensive: re-apply street2 from raw if the canonical spread omitted it.
      addressFrom = keepStreet2(rawProviderAddress, addressFrom);
      addressTo = keepStreet2(rawCustomerAddress, addressTo);

      console.info('[shippo][validated] outbound canonical addresses (post-/addresses/?validate=true)', {
        from: { street1: addressFrom.street1, street2: addressFrom.street2, city: addressFrom.city, state: addressFrom.state, zip: addressFrom.zip },
        to:   { street1: addressTo.street1,   street2: addressTo.street2,   city: addressTo.city,   state: addressTo.state,   zip: addressTo.zip },
      });
    }

    // Outbound shipment payload
    // Note: QR code will be requested per-carrier at purchase time (USPS only)
    const outboundPayload = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: [parcel],
      async: false
    };
    
    // DEBUG: log the *exact* payload we will send to Shippo
    logShippoPayload('outbound:shipment', { address_from: addressFrom, address_to: addressTo, parcels: [parcel] });
    
    console.log('📦 [SHIPPO] Outbound shipment payload:', JSON.stringify(outboundPayload, null, 2));

    // Create outbound shipment (provider → customer) with retry on UPS 10429
    const shipmentRes = await withBackoff(
      () => axios.post(
        'https://api.goshippo.com/shipments/',
        outboundPayload,
        {
          headers: {
            'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      ),
      { retries: 2, baseMs: 600 }
    );

    console.log('📦 [SHIPPO] Outbound shipment created successfully');
    console.log('📦 [SHIPPO] Shipment ID:', shipmentRes.data.object_id);
    
    // 10.0 PR-2 step 3: shipByDate is now derived from the Shippo-selected
    // rate's estimated_days AFTER rate selection (see below, post-selectedRate).
    // Declared here with `let` so the post-selection assignment can overwrite.
    let shipByDate = null;

    // Select a shipping rate from the available rates
    let availableRates = shipmentRes.data.rates || [];
    const shipmentData = shipmentRes.data;
    
    console.log('📊 [SHIPPO] Available rates (before filtering):', availableRates.length);
    
    // ──────────────────────────────────────────────────────────────────────────────
    // SANDBOX CARRIER FILTERING: Limit to UPS/USPS in non-production mode
    // ──────────────────────────────────────────────────────────────────────────────
    const isProduction = String(process.env.SHIPPO_MODE || '').toLowerCase() === 'production';
    const allowedCarriers = ['UPS', 'USPS'];
    
    if (!isProduction && availableRates.length > 0) {
      const originalCount = availableRates.length;
      availableRates = availableRates.filter(rate => {
        const carrier = (rate.provider || rate.carrier || '').toUpperCase();
        return allowedCarriers.includes(carrier);
      });
      
      if (process.env.DEBUG_SHIPPO === '1') {
        console.info('[shippo][sandbox] Filtered carriers to UPS/USPS only', {
          mode: process.env.SHIPPO_MODE || 'sandbox',
          originalCount,
          filteredCount: availableRates.length,
          allowedCarriers
        });
      }
    }
    
    console.log('📊 [SHIPPO] Available rates (after filtering):', availableRates.length);
    
    // Diagnostics if no rates returned
    if (availableRates.length === 0) {
      console.error('❌ [SHIPPO][NO-RATES] No shipping rates available for outbound shipment');
      
      // Log Shippo messages for diagnostics
      if (shipmentData.messages && shipmentData.messages.length > 0) {
        console.error('[SHIPPO][NO-RATES] messages:', JSON.stringify(shipmentData.messages, null, 2));
      }
      
      // Log carrier accounts if available
      if (shipmentData.carrier_accounts && shipmentData.carrier_accounts.length > 0) {
        const carriers = shipmentData.carrier_accounts.map(c => c.carrier);
        console.error('[SHIPPO][NO-RATES] carrier_accounts:', carriers);
      }
      
      // Log addresses being used (masked) - INCLUDING street2 for apartment debugging
      if (process.env.DEBUG_SHIPPO === '1') {
        console.warn('[SHIPPO][NO-RATES] address_from:', {
          street1: addressFrom?.street1,
          street2: addressFrom?.street2,
          city: addressFrom?.city,
          state: addressFrom?.state,
          zip: addressFrom?.zip
        });
        console.warn('[SHIPPO][NO-RATES] address_to:', {
          street1: addressTo?.street1,
          street2: addressTo?.street2,
          city: addressTo?.city,
          state: addressTo?.state,
          zip: addressTo?.zip
        });
      }
      
      // Log parcel dimensions
      console.error('[SHIPPO][NO-RATES] parcel:', parcel);
      
      // Log the exact payload sent to Shippo (for comprehensive debugging)
      if (process.env.DEBUG_SHIPPO === '1') {
        console.error('[SHIPPO][NO-RATES] Full outbound payload sent to Shippo:', 
          JSON.stringify(outboundPayload, null, 2));
      }
      
      return { success: false, reason: 'no_shipping_rates' };
    }
    
    // 10.0 PR-2 step 6 — Option 6: ALWAYS use the locked rate at accept when
    // one exists. No feasibility check, no fallback re-selection. Borrower
    // preauth cost = actual label cost, always. The NO_LOCK_FALLBACK branch
    // exists only for pre-PR-2 transactions and the edge case of a Shippo
    // outage at checkout; after the migration tail, it should never fire.
    const preferredProviders = (process.env.SHIPPO_PREFERRED_PROVIDERS || 'UPS,USPS')
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(Boolean);

    const bookingStartISO = getBookingStartISO(transaction);
    const daysUntilBookingStart = bookingStartISO
      ? Math.ceil((new Date(bookingStartISO) - new Date()) / 86400000)
      : null;

    const lockedOutbound = protectedData?.outbound?.lockedRate;
    let selectedRate;

    if (lockedOutbound?.rateObjectId && lockedOutbound?.provider && lockedOutbound?.servicelevel?.token) {
      // task #29: re-rate at accept. Shippo binds rates to their original
      // shipment, so purchasing the locked rate's object_id directly would
      // make USPS validate against the checkout-time ZIP-only ('N/A')
      // shipment. Instead, find the same service-level in the FRESH
      // shipment (built with canonical, USPS-validated addresses) and
      // purchase THAT object_id. Borrower-preauth amount stays at
      // lockedRate.amountCents — Sherbrt absorbs any delta.
      const matched = findMatchingRate(availableRates, lockedOutbound);

      if (!matched) {
        const lockedDesc = `${lockedOutbound.provider} ${lockedOutbound?.servicelevel?.name || lockedOutbound?.servicelevel?.token}`;
        console.error('❌ [SHIPPO][RE-RATE][NO_MATCH] Locked service-level not present in fresh shipment rates', {
          txId,
          lockedProvider: lockedOutbound.provider,
          lockedToken: lockedOutbound?.servicelevel?.token,
          freshOptions: availableRates.map(r => ({ provider: r.provider, token: r?.servicelevel?.token })),
        });

        try {
          await upsertProtectedData(txId, {
            labelCreationError: {
              code: 'unprintable_at_accept',
              failedSide: 'outbound',
              lockedRate: {
                provider: lockedOutbound.provider,
                servicelevel: lockedOutbound.servicelevel,
                amountCents: lockedOutbound.amountCents,
              },
              freshOptions: availableRates.map(r => ({
                provider: r.provider,
                token: r?.servicelevel?.token,
                amount: r.amount,
              })),
              occurredAt: timestamp(),
            },
          }, { source: 'shippo' });
        } catch (persistErr) {
          console.error('❌ [PERSIST] Failed to save labelCreationError (unprintable_at_accept):', persistErr.message);
        }

        try {
          await sendTransactionalEmail({
            to: process.env.OPS_ALERT_EMAIL || 'amalyb@gmail.com',
            subject: `[Sherbrt] Label blocked — unprintable_at_accept (tx ${txId?.slice(0, 8)})`,
            text: [
              `Outbound label was blocked because the checkout-locked service-level (${lockedDesc}) is no longer offered for this shipment.`,
              ``,
              `tx: ${txId}`,
              `locked provider: ${lockedOutbound.provider}`,
              `locked token: ${lockedOutbound?.servicelevel?.token}`,
              `locked amount (cents): ${lockedOutbound.amountCents}`,
              ``,
              `fresh-shipment options:`,
              ...availableRates.map(r => `  - ${r.provider} ${r?.servicelevel?.token} @ $${r.amount}`),
              ``,
              `The accept transition succeeded; only the label was blocked. Manually contact the user to choose another service or refund.`,
            ].join('\n'),
          });
        } catch (emailErr) {
          console.error('❌ [OPS-ALERT] Failed to send unprintable_at_accept email:', emailErr.message);
        }

        return { success: false, reason: 'unprintable_at_accept' };
      }

      // Match found — use the FRESH rate's object_id. Decorate with
      // amountCents so downstream logs continue to surface the
      // borrower-preauth amount (lockedRate.amountCents) alongside the
      // fresh-rate amount actually being purchased.
      selectedRate = matched;

      const freshAmountCents = Math.round(parseFloat(matched.amount ?? matched.rate ?? 0) * 100);
      const lockedAmountCents = Number(lockedOutbound.amountCents);
      const deltaCents = Number.isFinite(lockedAmountCents) ? freshAmountCents - lockedAmountCents : null;

      console.log('[RATE-SELECT][OUTBOUND:LOCKED→FRESH]', {
        lockedRateId: lockedOutbound.rateObjectId,
        freshRateId: matched.object_id,
        provider: matched.provider,
        token: matched?.servicelevel?.token,
        lockedAmountCents,
        freshAmountCents,
        deltaCents,
      });

      if (deltaCents != null && Math.abs(deltaCents) >= LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS) {
        try {
          await sendTransactionalEmail({
            to: process.env.OPS_ALERT_EMAIL || 'amalyb@gmail.com',
            subject: `[Sherbrt] Re-rate amount delta $${(deltaCents / 100).toFixed(2)} (tx ${txId?.slice(0, 8)})`,
            text: [
              `Outbound re-rate at accept produced a price delta of ${deltaCents} cents (>= ${LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS}c threshold).`,
              ``,
              `tx: ${txId}`,
              `provider/token: ${matched.provider} / ${matched?.servicelevel?.token}`,
              `locked (preauth): ${lockedAmountCents}c`,
              `fresh (purchased): ${freshAmountCents}c`,
              `delta: ${deltaCents}c (Sherbrt absorbs)`,
            ].join('\n'),
          });
        } catch (emailErr) {
          console.error('❌ [OPS-ALERT] Failed to send re-rate-delta email:', emailErr.message);
        }
      }
    } else {
      console.warn('[RATE-SELECT][OUTBOUND:NO_LOCK_FALLBACK]', { txId, hasLockedRateId: !!lockedOutbound?.rateObjectId });
      selectedRate = pickCheapestAllowedRate(availableRates, {
        daysUntilBookingStart,
        preferredProviders,
      });
    }

    if (!selectedRate) {
      console.error('❌ [SHIPPO][NO-RATES] No suitable rate found');
      return { success: false, reason: 'no_suitable_rate' };
    }
    
    const selectedRateId = selectedRate?.object_id || selectedRate?.objectId || selectedRate?.id;
    console.log('[RATE-SELECT][OUTBOUND]', {
      token: selectedRate?.servicelevel?.token || selectedRate?.service?.token,
      provider: selectedRate?.provider,
      amount: Number(selectedRate?.amount ?? selectedRate?.rate ?? 0),
      estDays: selectedRate?.estimated_days ?? selectedRate?.duration_terms,
      objectId: selectedRateId,
    });
    if (!selectedRateId) {
      console.warn('[SHIPPO][RATE][MISSING_OBJECT_ID] Selected rate missing object_id; logging raw rate for debugging', {
        selectedRate,
      });
    }

    // 10.0 PR-2 step 3: derive shipByDate from the Shippo-selected rate's
    // estimated_days. Persisted to protectedData.outbound.shipByDate below
    // (existing persist block), read by all downstream consumers via the
    // persisted-first branch in computeShipByDate.
    {
      const rawTransit = Number(selectedRate?.estimated_days ?? selectedRate?.duration_terms);
      const transitDays = Number.isFinite(rawTransit) ? rawTransit : undefined;
      shipByDate = await computeShipByDate(transaction, { transitDays });
      console.log('[ship-by:derived]', {
        transitDays: transitDays ?? null,
        shipByISO: shipByDate?.toISOString?.() || null,
      });
    }

    // Create the actual label by purchasing the transaction
    console.log('📦 [SHIPPO] Purchasing label for selected rate...');
    console.log('[SHIPPO][TX][CONTEXT]', {
      shipmentId: shipmentRes?.data?.object_id || null,
      shippoMode,
      tokenSuffix: maskTokenTail(shippoToken),
      suppressRecipientEmail: suppress,
      rateId: selectedRateId || null,
    });
    console.log('[SHIPPO][TX][SELECTED-RATE]', {
      provider: selectedRate?.provider,
      servicelevel: selectedRate?.servicelevel?.token || selectedRate?.service?.token,
      serviceName: selectedRate?.servicelevel?.name || selectedRate?.service?.name,
      amount: Number(selectedRate?.amount ?? selectedRate?.rate ?? 0),
      estimated_days: selectedRate?.estimated_days ?? selectedRate?.duration_terms,
      object_id: selectedRateId,
    });
    
    // Build transaction payload - only request QR code for USPS
    const outboundMetadata = buildShippoMetadataString({ txId, direction: 'outbound' });
    console.log('[SHIPPO][TX][METADATA-LEN]', { direction: 'outbound', len: outboundMetadata.length });
    const transactionPayload = {
      // Defensive: prefer object_id, fall back to objectId if SDK shape differs
      rate: selectedRateId,
      async: false,
      label_file_type: 'PNG',
      metadata: outboundMetadata // Keep Shippo metadata short for 100-char limit
    };
    
    // Only request QR code for USPS (UPS doesn't support it). Null-safe
    // against locked-rate synthetic objects that may lack `provider`.
    const selectedProvider = String(selectedRate?.provider || '').toUpperCase();
    if (selectedProvider === 'USPS') {
      transactionPayload.extra = { qr_code_requested: true };
      console.log('📦 [SHIPPO] Requesting QR code for USPS label');
    } else {
      console.log('📦 [SHIPPO] Skipping QR code request for ' + (selectedRate?.provider || 'unknown-provider') + ' (not USPS)');
    }
    
    // Log the payload (without auth headers) for debugging Shippo 400s
    console.log('[SHIPPO][TX][REQUEST]', {
      payload: transactionPayload,
      shipmentId: shipmentRes?.data?.object_id || null,
    });

    console.log('📦 [SHIPPO] Added metadata.transactionId to transaction payload for webhook lookup');
    
    // Purchase label with retry on UPS 10429
    const transactionRes = await withBackoff(
      async () => {
        try {
          return await axios.post(
            'https://api.goshippo.com/transactions/',
            transactionPayload,
            {
              headers: {
                'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (err) {
          // Log full Shippo response body to debug 400s
          console.error('[SHIPPO][TX][ERROR]', {
            status: err?.response?.status,
            statusText: err?.response?.statusText,
            data: err?.response?.data,
            headers: err?.response?.headers,
            rateId: transactionPayload.rate,
            shippoRequestId: err?.response?.headers?.['x-shippo-request-id'] || err?.response?.headers?.['x-request-id'],
            mode: shippoMode,
            tokenSuffix: maskTokenTail(shippoToken),
            shipmentId: shipmentRes?.data?.object_id || null,
          });
          throw err;
        }
      },
      { retries: 2, baseMs: 600 }
    );

    // Always assign before any checks to avoid TDZ
    const shippoTx = transactionRes.data;

    // Check if label purchase was successful
    if (!shippoTx || shippoTx.status !== 'SUCCESS') {
      console.error('❌ [SHIPPO] Label purchase failed:', shippoTx?.messages);
      console.error('❌ [SHIPPO] Transaction status:', shippoTx?.status);
      return { success: false, reason: 'label_purchase_failed', status: shippoTx?.status };
    }

    // One-time debug log after label purchase - safe structured logging of key fields
    if (process.env.SHIPPO_DEBUG === 'true') {
      console.log('[SHIPPO][TX]', logTx(shippoTx));
      console.log('[SHIPPO][RATE]', safePick(selectedRate || {}, ['provider', 'servicelevel', 'service', 'object_id']));
    }
    const carrier = selectedRate?.provider ?? null;
    const service = selectedRate?.service?.name ?? selectedRate?.servicelevel?.name ?? null;
    
    // Extract and normalize shipping artifacts using the new utility
    const shippingArtifacts = extractArtifacts({
      carrier,
      trackingNumber: shippoTx.tracking_number,
      shippoTx
    });
    
    // Legacy variables for backward compatibility (deprecated - use shippingArtifacts instead)
    const trackingNumber = shippingArtifacts.trackingNumber;
    const trackingUrl = shippingArtifacts.trackingUrl;
    const labelUrl = shippingArtifacts.upsLabelUrl || shippingArtifacts.uspsLabelUrl;
    const qrUrl = shippingArtifacts.upsQrUrl;
    
    const qrPayload = { trackingNumber, trackingUrl, labelUrl, qrUrl, carrier, service };
    
    console.log('[SHIPPO] Shipping artifacts extracted:', {
      hasTrackingNumber: !!shippingArtifacts.trackingNumber,
      hasTrackingUrl: !!shippingArtifacts.trackingUrl,
      hasUpsQr: !!shippingArtifacts.upsQrUrl,
      hasUpsLabel: !!shippingArtifacts.upsLabelUrl,
      hasUspsLabel: !!shippingArtifacts.uspsLabelUrl,
      carrier: shippingArtifacts.carrier,
      service,
    });

    shippoTransactionId = shippoTx.object_id;
    shippoRateId = selectedRate?.object_id || null;
    outboundLabelResult = {
      label_url: labelUrl,
      qr_code_url: qrUrl,
      tracking_url_provider: trackingUrl,
    };

    console.log('📦 [SHIPPO] Label purchased successfully!');
    console.log('📦 [SHIPPO] Transaction ID:', shippoTransactionId);
    console.log('[SHIPPO] Outbound label ready', {
      transactionId: shippoTransactionId,
      rateId: shippoRateId,
    });

    // Deterministic webhook resolution: index tracking number → tx (do not rely on Shippo metadata)
    if (trackingNumber) {
      await setTrackingIndex(trackingNumber, { txId, direction: 'outbound' });
    }

    // DEBUG: prove we got here
    console.log('✅ [SHIPPO] Label created successfully for tx:', txId);

    // Reuse the shipByDate computed earlier (already logged above).
    //
    // Display-only clamp: if the lender accepted within the lead-day window
    // of the booking start, the computed shipByDate can already be in the
    // past (e.g., accept Fri, booking start Mon, leadDays=2 → ship-by Thu).
    // The Step-3 SMS would otherwise read "Ship by [yesterday]" verbatim.
    // We clamp here at the SMS construction site only — NOT inside
    // computeShipByDate — because the shipping-reminder cron also calls
    // computeShipByDate and treats a past return as "skip this tx";
    // clamping there made the cron fire reminders for every stale accepted
    // tx in the queue (observed when cron sent borrower-routed reminders
    // for old transactions after the first clamp deploy).
    let shipByForSms = shipByDate;
    if (shipByDate) {
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      if (shipByDate < todayUTC) {
        console.warn('[SMS][Step-3][ship-by:clamp] computed ship-by in the past, clamping to today for SMS display', {
          computedISO: shipByDate.toISOString(),
          todayISO: todayUTC.toISOString(),
          txId,
        });
        shipByForSms = todayUTC;
      }
    }
    const shipByStr = formatShipBy(shipByForSms);
    
    // ──────────────────────────────────────────────────────────────────────────────
    // STEP-3: notify lender "label ready" with QR/label-only link (no tracking)
    // Runs right after outbound label purchase succeeds.
    // ──────────────────────────────────────────────────────────────────────────────
    try {
      console.log('[SMS][Step-3] Starting lender notification flow...');

      // Make sure we have a provider phone
      if (!providerPhone) {
        console.warn('[SMS][Step-3] No lender phone on file; skipping SMS');
      } else {
        // Normalize to E.164
        const lenderPhone = normalizePhone(providerPhone);
        if (!lenderPhone) {
          console.warn('[SMS][Step-3] Phone normalization failed; skipping SMS');
        } else {
          // Get listing title (truncate if too long to keep SMS compact)
          const rawTitle = (listing && (listing.attributes?.title || listing.title)) || 'your item';
          const listingTitle = rawTitle.length > 40 ? rawTitle.substring(0, 37) + '...' : rawTitle;
          
          // One-time log before SMS. NOTE: leadDays / miles / mode are
          // internals of computeShipByDate() and are NOT in scope here —
          // referencing them previously threw `ReferenceError: leadDays is
          // not defined`, which the outer catch turned into the symptom
          // "[SMS][Step-3] error sending lender SMS … leadDays is not
          // defined" and aborted the lender notification.
          console.log('[SMS][LENDER:shipBy]', {
            shipByISO: shipByDate?.toISOString?.() || null,
            shipByFormatted: shipByStr,
            txId,
          });

          // Build the lender SMS using the new strict QR/label-only function
          let body;
          try {
            body = await buildLenderShipByMessage({
              itemTitle: listingTitle,
              shipByDate: shipByStr,
              shippingArtifacts
            });
            
            console.log('[SMS][Step-3] Built compliant lender message with shortlink');
          } catch (msgError) {
            // If buildLenderShipByMessage throws (no compliant link), log and skip SMS
            console.error('[SMS][Step-3] Failed to build compliant message:', msgError.message);
            console.warn('[SMS][Step-3] Skipping lender SMS - no QR/label link available');
            
            // Exit early - do not send SMS with tracking link
            throw msgError;
          }

          // Import SMS tags for consistency
          const { SMS_TAGS } = require('../lib/sms/tags');

          // IMPORTANT: send the lender SMS with the correct tag (do not share borrower dedupe)
          await sendSMS(
            lenderPhone,
            body,
            {
              role: 'lender',
              transactionId: txId,
              tag: SMS_TAGS.LABEL_READY_TO_LENDER, // "label_ready_to_lender"
              meta: {
                listingId: listing?.id?.uuid || listing?.id,
                carrier,
                trackingNumber,
                hasQr: !!shippingArtifacts.upsQrUrl,
                hasLabel: !!(shippingArtifacts.upsLabelUrl || shippingArtifacts.uspsLabelUrl)
              }
            }
          );

          console.log('[SMS][Step-3] sent to=%s txId=%s', lenderPhone.replace(/\d(?=\d{4})/g, '*'), txId);
        }
      }
    } catch (err) {
      console.error('[SMS][Step-3] error sending lender SMS', { txId, error: err?.message });
      // Do not rethrow - SMS failure should not block persistence
    }
    
    // ──────────────────────────────────────────────────────────────────────────────
    // STEP-3.5: Send EMAIL to lender when outbound label is created
    // Runs right after outbound label SMS (if SMS succeeded or was skipped)
    // ──────────────────────────────────────────────────────────────────────────────
    try {
      // Get provider email from protectedData (checkout-entered) or transaction profile
      const providerEmail = protectedData.providerEmail || 
                           transaction?.relationships?.provider?.data?.attributes?.profile?.protectedData?.email ||
                           transaction?.relationships?.provider?.data?.attributes?.email ||
                           transaction?.attributes?.provider?.attributes?.email ||
                           null;
      
      // Get provider first name for personalization
      const providerFirstName = transaction?.relationships?.provider?.data?.attributes?.profile?.firstName ||
                               transaction?.relationships?.provider?.data?.attributes?.profile?.protectedData?.firstName ||
                               transaction?.attributes?.provider?.attributes?.profile?.firstName ||
                               null;
      
      // Get listing title
      const listingTitle = listing?.attributes?.title || 
                          transaction?.relationships?.listing?.data?.attributes?.title ||
                          'your item';
      
      // Get booking dates
      const booking = transaction?.attributes?.booking || transaction?.booking;
      const startDate = booking?.attributes?.start || booking?.start || null;
      const endDate = booking?.attributes?.end || booking?.end || null;
      
      // Prefer QR URL if available (UPS), otherwise use label URL (same as SMS)
      const outboundLabelLink = qrUrl || labelUrl || null;
      
      // Build sale URL for lender (they see /sale/:id, not /order/:id)
      const fullSaleUrl = saleUrl(txId);
      
      // Log check state before sending
      console.log('[LENDER-OUTBOUND-EMAIL] check', {
        txId: txId,
        providerEmail,
        hasOutboundLink: !!outboundLabelLink,
        hasQrUrl: !!qrUrl,
        alreadySent: !!protectedData.lenderOutboundLabelEmailSent,
      });
      console.log('[EMAIL][LABEL] gate check', {
        txId: txId,
        providerEmailPresent: !!providerEmail,
        hasLabelUrl: !!labelUrl,
        hasQrUrl: !!qrUrl,
        outboundLabelLink: maskUrl(outboundLabelLink),
      });
      
      if (providerEmail && outboundLabelLink) {
        // Check if we've already sent outbound label email (idempotency)
        const emailSent = protectedData.lenderOutboundLabelEmailSent === true;
        
        if (emailSent) {
          console.log(`[LENDER-OUTBOUND-EMAIL] Skipped (already sent) to ${providerEmail}`);
        } else {
          // Log before sending
          console.log('[EMAIL][LABEL] sending lenderOutboundLabelEmail...', {
            to: providerEmail,
            txId: txId,
            hasQr: !!qrUrl,
            hasLabel: !!labelUrl,
            outboundLabelLink: maskUrl(outboundLabelLink),
          });
          console.log('[LENDER-OUTBOUND-EMAIL] sending', { to: providerEmail, txId: txId });
          
          // Create short link for email (same as SMS)
          let shortOutboundUrl;
          try {
            shortOutboundUrl = await shortLink(outboundLabelLink);
          } catch (shortLinkError) {
            console.warn('[LENDER-OUTBOUND-EMAIL] shortLink failed for outbound label, using original URL:', shortLinkError.message);
            shortOutboundUrl = outboundLabelLink;
          }
          
          // If QR URL exists, use the same shortened link for QR image
          // (QR URL is typically the same as outboundLabelLink when QR is selected)
          const shortQrUrl = qrUrl ? shortOutboundUrl : null;
          
          // Generate email content
          const { subject, text, html } = lenderOutboundLabelEmail({
            firstName: providerFirstName,
            listingTitle,
            startDate,
            endDate,
            outboundLabelUrl: shortOutboundUrl,
            orderUrl: fullSaleUrl, // Note: parameter name is 'orderUrl' but value is sale URL for lenders
            qrUrl: shortQrUrl,
          });
          
          // Send email
          await sendTransactionalEmail({
            to: providerEmail,
            subject,
            text,
            html,
          });
          
          console.log(`✅ [LENDER-OUTBOUND-EMAIL] Sent outbound label email to lender`, {
            transactionId: txId,
            email: providerEmail,
            hasQr: !!qrUrl,
            hasLabel: !!labelUrl,
            linkType: qrUrl ? 'qr' : 'label',
            shortUrl: maskUrl(shortOutboundUrl)
          });
          
          // Mark as sent in protectedData for idempotency
          try {
            const emailResult = await upsertProtectedData(txId, {
              lenderOutboundLabelEmailSent: true,
            }, { source: 'shippo' });
            
            if (emailResult && emailResult.success === false) {
              console.warn('⚠️ [PERSIST] Failed to save outbound label email state:', emailResult.error);
            } else {
              console.log('[LENDER-OUTBOUND-EMAIL] marked as sent in protectedData', { txId: txId });
            }
          } catch (updateError) {
            console.warn(`❌ [PERSIST] Exception saving outbound label email state:`, updateError.message);
          }
        }
      } else if (providerEmail && !outboundLabelLink) {
        console.warn('[EMAIL][LABEL] not sending — missing label_url because Shippo purchase failed or label URL unavailable', {
          txId: txId,
          providerEmail,
          hasShippoTransaction: !!shippoTransactionId,
        });
      } else if (!providerEmail) {
        console.log(`📧 [LENDER-OUTBOUND-EMAIL] Provider email not found - skipping outbound label email`);
      }
    } catch (outboundEmailError) {
      // Don't fail the outbound label creation if email fails
      console.error('[LENDER-OUTBOUND-EMAIL] error sending email', {
        transactionId: txId,
        error: outboundEmailError.message,
        stack: outboundEmailError.stack?.split('\n')[0]
      });
    }
    
    // ========== STEP 2: PERSIST TO FLEX (INDEPENDENT OF SMS) ==========
    // Persistence happens after SMS, and failures here don't affect SMS delivery
    console.log('[SHIPPO] Attempting to persist label data to Flex protectedData...');
    
    try {
      const patch = {
        outboundTransactionId: shippoTransactionId || null, // durable Shippo handle (void + label re-fetch)
        outboundTrackingNumber: trackingNumber,
        outboundTrackingUrl: trackingUrl,
        outboundLabelUrl: labelUrl,
        outboundQrUrl: qrUrl || null,
        outboundCarrier: carrier,
        outboundService: service,
        outboundQrExpiry: parseExpiresParam(qrUrl) || null,
        outboundPurchasedAt: timestamp(), // ← respects FORCE_NOW
        outbound: {
          ...protectedData.outbound,
          shipByDate: shipByDate ? shipByDate.toISOString() : null
        },
        // Persist normalized shipping artifacts for future use (e.g., return SMS, reminders)
        shippingArtifacts: {
          carrier: shippingArtifacts.carrier,
          trackingNumber: shippingArtifacts.trackingNumber,
          upsQrUrl: shippingArtifacts.upsQrUrl,
          upsLabelUrl: shippingArtifacts.upsLabelUrl,
          uspsLabelUrl: shippingArtifacts.uspsLabelUrl,
          trackingUrl: shippingArtifacts.trackingUrl,
        }
      };
      const result = await upsertProtectedData(txId, patch, { source: 'shippo' });
      if (result && result.success === false) {
        console.warn('⚠️ [PERSIST] Failed to save outbound label (SMS already sent):', result.error);
      } else {
        console.log('✅ [PERSIST] Stored outbound label fields:', Object.keys(patch).join(', '));
        if (shipByDate) {
          console.log('📅 [PERSIST] Set ship-by date:', shipByDate.toISOString());
        }
        console.log('✅ [PERSIST] Stored shipping artifacts for future use');
      }
    } catch (persistError) {
      console.error('❌ [PERSIST] Exception saving outbound label (SMS already sent):', persistError.message);
      // Do not rethrow - persistence failure should not fail the overall flow
    }

    // Parse expiry from QR code URL (keep existing logic)
    const qrExpiry = parseExpiresParam(qrUrl);
    console.log('📦 [SHIPPO] QR code expiry:', qrExpiry || 'unknown');

    // after outbound purchase success:
    console.log('[SHIPPO][TX]', logTx(shippoTx));

    // Create return shipment (customer → provider) if we have return address
    let returnQrUrl = null;
    let returnTrackingUrl = null;
    
    try {
      if (protectedData.providerStreet && protectedData.providerCity && protectedData.providerState && protectedData.providerZip) {
        console.log('📦 [SHIPPO] Creating return shipment (customer → provider)...');
        
        // For return shipment, reverse the addresses:
        // - address_from: customer (borrower) returning the item — is the SENDER
        // - address_to:   provider (lender) receiving the return — is the RECIPIENT
        //
        // The SHIPPO_SUPPRESS_RECIPIENT_EMAIL flag is intended to suppress
        // *recipient* notifications (UPS Quantum View, USPS Informed
        // Delivery), so it must only ever drop the email on the
        // `address_to` side — never on `address_from`. USPS additionally
        // rejects labels whose `address_from.email` is empty (returns
        // `Attribute "address_from.email" must not be empty.`), which is
        // what previously broke return-label creation for this tx.
        let returnAddressFrom = buildShippoAddress(rawCustomerAddress, { suppressEmail: false });
        let returnAddressTo = buildShippoAddress(rawProviderAddress, { suppressEmail: suppress });

        // Defensive: if for any reason rawCustomerAddress lacks an email
        // (older protectedData rows pre-checkout-email-capture), fall
        // back to a deterministic Sherbrt support address so USPS does
        // not reject the label.
        if (!returnAddressFrom.email) {
          const fallback = process.env.SHIPPO_FALLBACK_SENDER_EMAIL || 'shipping@sherbrt.com';
          console.warn('[SHIPPO][RETURN] customer email missing on address_from; using fallback', {
            txId,
            fallback,
          });
          returnAddressFrom.email = fallback;
        }
        
        // ──────────────────────────────────────────────────────────────────────────────
        // RE-APPLY STREET2 GUARD (RETURN LABEL): Preserve street2 if normalizer dropped it
        // ──────────────────────────────────────────────────────────────────────────────
        // Return: from.street2 = customerStreet2, to.street2 = providerStreet2
        returnAddressFrom = keepStreet2(rawCustomerAddress, returnAddressFrom);
        returnAddressTo = keepStreet2(rawProviderAddress, returnAddressTo);

        // ──────────────────────────────────────────────────────────────────────────────
        // PRE-VALIDATE RETURN-LABEL ADDRESSES via Shippo /addresses/?validate=true
        // ──────────────────────────────────────────────────────────────────────────────
        // Mirror the outbound validation: hard-fail on is_valid:false, use the
        // canonical (with ZIP+4) for the return shipment payload. On hard-fail
        // we throw a sentinel that the outer try/catch downgrades — outbound
        // already succeeded, so we skip the return label without erroring out.
        {
          const [retFromVal, retToVal] = await Promise.all([
            validateAddress(returnAddressFrom),
            validateAddress(returnAddressTo),
          ]);

          // returnAddressFrom = customer (recipient role in marketplace).
          // returnAddressTo   = provider.
          const retFailedSide = !retToVal.valid && !retToVal.transient
            ? 'provider'
            : (!retFromVal.valid && !retFromVal.transient ? 'customer' : null);

          if (retFailedSide) {
            const failed = retFailedSide === 'provider' ? retToVal : retFromVal;
            const reason = retFailedSide === 'provider' ? 'invalid_provider_address' : 'invalid_recipient_address';
            const failedAddress = retFailedSide === 'provider' ? returnAddressTo : returnAddressFrom;

            console.warn(`⚠️ [SHIPPO][RETURN] ${retFailedSide === 'provider' ? 'Provider' : 'Customer'} address failed USPS validation`, {
              txId,
              messages: failed.messages,
              address: {
                street1: failedAddress.street1,
                street2: failedAddress.street2,
                city: failedAddress.city,
                state: failedAddress.state,
                zip: failedAddress.zip,
              },
            });

            try {
              await upsertProtectedData(txId, {
                returnLabelCreationError: {
                  code: reason,
                  failedSide: retFailedSide,
                  validationMessages: failed.messages,
                  occurredAt: timestamp(),
                },
              }, { source: 'shippo' });
            } catch (persistErr) {
              console.error('❌ [PERSIST] Failed to save returnLabelCreationError:', persistErr.message);
            }

            try {
              await sendTransactionalEmail({
                to: process.env.OPS_ALERT_EMAIL || 'amalyb@gmail.com',
                subject: `[Sherbrt] Return label blocked — ${reason} (tx ${txId?.slice(0, 8)})`,
                text: [
                  `Return-label creation was blocked because USPS rejected the ${retFailedSide} address.`,
                  ``,
                  `tx: ${txId}`,
                  `side: ${retFailedSide}`,
                  `reason: ${reason}`,
                  `address: ${failedAddress.street1}${failedAddress.street2 ? ', ' + failedAddress.street2 : ''}, ${failedAddress.city}, ${failedAddress.state} ${failedAddress.zip}`,
                  ``,
                  `validation messages:`,
                  ...failed.messages.map(m => `  - ${m}`),
                  ``,
                  `Outbound label was created successfully; only the return label was blocked.`,
                ].join('\n'),
              });
            } catch (emailErr) {
              console.error('❌ [OPS-ALERT] Failed to send return-label-blocked email:', emailErr.message);
            }

            const sentinel = new Error(`Return-label validation hard-fail: ${reason}`);
            sentinel.code = 'shippo_return_address_invalid';
            throw sentinel;
          }

          if (retFromVal.valid && retFromVal.messages.length) {
            console.info('[SHIPPO][RETURN] address_from validated with warnings:', retFromVal.messages);
          }
          if (retToVal.valid && retToVal.messages.length) {
            console.info('[SHIPPO][RETURN] address_to validated with warnings:', retToVal.messages);
          }

          if (retFromVal.normalized) {
            returnAddressFrom = { ...returnAddressFrom, ...retFromVal.normalized };
          }
          if (retToVal.normalized) {
            returnAddressTo = { ...returnAddressTo, ...retToVal.normalized };
          }

          // Defensive: re-apply street2 from raw if the canonical spread omitted it.
          returnAddressFrom = keepStreet2(rawCustomerAddress, returnAddressFrom);
          returnAddressTo = keepStreet2(rawProviderAddress, returnAddressTo);

          console.info('[shippo][validated][return] canonical addresses (post-/addresses/?validate=true)', {
            from: { street1: returnAddressFrom.street1, street2: returnAddressFrom.street2, city: returnAddressFrom.city, state: returnAddressFrom.state, zip: returnAddressFrom.zip },
            to:   { street1: returnAddressTo.street1,   street2: returnAddressTo.street2,   city: returnAddressTo.city,   state: returnAddressTo.state,   zip: returnAddressTo.zip },
          });
        }

        // ──────────────────────────────────────────────────────────────────────────────
        // PRE-SHIPPO DIAGNOSTIC LOGGING (RETURN)
        // ──────────────────────────────────────────────────────────────────────────────
        console.info('[shippo][pre] outbound=false carrier=UPS/USPS (return label)');
        console.info('[shippo][pre][return] address_from (customer→provider)', {
          name: returnAddressFrom?.name,
          street1: returnAddressFrom?.street1,
          street2: returnAddressFrom?.street2,     // ← MUST NOT be empty if customer has an apt
          city: returnAddressFrom?.city,
          state: returnAddressFrom?.state,
          zip: returnAddressFrom?.zip,
          phone: redactPhone(returnAddressFrom?.phone)
        });
        console.info('[shippo][pre][return] address_to (provider)', {
          name: returnAddressTo?.name,
          street1: returnAddressTo?.street1,
          street2: returnAddressTo?.street2,       // ← MUST NOT be empty if provider has an apt
          city: returnAddressTo?.city,
          state: returnAddressTo?.state,
          zip: returnAddressTo?.zip,
          phone: redactPhone(returnAddressTo?.phone)
        });
        
        const returnPayload = {
          address_from: returnAddressFrom,
          address_to: returnAddressTo,
          parcels: [parcel],
          async: false
        };
        
        // DEBUG: log the *exact* payload we will send to Shippo
        logShippoPayload('return:shipment', { address_from: returnAddressFrom, address_to: returnAddressTo, parcels: [parcel] });

        // Create return shipment with retry on UPS 10429
        const returnShipmentRes = await withBackoff(
          () => axios.post(
            'https://api.goshippo.com/shipments/',
            returnPayload,
            {
              headers: {
                'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          ),
          { retries: 2, baseMs: 600 }
        );

        console.log('📦 [SHIPPO] Return shipment created successfully');
        console.log('📦 [SHIPPO] Return Shipment ID:', returnShipmentRes.data.object_id);
        
        // Get return rates and select one
        let returnRates = returnShipmentRes.data.rates || [];
        const returnShipmentData = returnShipmentRes.data;
        
        console.log('📊 [SHIPPO][RETURN] Available rates (before filtering):', returnRates.length);
        
        // Apply same sandbox carrier filtering to return rates
        if (!isProduction && returnRates.length > 0) {
          const originalCount = returnRates.length;
          returnRates = returnRates.filter(rate => {
            const carrier = (rate.provider || rate.carrier || '').toUpperCase();
            return allowedCarriers.includes(carrier);
          });
          
          if (process.env.DEBUG_SHIPPO === '1') {
            console.info('[shippo][sandbox][return] Filtered carriers to UPS/USPS only', {
              mode: process.env.SHIPPO_MODE || 'sandbox',
              originalCount,
              filteredCount: returnRates.length,
              allowedCarriers
            });
          }
        }
        
        console.log('📊 [SHIPPO][RETURN] Available rates (after filtering):', returnRates.length);
        
        if (returnRates.length === 0) {
          console.warn('⚠️ [SHIPPO] No return rates available');
          if (returnShipmentData.messages && returnShipmentData.messages.length > 0) {
            console.warn('[SHIPPO][NO-RATES][RETURN] messages:', JSON.stringify(returnShipmentData.messages, null, 2));
          }
        }
        
        if (returnRates.length > 0) {
          // task #29: same re-rate-at-accept logic as outbound. If a locked
          // return rate exists (set by initiate-privileged at checkout),
          // match by provider+servicelevel.token in the FRESH return-shipment
          // rates and purchase that fresh object_id. Borrower-preauth amount
          // (lockedRate.amountCents) is preserved; Sherbrt absorbs deltas.
          // No locked rate → existing pickCheapestPreferredRate fallback.
          const lockedReturn = protectedData?.return?.lockedRate;
          let returnSelectedRate;

          if (lockedReturn?.rateObjectId && lockedReturn?.provider && lockedReturn?.servicelevel?.token) {
            const matched = findMatchingRate(returnRates, lockedReturn);

            if (!matched) {
              const lockedDesc = `${lockedReturn.provider} ${lockedReturn?.servicelevel?.name || lockedReturn?.servicelevel?.token}`;
              console.error('❌ [SHIPPO][RETURN][RE-RATE][NO_MATCH] Locked return service-level not present in fresh return rates', {
                txId,
                lockedProvider: lockedReturn.provider,
                lockedToken: lockedReturn?.servicelevel?.token,
                freshOptions: returnRates.map(r => ({ provider: r.provider, token: r?.servicelevel?.token })),
              });

              try {
                await upsertProtectedData(txId, {
                  returnLabelCreationError: {
                    code: 'unprintable_at_accept',
                    failedSide: 'return',
                    lockedRate: {
                      provider: lockedReturn.provider,
                      servicelevel: lockedReturn.servicelevel,
                      amountCents: lockedReturn.amountCents,
                    },
                    freshOptions: returnRates.map(r => ({
                      provider: r.provider,
                      token: r?.servicelevel?.token,
                      amount: r.amount,
                    })),
                    occurredAt: timestamp(),
                  },
                }, { source: 'shippo' });
              } catch (persistErr) {
                console.error('❌ [PERSIST] Failed to save returnLabelCreationError (unprintable_at_accept):', persistErr.message);
              }

              try {
                await sendTransactionalEmail({
                  to: process.env.OPS_ALERT_EMAIL || 'amalyb@gmail.com',
                  subject: `[Sherbrt] Return label blocked — unprintable_at_accept (tx ${txId?.slice(0, 8)})`,
                  text: [
                    `Return-label was blocked because the checkout-locked return service-level (${lockedDesc}) is no longer offered for this shipment.`,
                    ``,
                    `tx: ${txId}`,
                    `locked provider: ${lockedReturn.provider}`,
                    `locked token: ${lockedReturn?.servicelevel?.token}`,
                    `locked amount (cents): ${lockedReturn.amountCents}`,
                    ``,
                    `fresh-shipment options:`,
                    ...returnRates.map(r => `  - ${r.provider} ${r?.servicelevel?.token} @ $${r.amount}`),
                    ``,
                    `Outbound label was created successfully; only the return label was blocked.`,
                  ].join('\n'),
                });
              } catch (emailErr) {
                console.error('❌ [OPS-ALERT] Failed to send return unprintable_at_accept email:', emailErr.message);
              }

              const sentinel = new Error('Return-label re-rate hard-fail: unprintable_at_accept');
              sentinel.code = 'shippo_return_address_invalid';
              throw sentinel;
            }

            returnSelectedRate = matched;

            const freshAmountCents = Math.round(parseFloat(matched.amount ?? matched.rate ?? 0) * 100);
            const lockedAmountCents = Number(lockedReturn.amountCents);
            const deltaCents = Number.isFinite(lockedAmountCents) ? freshAmountCents - lockedAmountCents : null;

            console.log('[RATE-SELECT][RETURN:LOCKED→FRESH]', {
              lockedRateId: lockedReturn.rateObjectId,
              freshRateId: matched.object_id,
              provider: matched.provider,
              token: matched?.servicelevel?.token,
              lockedAmountCents,
              freshAmountCents,
              deltaCents,
            });

            if (deltaCents != null && Math.abs(deltaCents) >= LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS) {
              try {
                await sendTransactionalEmail({
                  to: process.env.OPS_ALERT_EMAIL || 'amalyb@gmail.com',
                  subject: `[Sherbrt] Return re-rate amount delta $${(deltaCents / 100).toFixed(2)} (tx ${txId?.slice(0, 8)})`,
                  text: [
                    `Return re-rate at accept produced a price delta of ${deltaCents} cents (>= ${LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS}c threshold).`,
                    ``,
                    `tx: ${txId}`,
                    `provider/token: ${matched.provider} / ${matched?.servicelevel?.token}`,
                    `locked (preauth): ${lockedAmountCents}c`,
                    `fresh (purchased): ${freshAmountCents}c`,
                    `delta: ${deltaCents}c (Sherbrt absorbs)`,
                  ].join('\n'),
                });
              } catch (emailErr) {
                console.error('❌ [OPS-ALERT] Failed to send return re-rate-delta email:', emailErr.message);
              }
            }
          } else {
            // 10.0 PR-1 step 5 (preserved): no locked return rate → cheapest
            // preferred. Outbound's shipByDate is irrelevant to the return
            // shipment; the old coupling caused the last-resort branch to fire
            // unconditionally.
            returnSelectedRate = pickCheapestPreferredRate(returnRates, CONFIG_PREFERRED_SERVICES);
          }

          if (!returnSelectedRate) {
            console.warn('⚠️ [SHIPPO][RETURN] No suitable return rate found');
          } else {
            const returnServiceName = `${returnSelectedRate?.provider || returnSelectedRate?.carrier || ''} ${returnSelectedRate?.servicelevel?.name || returnSelectedRate?.service?.name || returnSelectedRate?.provider_service || ''}`.trim();
            console.log('[RATE-SELECT][RETURN]', {
              provider: returnSelectedRate?.provider,
              service: returnServiceName,
              token: returnSelectedRate?.servicelevel?.token || returnSelectedRate?.service?.token,
              amount: Number(returnSelectedRate?.amount ?? returnSelectedRate?.rate ?? 0),
              estDays: returnSelectedRate?.estimated_days ?? returnSelectedRate?.duration_terms,
            });
          
          // Build return transaction payload - only request QR for USPS
          const returnMetadata = buildShippoMetadataString({ txId, direction: 'return' });
          console.log('[SHIPPO][TX][METADATA-LEN]', { direction: 'return', len: returnMetadata.length });
          const returnTransactionPayload = {
            rate: returnSelectedRate.object_id,
            async: false,
            label_file_type: 'PNG',
            metadata: returnMetadata // Keep Shippo metadata short for 100-char limit
          };
          
          if (returnSelectedRate.provider.toUpperCase() === 'USPS') {
            returnTransactionPayload.extra = { qr_code_requested: true };
            console.log('📦 [SHIPPO] Requesting QR code for USPS return label');
          } else {
            console.log('📦 [SHIPPO] Skipping QR code request for ' + returnSelectedRate.provider + ' return label');
          }
          
          console.log('📦 [SHIPPO] Added metadata.transactionId to return transaction payload for webhook lookup');
          
          // Purchase return label with retry on UPS 10429
          const returnTransactionRes = await withBackoff(
            () => axios.post(
              'https://api.goshippo.com/transactions/',
              returnTransactionPayload,
              {
                headers: {
                  'Authorization': `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            ),
            { retries: 2, baseMs: 600 }
          );
          
          if (returnTransactionRes.data.status === 'SUCCESS') {
            // One-time debug log for return label purchase
            if (process.env.SHIPPO_DEBUG === 'true') {
              console.log('[SHIPPO][RETURN_TX]', logTx(returnTransactionRes.data));
              console.log('[SHIPPO][RETURN_RATE]', safePick(returnSelectedRate || {}, ['provider', 'servicelevel', 'service', 'object_id']));
            }
            
            returnQrUrl = returnTransactionRes.data.qr_code_url;
            returnTrackingUrl = returnTransactionRes.data.tracking_url_provider || returnTransactionRes.data.tracking_url;
            
            console.log('📦 [SHIPPO] Return label purchased successfully!');
            console.log('📦 [SHIPPO] Return Transaction ID:', returnTransactionRes.data.object_id);
            
            // Deterministic webhook resolution: index return tracking number → tx (do not rely on Shippo metadata)
            const returnTrackingNumber = returnTransactionRes.data.tracking_number || null;
            if (returnTrackingNumber) {
              await setTrackingIndex(returnTrackingNumber, { txId, direction: 'return' });
            }
            
            // Persist return label details to Flex protectedData
            try {
              const patch = {
                returnTransactionId: returnTransactionRes.data.object_id || null, // durable Shippo handle (void + label re-fetch)
                returnTrackingNumber: returnTransactionRes.data.tracking_number || null,
                returnTrackingUrl: returnTrackingUrl,
                returnLabelUrl: returnTransactionRes.data.label_url || null,
                returnQrUrl: returnQrUrl || null,
                returnCarrier: returnSelectedRate?.provider || null,
                returnService: returnSelectedRate?.service?.name ?? returnSelectedRate?.servicelevel?.name ?? null,
                returnQrExpiry: parseExpiresParam(returnQrUrl || '') || null,
                returnPurchasedAt: timestamp(), // ← respects FORCE_NOW
              };
              const result = await upsertProtectedData(txId, patch, { source: 'shippo' });
              if (result && result.success === false) {
                console.warn('⚠️ [PERSIST] Failed to save return label:', result.error);
              } else {
                console.log('✅ [PERSIST] Stored return label fields:', Object.keys(patch).join(', '));
              }
            } catch (e) {
              console.error('❌ [PERSIST] Exception saving return label:', e.message);
            }

            returnLabelResult = {
              qr_code_url: returnQrUrl,
              tracking_url_provider: returnTrackingUrl,
            };
            
            // ──────────────────────────────────────────────────────────────────────────────
            // FLOW 1: Send SMS to borrower when return label is created
            // ──────────────────────────────────────────────────────────────────────────────
            try {
              // Get borrower phone from protectedData or transaction
              const borrowerPhone = protectedData.customerPhone || 
                                   transaction?.relationships?.customer?.attributes?.profile?.protectedData?.phone ||
                                   null;
              
              // Prefer QR URL if available (USPS), otherwise use label URL
              const returnLabelLink = returnQrUrl || returnTransactionRes.data.label_url || null;
              
              if (borrowerPhone && returnLabelLink) {
                // Check if we've already sent return label SMS (idempotency)
                const returnNotificationSent = protectedData.returnNotification?.labelCreated?.sent === true;
                
                if (returnNotificationSent) {
                  console.log(`📱 Return label SMS already sent to borrower (${maskPhone(borrowerPhone)}) - skipping`);
                } else {
                  // Create short link for SMS
                  let shortReturnUrl;
                  try {
                    shortReturnUrl = await shortLink(returnLabelLink);
                  } catch (shortLinkError) {
                    console.warn('[SMS] shortLink failed for return label, using original URL:', shortLinkError.message);
                    shortReturnUrl = returnLabelLink;
                  }
                  
                  // Build return label SMS message with clear "return" language
                  const returnMessage = `📦 Your return label is ready! Use this to ship back: ${shortReturnUrl}`;
                  
                  // Send SMS to borrower
                  await sendSMS(
                    borrowerPhone,
                    returnMessage,
                    {
                      role: 'borrower',
                      transactionId: txId,
                      transition: 'transition/accept',
                      tag: 'return_label_ready_to_borrower',
                      meta: { listingId: listing?.id?.uuid || listing?.id }
                    }
                  );
                  
                  console.log(`✅ [RETURN-SMS] Sent return label SMS to borrower`, {
                    transactionId: txId,
                    phone: maskPhone(borrowerPhone),
                    hasQr: !!returnQrUrl,
                    hasLabel: !!returnTransactionRes.data.label_url,
                    linkType: returnQrUrl ? 'qr' : 'label',
                    shortUrl: maskUrl(shortReturnUrl)
                  });
                  
                  // Mark as sent in protectedData for idempotency
                  try {
                    const notificationResult = await upsertProtectedData(txId, {
                      returnNotification: {
                        labelCreated: { 
                          sent: true, 
                          sentAt: timestamp() // ← respects FORCE_NOW
                        }
                      }
                    }, { source: 'shippo' });
                    
                    if (notificationResult && notificationResult.success === false) {
                      console.warn('⚠️ [PERSIST] Failed to save return notification state:', notificationResult.error);
                    } else {
                      console.log(`✅ [PERSIST] Updated returnNotification.labelCreated`);
                    }
                  } catch (updateError) {
                    console.warn(`❌ [PERSIST] Exception saving return notification state:`, updateError.message);
                  }
                }
              } else if (borrowerPhone && !returnLabelLink) {
                console.warn(`⚠️ [RETURN-SMS] Borrower phone found but no return label URL available - skipping SMS`);
              } else if (!borrowerPhone) {
                console.log(`📱 [RETURN-SMS] Borrower phone number not found - skipping return label SMS`);
              }
            } catch (returnSmsError) {
              // Don't fail the return label creation if SMS fails
              console.error('❌ [RETURN-SMS] Failed to send return label SMS to borrower:', {
                transactionId: txId,
                error: returnSmsError.message,
                stack: returnSmsError.stack?.split('\n')[0]
              });
            }
            
            // ──────────────────────────────────────────────────────────────────────────────
            // FLOW 2: Send EMAIL to borrower when return label is created
            // ──────────────────────────────────────────────────────────────────────────────
            try {
              // Get borrower email from protectedData (checkout-entered) or transaction profile
              const borrowerEmail = protectedData.customerEmail || 
                                   transaction?.relationships?.customer?.data?.attributes?.profile?.protectedData?.email ||
                                   transaction?.relationships?.customer?.data?.attributes?.email ||
                                   null;
              
              // Get borrower first name for personalization
              const borrowerFirstName = transaction?.relationships?.customer?.data?.attributes?.profile?.firstName ||
                                       transaction?.relationships?.customer?.data?.attributes?.profile?.protectedData?.firstName ||
                                       null;
              
              // Get listing title
              const listingTitle = listing?.attributes?.title || 
                                 transaction?.relationships?.listing?.data?.attributes?.title ||
                                 'your item';
              
              // Get booking dates
              const booking = transaction?.attributes?.booking || transaction?.booking;
              const startDate = booking?.attributes?.start || booking?.start || null;
              const endDate = booking?.attributes?.end || booking?.end || null;
              
              // Return-by date: use endDate (booking end date) as default
              const returnByDate = endDate;
              
              // Prefer QR URL if available (USPS), otherwise use label URL (same as SMS)
              const returnLabelLink = returnQrUrl || returnTransactionRes.data.label_url || null;
              
              // Build order URL
              const fullOrderUrl = orderUrl(txId);
              
              // Log check state before sending
              console.log('[RETURN-EMAIL] check', {
                txId: txId,
                borrowerEmail,
                hasLabelUrl: !!returnLabelLink,
                alreadySent: !!protectedData.borrowerReturnLabelEmailSent,
              });
              
              if (borrowerEmail && returnLabelLink) {
                // Check if we've already sent return label email (idempotency)
                const emailSent = protectedData.borrowerReturnLabelEmailSent === true;
                
                if (emailSent) {
                  console.log(`📧 Return label email already sent to borrower (${borrowerEmail}) - skipping`);
                } else {
                  // Log before sending
                  console.log('[RETURN-EMAIL] sending', { to: borrowerEmail, txId: txId });
                  
                  // Create short link for email (same as SMS)
                  let shortReturnUrl;
                  try {
                    shortReturnUrl = await shortLink(returnLabelLink);
                  } catch (shortLinkError) {
                    console.warn('[EMAIL] shortLink failed for return label, using original URL:', shortLinkError.message);
                    shortReturnUrl = returnLabelLink;
                  }
                  
                  // Generate email content
                  const { subject, text, html } = borrowerReturnLabelEmail({
                    firstName: borrowerFirstName,
                    listingTitle,
                    startDate,
                    endDate,
                    returnByDate,
                    returnLabelUrl: shortReturnUrl,
                    orderUrl: fullOrderUrl,
                  });
                  
                  // Send email
                  await sendTransactionalEmail({
                    to: borrowerEmail,
                    subject,
                    text,
                    html,
                  });
                  
                  console.log(`✅ [RETURN-EMAIL] Sent return label email to borrower`, {
                    transactionId: txId,
                    email: borrowerEmail,
                    hasQr: !!returnQrUrl,
                    hasLabel: !!returnTransactionRes.data.label_url,
                    linkType: returnQrUrl ? 'qr' : 'label',
                    shortUrl: maskUrl(shortReturnUrl)
                  });
                  
                  // Mark as sent in protectedData for idempotency
                  try {
                    const emailResult = await upsertProtectedData(txId, {
                      borrowerReturnLabelEmailSent: true,
                    }, { source: 'shippo' });
                    
                    if (emailResult && emailResult.success === false) {
                      console.warn('⚠️ [PERSIST] Failed to save return label email state:', emailResult.error);
                    } else {
                      console.log('[RETURN-EMAIL] marked as sent in protectedData', { txId: txId });
                    }
                  } catch (updateError) {
                    console.warn(`❌ [PERSIST] Exception saving return label email state:`, updateError.message);
                  }
                }
              } else if (borrowerEmail && !returnLabelLink) {
                console.warn(`⚠️ [RETURN-EMAIL] Borrower email found but no return label URL available - skipping email`);
              } else if (!borrowerEmail) {
                console.log(`📧 [RETURN-EMAIL] Borrower email not found - skipping return label email`);
              }
            } catch (returnEmailError) {
              // Don't fail the return label creation if email fails
              console.error('[RETURN-EMAIL] error sending email', {
                transactionId: txId,
                error: returnEmailError.message,
                stack: returnEmailError.stack?.split('\n')[0]
              });
            }
          } else {
            console.warn('⚠️ [SHIPPO] Return label purchase failed:', returnTransactionRes.data.messages);
          }
          }  // end else (returnSelectedRate)
        }  // end if (returnRates.length > 0)
      }  // end if (providerStreet && providerCity...)
    } catch (returnLabelError) {
      // Sentinel from the return-label address-validation guard above. Outbound
      // label already succeeded; we deliberately skipped the return label.
      // Surface as a warn rather than an error so it doesn't trigger error-rate alerts.
      if (returnLabelError?.code === 'shippo_return_address_invalid') {
        console.warn('⚠️ [SHIPPO] Return label skipped due to address validation', {
          where: 'return-label-creation',
          message: returnLabelError.message,
        });
      } else {
        console.error('❌ [SHIPPO] Non-critical step failed', {
          where: 'return-label-creation',
          name: returnLabelError?.name,
          message: returnLabelError?.message,
          status: returnLabelError?.response?.status,
          data: safePick(returnLabelError?.response?.data || {}, ['error', 'message', 'code']),
        });
      }
      // Do not rethrow — allow the HTTP handler to finish normally.
    }


    
    // Send borrower SMS notification (lender SMS already sent immediately after outbound label success)
    try {
      // Extract phone numbers from protectedData (more reliable than nested objects)
      const borrowerPhone = protectedData.customerPhone;
      
      // Optional: Send borrower "Label created" message (idempotent)
      if (borrowerPhone && trackingUrl) {
        // Check if we've already sent this notification
        const existingNotification = protectedData.shippingNotification?.labelCreated;
        if (existingNotification?.sent === true) {
          console.log(`📱 Label created SMS already sent to borrower (${maskPhone(borrowerPhone)}) - skipping`);
        } else {
          const smsResult = await sendSMS(
            borrowerPhone,
            `Sherbrt: your item will ship soon. Track at ${trackingUrl}`,
            { 
              role: 'customer',
              transactionId: txId,
              transition: 'transition/accept',
              tag: 'label_created_to_borrower',
              meta: { listingId: listing?.id?.uuid || listing?.id }
            }
          );
          
          // Check if SMS was actually sent (not skipped by guards)
          if (smsResult && smsResult.skipped) {
            console.log(`📱 Label created SMS was skipped: ${smsResult.reason} - NOT setting labelCreated flag`);
            // Don't set flag - allow retry later
          } else {
            console.log(`📱 SMS sent to borrower (${maskPhone(borrowerPhone)}) for label created with tracking: ${maskUrl(trackingUrl)}`);
            
            // Mark as sent in protectedData (only if SMS was actually sent)
            try {
              const notificationResult = await upsertProtectedData(txId, {
                shippingNotification: {
                  labelCreated: { sent: true, sentAt: timestamp() } // ← respects FORCE_NOW
                }
              }, { source: 'shippo' });
              if (notificationResult && notificationResult.success === false) {
                console.warn('⚠️ [PERSIST] Failed to save notification state:', notificationResult.error);
              } else {
                console.log(`✅ [PERSIST] Updated shippingNotification.labelCreated`);
              }
            } catch (updateError) {
              console.warn(`❌ [PERSIST] Exception saving notification state:`, updateError.message);
            }
          }
        }
      } else if (borrowerPhone) {
        console.log(`📱 Borrower phone found but no tracking URL available - no immediate notification sent`);
      } else {
        console.log(`📱 Borrower phone number not found - no immediate notification sent`);
      }
      
    } catch (smsError) {
      console.error('❌ Failed to send borrower SMS notification:', smsError.message);
      // Don't fail the label creation if SMS fails
    }
    
    if (!outboundLabelResult) {
      outboundLabelResult = {
        label_url: labelUrl,
        qr_code_url: qrUrl,
        tracking_url_provider: trackingUrl,
      };
    }

    if (!returnLabelResult && returnQrUrl) {
      returnLabelResult = {
        qr_code_url: returnQrUrl,
        tracking_url_provider: returnTrackingUrl,
      };
    }

    return { 
      success: true, 
      outboundLabel: outboundLabelResult,
      returnLabel: returnLabelResult
    };
    
  } catch (err) {
    // Check if this is a Shippo API error (actual label creation failure)
    const isShippoError = err?.response?.status || err?.status;
    const isNetworkError = err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
    
    if (isShippoError || isNetworkError) {
      const details = {
        name: err?.name,
        message: err?.message,
        status: err?.status || err?.response?.status,
        statusText: err?.statusText || err?.response?.statusText,
        data: err?.response?.data || undefined,
        headers: err?.response?.headers,
        shippoRequestId: err?.response?.headers?.['x-shippo-request-id'] || err?.response?.headers?.['x-request-id'],
      };
      console.error('[SHIPPO] Label creation failed (Shippo API error)', details);
      return { success: false, reason: 'shippo_api_error', error: err.message };
    }

    if (outboundLabelResult) {
      // This is a downstream error (SMS, persistence, etc.) - label already created
      console.error('[SHIPPO] Downstream operation failed (label creation succeeded)', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.split('\n')[0], // Just first line of stack
        transactionId: shippoTransactionId,
      });
      return {
        success: true,
        outboundLabel: outboundLabelResult,
        returnLabel: returnLabelResult,
        downstreamError: {
          name: err?.name,
          message: err?.message,
        },
      };
    }

    console.error('[SHIPPO] Internal error during label flow', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack?.split('\n')[0],
    });
    return { success: false, reason: 'internal_error', error: err.message };
  }
}

module.exports = async (req, res) => {
  console.log('🚀 transition-privileged endpoint HIT!');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  
  // STEP 1: Confirm the endpoint is hit
  console.log('🚦 transition-privileged endpoint is wired up');
  
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;
  
  // STEP 2: Log the transition type
  console.log('🔁 Transition received:', bodyParams?.transition);
  
  // STEP 3: Check that sendSMS is properly imported
  console.log('📱 sendSMS function available:', !!sendSMS);
  console.log('📱 sendSMS function type:', typeof sendSMS);
  
  // Debug log for full request body
  console.log('🔍 Full request body:', {
    isSpeculative,
    orderData,
    bodyParams,
    queryParams,
    params: bodyParams?.params,
    rawBody: req.body,
    headers: req.headers
  });

  // Log protectedData received from frontend
  if (bodyParams?.params?.protectedData) {
    console.log('🛬 [BACKEND] Received protectedData:', bodyParams.params.protectedData);
  }

  // Properly await the SDK initialization
  const sdk = await getTrustedSdk(req);
  let lineItems = null;

  // Extract uuid from listingId if needed
  const listingId = bodyParams?.params?.listingId?.uuid || bodyParams?.params?.listingId;
  const transactionId = bodyParams?.params?.transactionId?.uuid || bodyParams?.params?.transactionId;
  console.log('🟠 About to call sdk.listings.show with listingId:', listingId);

  // Debug log for listingId and transaction details
  console.log('📋 Request parameters check:', {
    listingId: listingId,
    hasListingId: !!listingId,
    transition: bodyParams?.transition,
    params: bodyParams?.params,
    transactionId: transactionId,
    hasTransactionId: !!transactionId
  });

  // Verify we have the required parameters before making the API call
  // For accept, we only need the transactionId. For other transitions we expect listingId.
  if (!listingId && bodyParams?.transition !== 'transition/accept') {
    console.error('❌ EARLY RETURN: Missing required listingId parameter');
    return res.status(400).json({
      errors: [{
        status: 400,
        code: 'validation-missing-key',
        title: 'Missing required listingId parameter'
      }]
    });
  }

  const listingPromise = () => {
    console.log('📡 Making listing API call with params:', {
      listingId: listingId,
      url: '/v1/api/listings/show'
    });
    // include: ['author'] populates listing.relationships.author.data.id,
    // which the Step 3 accept-time provider hydration helper relies on
    // (see hydrateProviderFieldsFromProfile call below). Without this, the
    // relationship is null and hydration silently skips, blocking mobile
    // accepts that send empty params.
    return sdk.listings.show({ id: listingId, include: ['author'] });
  };

  try {
    const [showListingResponse, fetchAssetsResponse] = await Promise.all([listingPromise(), fetchCommission(sdk)]);
    
    console.log('✅ Listing API response:', {
      status: showListingResponse?.status,
      hasData: !!showListingResponse?.data?.data,
      listingId: showListingResponse?.data?.data?.id
    });

    const listing = showListingResponse.data.data;
    const commissionAsset = fetchAssetsResponse.data.data[0];

    const { providerCommission, customerCommission } =
      commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

    // Get current user ID for shipping estimates (if available)
    let currentUserId = null;
    try {
      const currentUserResponse = await sdk.currentUser.show({ id: 'me' });
      currentUserId = currentUserResponse?.data?.data?.id?.uuid || null;
      console.log('[transition-privileged] Current user ID:', currentUserId);
    } catch (err) {
      console.log('[transition-privileged] Could not fetch current user:', err.message);
    }

    // Debug log for orderData
    console.log("📦 orderData for lineItems:", orderData);

    // Only calculate lineItems here if not transition/accept
    let transition = bodyParams?.transition;
    if (transition !== 'transition/accept') {
      if (orderData) {
        lineItems = await transactionLineItems(
          listing,
          { ...orderData, ...bodyParams.params },
          providerCommission,
          customerCommission,
          { currentUserId, sdk }
        );
      } else {
        console.warn("⚠️ No orderData provided for non-accept transition. This may cause issues.");
      }
    } else {
      console.log("ℹ️ Skipping lineItems generation — transition/accept will calculate from booking.");
    }

    // Debug log for lineItems
    console.log('💰 Generated lineItems:', {
      hasLineItems: !!lineItems,
      lineItemsCount: lineItems?.length,
      lineItems,
      params: bodyParams?.params,
      listingId: listing?.id
    });

    // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
    const { listingId: _, ...restParams } = bodyParams?.params || {};

    // Always include protectedData in params if present
    let params = { ...restParams };
    if (orderData && orderData.protectedData) {
      params.protectedData = orderData.protectedData;
    }
    // Always include lineItems if present
    if (lineItems) {
      params.lineItems = lineItems;
    }

    // Set id for transition/request-payment and transition/accept
    let id = null;
    // Defensive check for bodyParams and .transition
    if (bodyParams && (bodyParams.transition === 'transition/request-payment' || bodyParams.transition === 'transition/confirm-payment')) {
      id = transactionId;
      
      // Sanitize incoming protectedData for request-payment to avoid blank strings overwriting existing values
      if (params.protectedData) {
        const cleaned = Object.fromEntries(
          Object.entries(params.protectedData).filter(([, v]) => v != null && String(v).trim() !== '')
        );
        
        // Server-side phone normalization (safety net for E.164)
        if (cleaned.customerPhone) {
          cleaned.customerPhone = normalizePhoneE164(cleaned.customerPhone, 'US');
          console.log('📞 [request-payment] Normalized customerPhone to E.164:', cleaned.customerPhone);
        }
        if (cleaned.providerPhone) {
          cleaned.providerPhone = normalizePhoneE164(cleaned.providerPhone, 'US');
        }
        if (cleaned.customerPhoneShipping) {
          cleaned.customerPhoneShipping = normalizePhoneE164(cleaned.customerPhoneShipping, 'US');
        }
        
        params.protectedData = cleaned;
        console.log('🧹 [request-payment] Sanitized protectedData keys:', Object.keys(cleaned));
      }
    } else if (bodyParams && bodyParams.transition === 'transition/accept') {
      id = transactionId;
      // --- [AI EDIT] Fetch protectedData from transaction and robustly merge with incoming params ---
      const transactionIdUUID =
        (bodyParams?.params?.transactionId?.uuid) ||
        (transactionId?.uuid) ||
        (typeof transactionId === 'string' ? transactionId : null);
      if (bodyParams?.transition === 'transition/accept' && transactionIdUUID) {
        try {
          const transaction = await sdk.transactions.show({
            id: transactionIdUUID,
            include: ['booking'],
          });
          const txProtectedData = transaction?.data?.data?.attributes?.protectedData || {};
          const incomingProtectedData = bodyParams?.params?.protectedData || {};
          
          // Debug logging to understand the data flow
          console.log('🔍 [DEBUG] Transaction protectedData:', txProtectedData);
          console.log('🔍 [DEBUG] Incoming protectedData:', incomingProtectedData);
          console.log('🔍 [DEBUG] Transaction customer relationship:', transaction?.data?.data?.relationships?.customer);
          
          // Remove blank updates from incoming data
          const cleaned = Object.fromEntries(
            Object.entries(incomingProtectedData).filter(([, v]) => v != null && String(v).trim() !== '')
          );
          
          // Now merge: transaction first, then cleaned updates
          const mergedProtectedData = { ...txProtectedData, ...cleaned };

          // Explicitly protect customer* fields from being overwritten by blank strings:
          const CUSTOMER_KEYS = [
            'customerName','customerStreet','customerStreet2','customerCity',
            'customerState','customerZip','customerEmail','customerPhone'
          ];
          for (const k of CUSTOMER_KEYS) {
            if ((mergedProtectedData[k] == null || mergedProtectedData[k] === '') && txProtectedData[k]) {
              mergedProtectedData[k] = txProtectedData[k];
            }
          }

          // Defensive scrub for the lender-SMS-to-borrower bug (tx 6a1a18ad...):
          // pre-fix borrower checkout wrote currentUser's phone/email into
          // protectedData.providerPhone / providerEmail. That meant the
          // Step-3 "Ship by" SMS (and lender outbound email) were sent to
          // the borrower's contact info. If the value in PD matches the
          // borrower's customer* contact, treat it as polluted and drop it
          // so hydrateProviderFieldsFromProfile() refills from the lender's
          // profile. Lender form submissions (clean string, doesn't match
          // customer*) are preserved.
          const norm = v => (typeof v === 'string' ? v.trim().toLowerCase() : v);
          if (
            mergedProtectedData.providerPhone &&
            mergedProtectedData.customerPhone &&
            norm(mergedProtectedData.providerPhone) === norm(mergedProtectedData.customerPhone) &&
            !(cleaned && Object.prototype.hasOwnProperty.call(cleaned, 'providerPhone'))
          ) {
            console.warn('[ACCEPT][SCRUB] providerPhone matches customerPhone — dropping polluted value so profile hydration can refill');
            mergedProtectedData.providerPhone = '';
          }
          if (
            mergedProtectedData.providerEmail &&
            mergedProtectedData.customerEmail &&
            norm(mergedProtectedData.providerEmail) === norm(mergedProtectedData.customerEmail) &&
            !(cleaned && Object.prototype.hasOwnProperty.call(cleaned, 'providerEmail'))
          ) {
            console.warn('[ACCEPT][SCRUB] providerEmail matches customerEmail — dropping polluted value so profile hydration can refill');
            mergedProtectedData.providerEmail = '';
          }
          
          console.log('[server accept] merged PD keys:', Object.keys(mergedProtectedData));

          // Set both params.protectedData and top-level fields from mergedProtectedData
          params.protectedData = mergedProtectedData;
          Object.assign(params, mergedProtectedData); // Overwrite top-level fields with merged values
          // Log the final params before validation
          console.log('🟢 Params before validation:', params);
          // Debug log for final merged provider fields
          console.log('✅ [MERGE FIX] Final merged provider fields:', {
            providerStreet: mergedProtectedData.providerStreet,
            providerCity: mergedProtectedData.providerCity,
            providerState: mergedProtectedData.providerState,
            providerZip: mergedProtectedData.providerZip,
            providerEmail: mergedProtectedData.providerEmail,
            providerPhone: mergedProtectedData.providerPhone
          });
        } catch (err) {
          console.error('❌ Failed to fetch or apply protectedData from transaction:', err.message);
        }
      }
    } else if (bodyParams && (bodyParams.transition === 'transition/decline' || bodyParams.transition === 'transition/expire' || bodyParams.transition === 'transition/cancel')) {
      // Use transactionId for transaction-based transitions
      id = transactionId;
      console.log('🔧 Using transactionId for transaction-based transition:', bodyParams.transition);
    } else {
      id = listingId;
    }

    // Log bodyParams.params after protectedData is applied
    console.log('📝 [DEBUG] bodyParams.params after protectedData applied:', bodyParams.params);

    // Defensive log for id
    console.log('🟢 Using id for Flex API call:', id);

    // IMPORTANT: use the merged params object we built above
    const body = {
      id,
      transition: bodyParams?.transition,
      params, // merged / cleaned / validated
    };

    // Log the final body before transition
    console.log('🚀 [DEBUG] Final body sent to Flex API:', JSON.stringify(body, null, 2));
    console.log('📦 [DEBUG] Full body object:', body);
    if (body.params && body.params.protectedData) {
      console.log('🔒 [DEBUG] protectedData in final body:', body.params.protectedData);
    }

    console.log('🔍 [DEBUG] About to start validation logic...');

    // Add error handling around validation logic
    try {
      console.log('🔍 [DEBUG] Starting validation checks...');
      
      const ACCEPT_TRANSITION = 'transition/accept';
      const transition = bodyParams?.transition;
      
      // Validate required provider and customer address fields before making the SDK call
      const requiredProviderFields = [
        'providerStreet',
        'providerCity',
        'providerState',
        'providerZip',
        'providerEmail',
        'providerPhone',
      ];
      // Customer fields are NOT required at accept; they're optional.
      const requiredCustomerFields = [];
      
      console.log('🔍 [DEBUG] Required provider fields:', requiredProviderFields);
      console.log('🔍 [DEBUG] Required customer fields:', requiredCustomerFields);
      console.log('🔍 [DEBUG] Provider field values:', {
        providerStreet: params.providerStreet,
        providerCity: params.providerCity,
        providerState: params.providerState,
        providerZip: params.providerZip,
        providerEmail: params.providerEmail,
        providerPhone: params.providerPhone
      });
      console.log('🔍 [DEBUG] Customer field values:', {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerStreet: params.customerStreet,
        customerCity: params.customerCity,
        customerState: params.customerState,
        customerZip: params.customerZip,
        customerPhone: params.customerPhone
      });
      
      // Validate only PROVIDER fields on accept.
      if (transition === ACCEPT_TRANSITION) {
        console.log('🔍 [DEBUG] Validating provider fields for transition/accept');

        // Server-side fallback (Step 3 of persistent lender shipping
        // address): hydrate missing provider* fields from the provider
        // user's saved profile.protectedData.lenderShippingAddress.
        // Lets mobile (and any future client) accept without
        // re-implementing the form-prefill mapping. Client-supplied
        // values win — only empty fields get hydrated.
        try {
          const providerIdRel =
            listing?.relationships?.author?.data?.id ?? null;
          const providerIdStr =
            (providerIdRel && typeof providerIdRel === 'object' && providerIdRel.uuid) ||
            (typeof providerIdRel === 'string' ? providerIdRel : null);
          if (providerIdStr) {
            const iSdk = getIntegrationSdk();
            const provResp = await iSdk.users.show({ id: providerIdStr });
            const provAttrs = provResp?.data?.data?.attributes || {};
            const lenderAddr = provAttrs?.profile?.protectedData?.lenderShippingAddress;
            const provEmail = provAttrs?.email;
            const hydrated = hydrateProviderFieldsFromProfile(params, lenderAddr, provEmail);
            if (hydrated.length) {
              console.log('[ACCEPT][HYDRATE] Hydrated provider fields from profile:', hydrated);
            } else {
              console.log('[ACCEPT][HYDRATE] No provider fields needed hydration');
            }
          } else {
            console.warn('[ACCEPT][HYDRATE] No provider id on listing.relationships.author; skipping hydration');
          }
        } catch (hydrationErr) {
          console.warn('[ACCEPT][HYDRATE] Failed to hydrate provider fields from profile:', hydrationErr.message);
        }

        // Check both the flattened params and params.protectedData
        const pd = params?.protectedData || {};
        const missingProvider = requiredProviderFields.filter(
          k => !(params?.[k] ?? pd?.[k])
        );
        if (missingProvider.length) {
          console.error('❌ [server][accept] missing provider fields:', missingProvider);
          return res.status(422).json({
            code: 'transition/accept-missing-provider',
            message: 'Missing provider fields for accept transition.',
            missing: missingProvider,
          });
        }
      }
      
      console.log('✅ Validation completed successfully');
    } catch (validationError) {
      console.error('❌ Validation error:', validationError);
      console.error('❌ Validation error stack:', validationError.stack);
      return res.status(500).json({ error: 'Validation error', details: validationError.message });
    }

    // Perform the actual transition
    let transitionName;
    try {
      console.log('🎯 About to make SDK transition call:', {
        transition: bodyParams?.transition,
        id: id,
        isSpeculative: isSpeculative
      });
      
      // If this is transition/accept, log the transaction state before attempting
      if (bodyParams && bodyParams.transition === 'transition/accept') {
        try {
          const transactionShow = await sdk.transactions.show({ id: id });
          console.log('🔎 Current state:', transactionShow.data.data.attributes.state);
          console.log('🔎 Last transition:', transactionShow.data.data.attributes.lastTransition);
          // Log protectedData from transaction entity
          console.log('🔎 [BACKEND] Transaction protectedData:', transactionShow.data.data.attributes.protectedData);
          // If params.protectedData is missing or empty, fallback to transaction's protectedData
          if (!params.protectedData || Object.values(params.protectedData).every(v => v === '' || v === undefined)) {
            params.protectedData = transactionShow.data.data.attributes.protectedData || {};
            console.log('🔁 [BACKEND] Fallback: Using transaction protectedData for accept:', params.protectedData);
          }
        } catch (showErr) {
          console.error('❌ Failed to fetch transaction before accept:', showErr.message);
        }
      }
      
      console.log('🚀 Making final SDK transition call...');
      
      // Use Marketplace SDK for transition, then upsert protectedData via Integration SDK
      const flexIntegrationSdk = getIntegrationSdk();
      let response;
      
      if (bodyParams?.transition === 'transition/accept' && !isSpeculative) {
        console.log('🔐 [ACCEPT] Using Marketplace SDK for transition');
        
        // Extract plain UUID string for Integration SDK usage later
        const txIdPlain = 
          (typeof id === 'string') ? id :
          id?.uuid || 
          bodyParams?.params?.transactionId?.uuid ||
          bodyParams?.id;
        
        if (!txIdPlain) {
          console.error('❌ [ACCEPT] Missing transaction ID');
          return res.status(400).json({ error: 'Missing transaction id' });
        }
        
        // Store mergedProtectedData for later upsert
        const mergedProtectedData = params.protectedData || {};
        
        console.log('🔐 [ACCEPT] txId (plain):', txIdPlain);
        console.log('🔐 [ACCEPT] protectedData keys:', Object.keys(mergedProtectedData));
        console.log('🔐 [ACCEPT] providerZip:', mergedProtectedData.providerZip);
        console.log('🔐 [ACCEPT] customerZip:', mergedProtectedData.customerZip);
        
        try {
          // Execute transition with Marketplace SDK (user-scoped)
          response = await sdk.transactions.transition(body, queryParams);
          
          console.log('✅ [ACCEPT] Marketplace transition completed');
        } catch (e) {
          const err = e?.response?.data?.errors?.[0] || {};
          console.error('[ACCEPT][ERR]', {
            status: e?.response?.status,
            code: err.code,
            title: err.title,
            details: err.details || err.message,
          });
          return res.status(500).json({ 
            error: 'transition/accept-failed',
            details: err.code || e.message 
          });
        }
        
        // AFTER transition succeeds, persist protectedData via Integration SDK
        try {
          console.log('[ACCEPT][PD] Upserting protectedData via Integration', Object.keys(mergedProtectedData));
          await txUpdateProtectedData(txIdPlain, mergedProtectedData, { source: 'accept' });
          console.log('[ACCEPT][PD] Upsert complete');
        } catch (pdErr) {
          console.error('[ACCEPT][PD] Upsert failed:', pdErr.message);
          // Don't fail the request, but log it
        }
        
        // Immediately VERIFY by fetching the transaction and logging zip codes
        try {
          const verify = await flexIntegrationSdk.transactions.show({ id: txIdPlain, include: ['provider','customer'] });
          const pd = verify?.data?.data?.attributes?.protectedData || {};
          console.log('[VERIFY][ACCEPT] PD zips after upsert', { 
            providerZip: pd.providerZip, 
            customerZip: pd.customerZip 
          });
          
          // Warn if critical fields are missing
          if (!pd.providerZip) {
            console.warn('⚠️ [VERIFY][ACCEPT] Missing providerZip after upsert!');
          }
          if (!pd.customerZip) {
            console.warn('⚠️ [VERIFY][ACCEPT] Missing customerZip after upsert!');
          }
        } catch (verifyErr) {
          console.error('❌ [VERIFY][ACCEPT] Failed to verify protectedData:', verifyErr.message);
        }
      } else {
        // Use regular SDK for other transitions
        response = isSpeculative
          ? await sdk.transactions.transitionSpeculative(body, queryParams)
          : await sdk.transactions.transition(body, queryParams);
      }
      
      console.log('✅ SDK transition call SUCCESSFUL:', {
        status: response?.status,
        hasData: !!response?.data,
        transition: response?.data?.data?.attributes?.transition
      });
      
      // After successful transition, fetch fully expanded transaction for ship-by calculations
      let expandedTx = response?.data?.data;
      if (bodyParams?.transition === 'transition/accept') {
        try {
          const txId = bodyParams?.params?.transactionId?.uuid || bodyParams?.id || id;
          console.log('🔍 Fetching expanded transaction for ship-by calculations:', txId);
          
          const { data: expandedResponse } = await sdk.transactions.show({ id: txId }, { 
            include: ['booking', 'listing', 'provider', 'customer'], 
            expand: true 
          });
          
          expandedTx = expandedResponse?.data;
          console.log('✅ Expanded transaction fetched successfully for ship-by calculations');
        } catch (expandError) {
          console.warn('⚠️ Failed to fetch expanded transaction, using original response:', expandError.message);
        }
      }
      
      // Set acceptedAt for transition/accept if not already set
      if (bodyParams?.transition === 'transition/accept' && response?.data?.data) {
        const transaction = response.data.data;
        const protectedData = transaction.attributes.protectedData || {};
        const outbound = protectedData.outbound || {};
        
        if (!outbound.acceptedAt) {
          try {
            const txId = transaction.id.uuid || transaction.id;
            const result = await upsertProtectedData(txId, {
              outbound: {
                ...outbound,
                acceptedAt: timestamp() // ← respects FORCE_NOW
              }
            }, { source: 'accept' });
            
            if (result && result.success === false) {
              console.error('❌ Failed to set acceptedAt (non-critical):', result.error);
            } else {
              console.log('💾 Set outbound.acceptedAt for transition/accept');
            }
          } catch (updateError) {
            console.error('❌ Failed to set acceptedAt (non-critical):', updateError.message);
            // Do not rethrow - this is a non-essential update
          }
        }
      }
      
      // After booking (request-payment), log the transaction's protectedData
      if (bodyParams && bodyParams.transition === 'transition/request-payment' && response && response.data && response.data.data && response.data.data.attributes) {
        console.log('🧾 Booking complete. Transaction protectedData:', response.data.data.attributes.protectedData);
      }
      
      // Defensive: Only access .transition if response and response.data are defined
      if (
        response &&
        response.data &&
        response.data.data &&
        response.data.data.attributes &&
        typeof response.data.data.attributes.transition !== 'undefined'
      ) {
        transitionName = response.data.data.attributes.transition;
      }
      
      // Debug transitionName
      console.log('🔍 transitionName after response:', transitionName);
      console.log('🔍 bodyParams.transition:', bodyParams?.transition);
      
      // STEP 4: Add a forced test log
      console.log('🧪 Inside transition-privileged — beginning SMS evaluation');
      
      // Dynamic provider SMS for booking requests - replace hardcoded test SMS
      const effectiveTransition = transitionName || bodyParams?.transition;
      console.log('🔍 Using effective transition for SMS:', effectiveTransition);
      
      if (effectiveTransition === 'transition/accept') {
        console.log('📨 Preparing to send SMS for transition/accept');
        
        // Skip SMS on speculative calls
        if (isSpeculative) {
          console.log('⏭️ Skipping SMS - speculative call');
          return;
        }
        
        try {
          // Resolve phone numbers with robust fallbacks
          const pd = params?.protectedData || {};
          const txPD = response?.data?.data?.protectedData || {};
          const tx = response?.data?.data;
          
          const borrowerPhone = getBorrowerPhone(params, tx);
          const lenderPhone = getLenderPhone(params, tx);
          
          console.log('[sms] resolved phones:', { 
            borrowerPhone: maskPhone(borrowerPhone), 
            lenderPhone: maskPhone(lenderPhone) 
          });
          
          // Get listing info for messages
          const listingTitle = listing?.attributes?.title || 'your item';
          const providerName = params?.protectedData?.providerName || 'the lender';
          
          // Build order page URL for borrower (resilient to different ID shapes)
          const txIdForUrl = 
            tx?.id?.uuid ||
            transactionId?.uuid ||
            transactionId ||
            bodyParams?.params?.transactionId?.uuid;
          const fullOrderUrl = orderUrl(txIdForUrl);
          
          // Use shortlink if available to keep SMS compact (emojis force UCS-2 encoding = 70 char segments)
          // shortLink() already returns original URL if LINK_SECRET/Redis not configured
          let buyerLink;
          try {
            buyerLink = await shortLink(fullOrderUrl);
          } catch (err) {
            console.warn('[sms] shortLink failed, using full URL:', err.message);
            buyerLink = fullOrderUrl;
          }
          
          // Borrower acceptance SMS: always try if borrowerPhone exists.
          // Copy refresh May 7, 2026 — aligned to workbook v13 2a-SMS row.
          // Single-line, item-focused; providerName is no longer interpolated
          // (still resolved above for any future use, but not in this string).
          if (borrowerPhone) {
            console.log('[sms] sending borrower_accept ...');
            const borrowerMessage = `🎉 Sherbrt 🍧: Your request for "${listingTitle}" was accepted! We'll share tracking once it ships. View details: ${buyerLink}.`;
            
            // Debug: log SMS length (Note: actual SMS segmentation depends on carrier encoding, newlines, etc.)
            console.log('[sms] borrower_accept length:', borrowerMessage.length, 'chars');
            
            try {
              await sendSMS(borrowerPhone, borrowerMessage, { 
                role: 'customer',
                transactionId: transactionId,
                transition: 'transition/accept',
                tag: 'accept_to_borrower',
                meta: { listingId: listing?.id?.uuid || listing?.id }
              });
              console.log('✅ SMS sent successfully to borrower');
            } catch (err) {
              console.error('❌ Borrower SMS send error:', err.message);
            }
          } else {
            console.warn('[sms] borrower phone not found; skipped borrower accept SMS');
          }
          
          // Lender SMS: only send on accept if explicitly enabled
          if (process.env.SMS_LENDER_ON_ACCEPT === '1') {
            if (lenderPhone) {
              console.log('[sms] sending lender_accept_no_label ...');
              const lenderMessage = `✅ Your Sherbrt item "${listingTitle}" was accepted! Please prepare for shipping.`;
              
              try {
                await sendSMS(lenderPhone, lenderMessage, { 
                  role: 'lender',
                  transactionId: transactionId,
                  transition: 'transition/accept',
                  tag: 'accept_to_lender',
                  meta: { listingId: listing?.id?.uuid || listing?.id }
                });
                console.log('✅ SMS sent successfully to lender');
              } catch (err) {
                console.error('❌ Lender SMS send error:', err.message);
              }
            } else {
              console.warn('[sms] lender phone not found; skipped lender SMS');
            }
          } else {
            console.log('[sms] lender-on-accept suppressed (by flag).');
          }
          
        } catch (smsError) {
          console.error('❌ Failed to send SMS notification:', smsError.message);
          console.error('❌ SMS error stack:', smsError.stack);
          // Don't fail the transaction if SMS fails
        }
      }

      if (effectiveTransition === 'transition/decline') {
        console.log('📨 Preparing to send SMS for transition/decline');
        
        // Skip SMS on speculative calls
        if (isSpeculative) {
          console.log('⏭️ Skipping SMS - speculative call');
          return;
        }
        
        try {
          // Use the helper function to get borrower phone with fallbacks
          const borrowerPhone = getBorrowerPhone(params, response?.data?.data);
          
          // Log the selected phone number and role for debugging
          console.log('📱 Selected borrower phone:', maskPhone(borrowerPhone));
          console.log('📱 SMS role: customer');
          console.log('🔍 Transition: transition/decline');
          
          if (borrowerPhone) {
            // Copy refresh May 7, 2026 — aligned to workbook v13 2b-SMS row.
            // Switched from per-tx order URL (declineLink) to a static
            // browse/re-shop link so the borrower lands on more inventory
            // rather than the dead transaction view. Same link is used by
            // 1c-SMS in sendLenderRequestReminders.js — refactor to env
            // var BORROWER_RESHOP_URL is tracked as a follow-up in the
            // May 7 backlog (CLAUDE_CONTEXT.md).
            // Sept 11, 2026: the old /r/ short link had expired and rendered
            // as "invalid/expired link" for borrowers. Point at the canonical
            // search results page instead — no shortener, nothing to expire.
            // Trailing period removed so iOS doesn't swallow it into the URL.
            const BORROWER_RESHOP_URL = process.env.BORROWER_RESHOP_URL || 'https://sherbrt.com/s';
            const message = `😔 Sherbrt 🍧: Your borrow request was declined. Don't worry — new looks are waiting to be borrowed! Check them out!  ${BORROWER_RESHOP_URL}`;
            
            // Debug: log SMS length (Note: actual SMS segmentation depends on carrier encoding, newlines, etc.)
            console.log('[sms] borrower_decline length:', message.length, 'chars');
            
            // Wrap sendSMS in try/catch with logs
            try {
              await sendSMS(borrowerPhone, message, { 
                role: 'customer',
                transactionId: transactionId,
                transition: 'transition/decline',
                tag: 'reject_to_borrower',
                meta: { listingId: listing?.id?.uuid || listing?.id }
              });
              console.log('✅ SMS sent successfully to borrower');
              console.log(`📱 SMS sent to borrower (${maskPhone(borrowerPhone)}) for declined request`);
            } catch (err) {
              console.error('❌ SMS send error:', err.message);
              console.error('❌ SMS error stack:', err.stack);
            }
          } else {
            console.warn('⚠️ Borrower phone number not found - cannot send decline SMS');
            console.warn('⚠️ Check params.protectedData.customerPhone or transaction data');
          }
        } catch (smsError) {
          console.error('❌ Failed to send SMS notification:', smsError.message);
          console.error('❌ SMS error stack:', smsError.stack);
          // Don't fail the transaction if SMS fails
        }
      }
      
      // Shippo label creation - only for transition/accept after successful transition
      if (bodyParams?.transition === 'transition/accept' && !isSpeculative) {
        console.log('🚀 [SHIPPO] Transition successful, triggering Shippo label creation...');
        
        // Use the validated and merged protectedData from params
        const finalProtectedData = params.protectedData || {};
        console.log('📋 [SHIPPO] Final protectedData for label creation:', finalProtectedData);
        
        // Hard guard: Check for required customer address fields before Shippo
        if (!hasCustomerShipAddress(finalProtectedData)) {
          const missingFields = [];
          if (!finalProtectedData.customerStreet?.trim()) missingFields.push('customerStreet');
          if (!finalProtectedData.customerZip?.trim()) missingFields.push('customerZip');
          
          console.log(`[SHIPPO] Missing address fields; aborting label creation and transition: ${missingFields.join(', ')}`);
          return res.status(400).json({ 
            code: 'incomplete_customer_address',
            message: 'Customer address is incomplete for shipping',
            missingFields 
          });
        }
        
        // Trigger Shippo label creation asynchronously (don't await to avoid blocking response)
        createShippingLabels({
          txId: transactionId,
          listing,
          protectedData: finalProtectedData,
          providerPhone: finalProtectedData?.providerPhone,
          integrationSdk: sdk,
          sendSMS,
          normalizePhone: (p) => {
            const digits = (p || '').replace(/\D/g, '');
            if (!digits) return null;
            return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
          },
          selectedRate: null, // Will be set inside the function
          transaction: expandedTx || response?.data?.data
        })
          .then(result => {
            if (result.success) {
              console.log('✅ [SHIPPO] Label creation completed successfully');
            } else {
              console.warn('⚠️ [SHIPPO] Label creation failed:', result.reason);
            }
          })
          .catch(err => {
            console.error('❌ [SHIPPO] Unexpected error in label creation:', err.message);
          });
      }
      
      console.log('✅ Transition completed successfully, returning:', { transition: transitionName });
      return res.status(200).json({ transition: transitionName });
    } catch (err) {
      console.error('❌ SDK transition call FAILED:', {
        error: err,
        errorMessage: err.message,
        errorResponse: err.response?.data,
        errorStatus: err.response?.status,
        errorStatusText: err.response?.statusText,
        fullError: JSON.stringify(err, null, 2)
      });
      return res.status(500).json({ error: 'Transition failed' });
    }
  } catch (e) {
    const errorData = e.response?.data;
    console.error("❌ Flex API error:", errorData || e);
    return res.status(500).json({ 
      error: "Flex API error",
      details: errorData || e.message
    });
  }
};

// Expose rate selector for unit tests (10.0 PR-1). The primary export is
// the middleware above; attaching as a property leaves that contract intact.
module.exports.pickCheapestAllowedRate = pickCheapestAllowedRate;
module.exports.hydrateProviderFieldsFromProfile = hydrateProviderFieldsFromProfile;
module.exports.findMatchingRate = findMatchingRate;
module.exports.LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS = LOCKED_RATE_AMOUNT_DELTA_ALERT_CENTS;

// Add a top-level handler for unhandled promise rejections to help diagnose Render 'failed service' issues
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process if desired:
  // process.exit(1);
});

