const { isLiveMode } = require('../../../configs');
const handleExpireIntent = require('./expire');

const handleWebhook = async (req, res) => {
  const event = req.event;

  try {
    if (event.livemode !== isLiveMode) {
      // Skip if not matching mode
      return res.json({ received: true });
    }

    // Handle the event
    switch (event.type) {
      case 'charge.expired':
      //TODO: Remove testing case below
      case 'charge.failed':
      case 'payment_intent.canceled':
        const chargeObject = event.data.object;

        await handleExpireIntent(chargeObject);
        break;

      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = handleWebhook;
