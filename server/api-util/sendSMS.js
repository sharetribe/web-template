let twilio = null;
let client = null;

try {
  twilio = require('twilio');
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} catch (error) {
  console.warn('⚠️ Twilio module not available — SMS functionality disabled');
}

function sendSMS(to, message) {
  if (!twilio || !client) {
    console.warn('📭 Twilio not available — skipping SMS');
    return Promise.resolve();
  }

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