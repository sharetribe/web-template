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

const getListingPrice = (listing, currency, exchangeRate) => {
  const { price, publicData } = listing?.attributes || {};
  const { exchangePrice } = publicData || {};

  if (exchangePrice && exchangePrice[currency]) {
    const { amount, currency: exChangeCurrency } = exchangePrice[currency];
    return new Money(amount, exChangeCurrency);
  }
  const convertedPrice = convertPriceByCurrency(price, currency, exchangeRate);
  return convertedPrice || price;
};

export const convertListingPrices = (listings, uiCurrency, exchangeRate) => {
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

export const convertProductLineItems = (lineItems, uiCurrency, exchangePrice) => {
  if (!lineItems || uiCurrency === DEFAULT_CURRENCY) {
    return lineItems;
  }

  return lineItems.map(lineItem => {
    const { unitPrice, lineTotal } = lineItem;
    return {
      ...lineItem,
      unitPrice: convertPriceByCurrency(unitPrice, uiCurrency, exchangePrice),
      lineTotal: convertPriceByCurrency(lineTotal, uiCurrency, exchangePrice),
    };
  });
};
