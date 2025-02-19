const express = require('express');
const bodyParser = require('body-parser');

const { handleStripeWebhook } = require('./utils/config');
const handleSellPurchaseWebhook = require('./sell-purchase');
const {
  STRIPE_WEBHOOK_CHARGE_EXPIRED_ENDPOINT_SECRET: chargeExpiredSecret,
} = require('../../common/configs/stripe');
const verifySignature = require('./middlewares/verifySignature');

const router = express.Router();

router.use(
  bodyParser.json({
    verify: handleStripeWebhook,
  })
);

router.post('/sell-purchase', verifySignature(chargeExpiredSecret), handleSellPurchaseWebhook);

module.exports = router;
