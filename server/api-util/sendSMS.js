const twilio = require('twilio');
console.log('📦 Twilio module loaded');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function sendSMS(to, message) {
  if (!to || !message) {
    console.warn('📭 Missing phone number or message');
    return Promise.resolve();
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️ Twilio env vars missing — skipping SMS');
    return Promise.resolve();
  }

  return client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })
    .then(msg => {
      console.log(`📤 Sent SMS to ${to}: ${message}`);
      return msg;
    })
    .catch(err => {
      console.error(`❌ Failed to send SMS to ${to}:`, err);
    });
}

module.exports = { sendSMS }; 