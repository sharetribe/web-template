const { getMethod } = require('../common/api');

export const fetchCurrencyExchangeRate = currency => {
  return getMethod('/api/exchange-rate', { currency });
};
