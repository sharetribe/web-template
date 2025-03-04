const express = require('express');
const router = express.Router();
const sellPurchaseRouter = require('./sell-purchase');
const webhookRouter = require('./webhooks');

router.use('/sell-purchase', sellPurchaseRouter);
router.use('/webhook', webhookRouter)

module.exports = router;
