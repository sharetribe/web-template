import { DEFAULT_CURRENCY } from '../../common/config/constants/currency.constants';
import { types as sdkTypes } from '../../../util/sdkLoader';

const { Money } = sdkTypes;

export const convertToDefaultCurrency = (price, exchangeRate) => {
  const { amount, currency } = price;
  const dailyExchangeRate = exchangeRate?.[currency];

  if (!dailyExchangeRate) {
    throw Error(`${currency} exchange rate not supported`);
  }

  const defaultCurrencyAmount = Math.round(amount / dailyExchangeRate);
  return new Money(defaultCurrencyAmount, DEFAULT_CURRENCY);
};

export const convertPriceByCurrency = (price, currency, exchangeRate) => {
  const { amount } = price;
  const dailyExchangeRate = exchangeRate?.[currency];

  if (!dailyExchangeRate) {
    return;
  }

  const convertedAmount = Math.round(amount * dailyExchangeRate);
  return new Money(convertedAmount, currency);
};

const exchangeRateBetweenCurrencies = (currency, exChangeCurrency, exchangeRate) => {
  if (currency === DEFAULT_CURRENCY) {
    return 1 / exchangeRate[exChangeCurrency];
  }
  return exchangeRate[currency];
};

const getListingPrice = (listing, currency, exchangeRate) => {
  const { price, publicData } = listing?.attributes || {};
  const { exchangePrice = {}, listingCurrency = DEFAULT_CURRENCY } = publicData || {};

  if (!exchangeRate || !exchangeRate[currency]) {
    return price;
  }

  if (currency === listingCurrency) {
    if (currency === DEFAULT_CURRENCY) {
      return price;
    }
    return exchangePrice[currency] ? new Money(exchangePrice[currency].amount, currency) : price;
  }

  const dailyExchangeRate = exchangeRateBetweenCurrencies(currency, listingCurrency, exchangeRate);
  const priceAmount =
    currency === DEFAULT_CURRENCY ? exchangePrice[currency]?.amount || 0 : price.amount;

  return new Money(priceAmount * dailyExchangeRate, currency);
};

export const convertListingPrices = (listings, uiCurrency, exchangeRate) => {
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
