const twilio = require('twilio');
const { maskPhone } = require('./phone');
const { attempt, sent, failed } = require('./metrics');
console.log('📦 Twilio module loaded');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In-memory duplicate prevention (resets on restart)
const recentSends = new Map(); // key: `${transactionId}:${transition}:${role}`, value: timestamp
const DUPLICATE_WINDOW_MS = 60000; // 60 seconds

// Helper function to normalize phone number to E.164 format
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's already in E.164 format (starts with +), return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If it's 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits and starts with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it's 11 digits and doesn't start with 1, assume it's already international
  if (digits.length === 11) {
    return `+${digits}`;
  }
  
  // If it's 12 digits and starts with 1, add +
  if (digits.length === 12 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // For any other format, try to make it work
  if (digits.length >= 10) {
    return `+${digits}`;
  }
  
  console.warn(`📱 Could not normalize phone number: ${phone}`);
  return null;
}

// E.164 validation
function isE164(num) { 
  return /^\+\d{10,15}$/.test(String(num || '')); 
}

// Duplicate prevention helper
function isDuplicateSend(transactionId, transition, role) {
  if (!transactionId || !transition || !role) {
    return false; // Can't prevent duplicates without all identifiers
  }
  
  const key = `${transactionId}:${transition}:${role}`;
  const now = Date.now();
  const lastSent = recentSends.get(key);
  
  if (lastSent && (now - lastSent) < DUPLICATE_WINDOW_MS) {
    return true; // Duplicate detected within window
  }
  
  // Update the timestamp and clean old entries
  recentSends.set(key, now);
  
  // Clean up old entries (older than 5 minutes) to prevent memory leaks
  if (recentSends.size > 1000) { // Only clean when we have many entries
    const cutoff = now - (5 * 60 * 1000); // 5 minutes
    for (const [k, timestamp] of recentSends.entries()) {
      if (timestamp < cutoff) {
        recentSends.delete(k);
      }
    }
  }
  
  return false;
}

// Optional in-memory STOP list (resets on restart)
const stopList = new Set();

/**
 * sendSMS(phone, message, opts?)
 * opts: { 
 *   role?: 'lender' | 'borrower' | 'customer',
 *   transactionId?: string,
 *   transition?: string
 * }
 */
async function sendSMS(to, message, opts = {}) {
  const { role, transactionId, transition } = opts;
  
  if (!role && process.env.METRICS_LOG === '1') {
    console.warn('[metrics] skipped: no role provided to sendSMS');
  }

  if (!to || !message) {
    console.warn('📭 Missing phone number or message');
    return Promise.resolve();
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️ Twilio env vars missing — skipping SMS');
    return Promise.resolve();
  }

  // Duplicate prevention check
  if (transactionId && transition && role) {
    if (isDuplicateSend(transactionId, transition, role)) {
      console.warn(`🔄 [DUPLICATE] SMS suppressed for ${transactionId}:${transition}:${role} within ${DUPLICATE_WINDOW_MS}ms window`);
      return { suppressed: true, reason: 'duplicate_within_window' };
    }
  }

  // Normalize the phone number to E.164
  const normalizedPhone = normalizePhoneNumber(to);
  if (!normalizedPhone) {
    console.warn(`📱 Invalid phone number format: ${to}`);
    if (role) failed(role, 'invalid_format');
    return Promise.resolve();
  }

  // E.164 validation
  if (!isE164(normalizedPhone)) {
    console.warn('[SMS] invalid phone, aborting:', to ? maskPhone(to) : 'null');
    if (role) failed(role, 'invalid_e164');
    throw new Error('Invalid E.164 phone');
  }

  // Check STOP list
  if (stopList.has(normalizedPhone)) {
    console.warn('[SMS] suppressed: number opted out (STOP):', maskPhone(normalizedPhone));
    return { suppressed: true, reason: 'stop_list' };
  }

  // 🔍 CRITICAL INVESTIGATION: Get call stack to identify which function called sendSMS
  const stack = new Error().stack;
  const caller = stack.split('\n')[2]?.trim() || 'Unknown caller';
  
  // Gate full-number logs for local debugging only
  const devFullLogs = process.env.SMS_DEBUG_FULL === '1' && process.env.NODE_ENV !== 'production';
  
  // Metrics: attempt only if role provided
  if (role) attempt(role);
  
  // Enhanced logging with raw vs normalized phone comparison
  console.log(`📱 [CRITICAL] === SEND SMS CALLED ===`);
  console.log(`📱 [CRITICAL] Caller function: ${caller}`);
  console.log(`📱 [CRITICAL] Raw phone: ${maskPhone(to)}`);
  console.log(`📱 [CRITICAL] Normalized phone: ${maskPhone(normalizedPhone)}`);
  console.log(`📱 [CRITICAL] SMS message: ${message}`);
  console.log(`📱 [CRITICAL] Role: ${role || 'none'}`);
  if (transactionId && transition) {
    console.log(`📱 [CRITICAL] Transaction: ${transactionId}:${transition}`);
  }
  if (devFullLogs) {
    console.debug('[DEV ONLY] Raw number:', to);
    console.debug('[DEV ONLY] Normalized number:', normalizedPhone);
  }
  console.log(`📱 [CRITICAL] ========================`);

  return client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhone,
    })
    .then(msg => {
      // Success
      if (role) sent(role);
      console.log(`📤 [CRITICAL] SMS sent successfully to ${maskPhone(normalizedPhone)}`);
      console.log(`📤 [CRITICAL] Twilio message SID: ${msg.sid}`);
      console.log(`📤 [CRITICAL] Raw → Normalized: ${maskPhone(to)} → ${maskPhone(normalizedPhone)}`);
      return msg;
    })
    .catch(err => {
      // Optional: map Twilio error codes as before (21610 etc.)
      const code = err?.code || err?.status || 'unknown';
      if (role) failed(role, code);
      console.warn('[SMS] failed', { 
        code, 
        rawPhone: maskPhone(to), 
        normalizedPhone: maskPhone(normalizedPhone),
        error: err.message 
      });

      // 21610: STOP. Avoid future sends in this process.
      if (String(code) === '21610') stopList.add(normalizedPhone);
      throw err;
    });
}

module.exports = { sendSMS }; 