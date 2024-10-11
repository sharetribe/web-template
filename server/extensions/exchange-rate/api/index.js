const express = require('express');
const { getExchangeRate } = require('../caching');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const exchangeRate = await getExchangeRate();

    res.status(200).json(exchangeRate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
