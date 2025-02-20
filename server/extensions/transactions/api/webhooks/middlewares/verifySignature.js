const { stripeInstance } = require('../../../mod/stripe/instance');

const verifySignature = secret => async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = await stripeInstance.webhooks.constructEventAsync(req.rawBody, sig, secret);

    if (event) {
      req.event = event;
      return next();
    } else {
      res.status(401).send('Unauthorized');
    }
  } catch (error) {
    console.error('verify-signature-error', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

module.exports = verifySignature;
