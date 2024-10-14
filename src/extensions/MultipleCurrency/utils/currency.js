import { DEFAULT_CURRENCY } from '../../common/config/constants/currency.constants';
import { types as sdkTypes } from '../../../util/sdkLoader';

const { Money } = sdkTypes;

export const convertToDefaultCurrency = (price, exchangeRate) => {
  const { amount, currency } = price;
  const dailyExchangeRate = exchangeRate?.[currency];

  if (!dailyExchangeRate) {
    throw Error(`${currency} exchange rate not supported`);
  }

  const defaultCurrencyAmount = parseInt(amount / dailyExchangeRate);
  return new Money(defaultCurrencyAmount, DEFAULT_CURRENCY);
};

const convertListingPriceByCurrency = (price, currency, exchangeRate) => {
  const { amount } = price;
  const dailyExchangeRate = exchangeRate?.[currency];

  if (!dailyExchangeRate) {
    throw Error(`${currency} exchange rate not supported`);
  }

  const convertedAmount = parseInt(amount * dailyExchangeRate);
  return new Money(convertedAmount, currency);
};

const getListingPrice = (listing, currency, exchangeRate) => {
  const { price, publicData } = listing?.attributes || {};
  const { exchangePrice } = publicData || {};

  if (exchangePrice && exchangePrice[currency]) {
    const { amount, currency: exChangeCurrency } = exchangePrice[currency];
    return new Money(amount, exChangeCurrency);
  }

  return convertListingPriceByCurrency(price, currency, exchangeRate);
};

export const convertListingPrices = (listings, state) => {
  const { uiCurrency } = state.ui;
  const { exchangeRate } = state.ExchangeRate;

  if (uiCurrency === DEFAULT_CURRENCY) {
    return listings;
  }

  return listings.map(listing => {
    return {
      ...listing,
      attributes: {
        ...listing.attributes,
        price: getListingPrice(listing, uiCurrency, exchangeRate),
      },
    };
  });
};
