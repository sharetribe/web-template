const twilio = require('twilio');
const { maskPhone } = require('./phone');
const { attempt, sent, failed } = require('./metrics');
console.log('📦 Twilio module loaded');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper function to format phone number to E.164
function formatPhoneNumber(phone) {
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
  
  console.warn(`📱 Could not format phone number: ${phone}`);
  return null;
}

// E.164 validation
function isE164(num) { 
  return /^\+\d{10,15}$/.test(String(num || '')); 
}

// Optional in-memory STOP list (resets on restart)
const stopList = new Set();

function sendSMS(to, message) {
  if (!to || !message) {
    console.warn('📭 Missing phone number or message');
    return Promise.resolve();
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️ Twilio env vars missing — skipping SMS');
    return Promise.resolve();
  }

  // Format the phone number
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    console.warn(`📱 Invalid phone number format: ${to}`);
    return Promise.resolve();
  }

  // E.164 validation
  if (!isE164(formattedPhone)) {
    console.warn('[SMS] invalid phone, aborting:', to ? maskPhone(to) : 'null');
    throw new Error('Invalid E.164 phone');
  }

  // Check STOP list
  if (stopList.has(formattedPhone)) {
    console.warn('[SMS] suppressed: number opted out (STOP):', maskPhone(formattedPhone));
    return { suppressed: true };
  }

  // 🔍 CRITICAL INVESTIGATION: Get call stack to identify which function called sendSMS
  const stack = new Error().stack;
  const caller = stack.split('\n')[2]?.trim() || 'Unknown caller';
  
  // Gate full-number logs for local debugging only
  const devFullLogs = process.env.SMS_DEBUG_FULL === '1' && process.env.NODE_ENV !== 'production';
  
  // Log attempt (caller should pass role-based metrics; if not possible, use 'unknown')
  attempt('unknown');
  
  console.log(`📱 [CRITICAL] === SEND SMS CALLED ===`);
  console.log(`📱 [CRITICAL] Caller function: ${caller}`);
  console.log(`📱 [CRITICAL] Recipient phone: ${maskPhone(formattedPhone)} (original: ${maskPhone(to)})`);
  console.log(`📱 [CRITICAL] SMS message: ${message}`);
  if (devFullLogs) console.debug('[DEV ONLY] full number:', formattedPhone);
  console.log(`📱 [CRITICAL] ========================`);

  return client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })
    .then(msg => {
      sent('unknown');
      console.log(`📤 [CRITICAL] SMS sent successfully to ${maskPhone(formattedPhone)}`);
      console.log(`📤 [CRITICAL] Twilio message SID: ${msg.sid}`);
      return msg;
    })
    .catch(err => {
      const code = err?.code || err?.status || 'unknown';
      failed('unknown', code);
      console.warn('[SMS] failed', { code, to: maskPhone(formattedPhone) });

      // 21610: STOP. Avoid future sends in this process.
      if (String(code) === '21610') stopList.add(formattedPhone);
      throw err;
    });
}

module.exports = { sendSMS }; 