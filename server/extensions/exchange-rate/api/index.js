const express = require('express');
const { getExchangeRate } = require('../caching');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log('it gets here');
    const exchangeRate = await getExchangeRate();
    res.status(200).send(exchangeRate);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
