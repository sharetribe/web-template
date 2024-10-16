const NodeCache = require('node-cache');
const axios = require('axios');
const { DEFAULT_CURRENCY } = require('./config/constants/currency.constants');

const FRANKFURTER_API_URL = 'https://api.frankfurter.app';
const CACHE_TIME = 86400;

const currencyRateCache = new NodeCache({
  stdTTL: CACHE_TIME,
});

const fetchExchangeRate = async () => {
  try {
    const response = await axios.get(`${FRANKFURTER_API_URL}/latest?base=${DEFAULT_CURRENCY}`);
    const exchangeRate = response.data.rates;

    currencyRateCache.set('exchangeRate', exchangeRate);
    return exchangeRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error('Failed to fetch exchange rate');
  }
};

const getExchangeRate = async () => {
  const cachedRate = currencyRateCache.get('exchangeRate');

  if (cachedRate) {
    return cachedRate;
  } else {
    return await fetchExchangeRate();
  }
};

module.exports = {
  getExchangeRate,
};
