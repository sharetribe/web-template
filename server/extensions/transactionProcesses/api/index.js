const express = require('express');
const router = express.Router();
const sellPurchaseRouter = require('./sellPurchase');

router.use('/sellPurchase', sellPurchaseRouter);

module.exports = router;
