const get = require('lodash/get');

const { categoriesExtraConfig } = require('../category-custom-config/config');
const { getExchangeRate } = require('../common/caching');

const { DEFAULT_CURRENCY } = require('../common/config/constants/currency.constants');
const { getListingPrice } = require('../../api-util/lineItemHelpers');
const { calculateFlatFee } = require('../category-custom-config/helpers/calculate');

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
  const categoryConfig = categoriesExtraConfig[category];

  if (!categoryConfig) {
    return null;
  }

  const { providerMinFlatFee, providerFeePercentage } = categoryConfig;
  return { providerMinFlatFee, providerFeePercentage };
};

const getListingCurrency = listing => {
  return get(listing, 'attributes.publicData.listingCurrency', DEFAULT_CURRENCY);
};

/**
 * Get commissions percentage and calculated flat fee
 * Flat fee is not converted to order data yet
 */
const retrieveCommissionAndFlatFee = async (listing, commissionAsset) => {
  const {
    providerCommission: defaultProviderCommission,
    customerCommission: defaultCustomerCommission,
  } = commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

  const { overrideProviderCommission, overrideCustomerCommission } = retrieveCommission(listing);

  const flatFeeConfig = retrieveProviderFlatFeeRawValue(listing);
  const listingCurrency = getListingCurrency(listing);

  const exchangeRate = await getExchangeRate();
  // Listing price will be exchanged base on currency rate
  const listingPrice = await getListingPrice(listing, DEFAULT_CURRENCY, exchangeRate);
  // flatFee will be exchanged base on currency rate to default currency
  const flatFee = await calculateFlatFee({
    flatFeeConfig,
    listingPrice,
    listingCurrency,
    exchangeRate,
  });

  return {
    providerCommission: {
      percentage: overrideProviderCommission.percentage || defaultProviderCommission.percentage,
    },
    customerCommission: {
      percentage: overrideCustomerCommission.percentage || defaultCustomerCommission.percentage,
    },
    providerFlatFee: flatFee,
  };
};

const hasFlatFee = flatFee => {
  return flatFee !== null && typeof flatFee === 'number' && flatFee > 0;
};

module.exports = {
  retrieveProviderFlatFeeRawValue,
  retrieveCommissionAndFlatFee,
  hasFlatFee,
};
