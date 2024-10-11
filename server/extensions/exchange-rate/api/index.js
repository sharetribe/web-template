const express = require('express');
const { getExchangeRate } = require('../caching');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { currency } = req.query;
    const exchangeRate = await getExchangeRate(currency);

    res.status(200).json(exchangeRate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
