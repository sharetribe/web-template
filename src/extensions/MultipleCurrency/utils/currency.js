import { DEFAULT_CURRENCY } from '../../common/config/constants/currency.constants';
import { types as sdkTypes } from '../../../util/sdkLoader';

const { Money } = sdkTypes;

export const convertToDefaultCurrency = (price, exchangeRates) => {
  const { amount, currency } = price;
  const exchangeRate = exchangeRates[currency];

  if (!exchangeRate) {
    throw Error(`${currency} exchange rate not supported`);
  }
  console.log('debug', amount);
  const defaultCurrencyAmount = parseInt(amount / exchangeRate);
  return new Money(defaultCurrencyAmount, DEFAULT_CURRENCY);
};
