const express = require('express');
const router = express.Router();
const sellPurchaseRouter = require('./sellPurchase');
const webhookRouter = require('./webhooks');

router.use('/sellPurchase', sellPurchaseRouter);
router.use('/webhook', webhookRouter)

module.exports = router;
