const { getMethod } = require('../common/api');

export const fetchCurrencyExchangeRate = () => {
  return getMethod('/api/exchange-rate');
};
