const express = require('express');
const handleSellPurchaseWebhook = require('./sell-purchase');
const bodyParser = require('body-parser');

const router = express.Router();

router.use(bodyParser.raw({type: 'application/json'}));

router.post('/sell-purchase', handleSellPurchaseWebhook);

module.exports = router;
