const twilio = require('twilio');
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

  console.log(`📱 Sending SMS to ${formattedPhone} (original: ${to})`);

  return client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })
    .then(msg => {
      console.log(`📤 Sent SMS to ${formattedPhone}: ${message}`);
      return msg;
    })
    .catch(err => {
      console.error(`❌ Failed to send SMS to ${formattedPhone}:`, err);
    });
}

module.exports = { sendSMS }; 