const { STRIPE_WEBHOOK_ENDPOINT_SECRET, isLiveMode } = require('../../../configs');
const { stripeInstance } = require('../../../utils/getStripeInstance');
const handleExpireIntent = require('./handleExpireIntent');

const endpointSecret = STRIPE_WEBHOOK_ENDPOINT_SECRET;

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // Ensure request is from Stripe
  try {
    const event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.livemode !== isLiveMode) {
      // Skip if not matching mode
      return res.json({ received: true });
    }

    // Handle the event
    switch (event.type) {
      case 'charge.expired':
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
