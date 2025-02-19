const { STRIPE_WEBHOOK_SECRET } = require('../configs');
const stripeInstance = require('stripe')(STRIPE_WEBHOOK_SECRET);

module.exports = {
  stripeInstance,
};
