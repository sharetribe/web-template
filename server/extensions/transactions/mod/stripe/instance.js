const { STRIPE_WEBHOOK_SECRET } = require('../../common/configs/stripe');

const stripeInstance = require('stripe')(STRIPE_WEBHOOK_SECRET);

module.exports = {
  stripeInstance,
};
