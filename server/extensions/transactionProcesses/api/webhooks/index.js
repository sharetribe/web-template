const express = require('express');
const handleSellPurchaseWebhook = require('./sellPurchase');
const bodyParser = require('body-parser');

const router = express.Router();

router.use(bodyParser.raw({type: 'application/json'}));

router.post('/sellPurchase', handleSellPurchaseWebhook);

module.exports = router;
