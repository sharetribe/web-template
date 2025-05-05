import get from 'lodash/get';
import { LISTING_TYPE_CATEGORIES } from './constants';

export const attachCategoryConfigToAppConfig = (appConfig, categoryConfig) => {
  return (appConfig.categoryCustomConfiguration = categoryConfig);
};

const getListingCategory = listing => {
  return get(listing, 'attributes.publicData.categoryLevel1', null);
};

const getProviderDefaultCommission = config => {
  return config.categoryCustomConfiguration.default.providerCommission || {};
};

const getCustomerDefaultCommission = config => {
  return config.categoryCustomConfiguration.default.customerCommission || {};
};

export const retrieveListingMinimumPrice = (listing, config) => {
  const category = getListingCategory(listing);
  return config.categoryCustomConfiguration.config[category]?.minimumPrice ?? null;
};

export const retrieveProviderCommission = (listing, config) => {
  const category = getListingCategory(listing);
  return {
    percentage:
      config.categoryCustomConfiguration.config[category]?.providerCommissionPercentage ??
      getProviderDefaultCommission(config).percentage,
  };
};

export const retrieveProviderFlatFee = (listing, config) => {
  const category = getListingCategory(listing);
  const currentCategoryConfig = config.categoryCustomConfiguration.config[category];

  if (!currentCategoryConfig) {
    return null;
  }

  const { providerMinFlatFee = 0, providerFeePercentage = 0 } = currentCategoryConfig;
  return {
    providerMinFlatFee,
    providerFeePercentage,
  };
};

export const retrieveCustomerCommission = (listing, config) => {
  const category = getListingCategory(listing);
  return {
    percentage:
      config.categoryCustomConfiguration.config[category]?.customerCommissionPercentage ??
      getCustomerDefaultCommission(config),
  };
};

export const getSelectableCategoriesFromProductType = (
  selectedListingType,
  allSelectableCategories = []
) => {
  const listingType = LISTING_TYPE_CATEGORIES[selectedListingType];
  if (!listingType) {
    return allSelectableCategories;
  }
  const { categories } = listingType;
  return allSelectableCategories.filter(({ id }) => categories.includes(id));
};
