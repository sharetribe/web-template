const get = require('lodash/get');

const { categoriesExtraConfig } = require('../category-custom-config/config');
const { getExchangeRate } = require('../common/caching');

const { DEFAULT_CURRENCY } = require('../common/config/constants/currency.constants');

const getListingCategory = listing => {
  return get(listing, 'attributes.publicData.categoryLevel1', null);
};

const ensurePositivePercentage = percentage =>
  typeof percentage === 'number' && percentage >= 0 ? percentage : null;

const retrieveCommission = listing => {
  const category = getListingCategory(listing);
  if (!category)
    return {
      overrideProviderCommission: {
        percentage: null,
      },
      overrideCustomerCommission: {
        percentage: null,
      },
    };

  const pCommission = ensurePositivePercentage(
    categoriesExtraConfig[category]?.providerCommissionPercentage
  );
  const cCommission = ensurePositivePercentage(
    categoriesExtraConfig[category]?.customerCommissionPercentage
  );
  return {
    overrideProviderCommission: {
      percentage: pCommission,
    },
    overrideCustomerCommission: {
      percentage: cCommission,
    },
  };
};

const retrieveProviderFlatFeeRawValue = listing => {
  const category = getListingCategory(listing);
  return categoriesExtraConfig[category]?.providerFlatFee ?? null;
};

const getListingCurrency = listing => {
  return get(listing, 'attributes.publicData.listingCurrency', DEFAULT_CURRENCY);
};

const calculateFlatFeeInCurrency = async (listing, currency) => {
  const exchangeRate = await getExchangeRate();
  const flatFee = retrieveProviderFlatFeeRawValue(listing);
  const currencyExchangeRate = exchangeRate[currency] ?? 1;
  const dailyExchangeRate = 1 / currencyExchangeRate;

  const flatFeeInExchangeCurrency = Math.round(flatFee * dailyExchangeRate);
  return flatFeeInExchangeCurrency;
};

const retrieveCommissionAndFlatFee = async (listing, commissionAsset) => {
  const {
    providerCommission: defaultProviderCommission,
    customerCommission: defaultCustomerCommission,
  } = commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

  const { overrideProviderCommission, overrideCustomerCommission } = retrieveCommission(listing);

  const providerFlatFee = retrieveProviderFlatFeeRawValue(listing);
  const listingCurrency = getListingCurrency(listing);

  if (listingCurrency !== DEFAULT_CURRENCY) {
    const convertedFlatFee = await calculateFlatFeeInCurrency(listing, listingCurrency);
    return {
      providerCommission: {
        percentage: overrideProviderCommission.percentage || defaultProviderCommission.percentage,
      },
      customerCommission: {
        percentage: overrideCustomerCommission.percentage || defaultCustomerCommission.percentage,
      },
      providerFlatFee: convertedFlatFee,
    };
  }

  return {
    providerCommission: {
      percentage: overrideProviderCommission.percentage || defaultProviderCommission.percentage,
    },
    customerCommission: {
      percentage: overrideCustomerCommission.percentage || defaultCustomerCommission.percentage,
    },
    providerFlatFee,
  };
};

const hasFlatFee = flatFee => {
  return flatFee !== null && flatFee > 0 && typeof flatFee === 'number';
};

module.exports = {
  retrieveProviderFlatFeeRawValue,
  retrieveCommissionAndFlatFee,
  hasFlatFee,
  calculateFlatFeeInCurrency,
};
