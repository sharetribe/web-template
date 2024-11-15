import get from 'lodash/get';

export const attachCategoryConfigToAppConfig = (appConfig, categoryConfig) => {
  return (appConfig.categoryCustomConfiguration = categoryConfig);
};

const getListingCategory = listing => {
  return get(listing, 'attributes.publicData.categoryLevel1', null);
};

const getProviderDefaultCommission = config => {
  return config.categoryCustomConfiguration.default.providerCommission;
};

const getCustomerDefaultCommission = config => {
  return config.categoryCustomConfiguration.default.customerCommission;
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
  return config.categoryCustomConfiguration.config[category]?.providerFlatFee ?? null;
};

export const retrieveCustomerCommission = (listing, config) => {
  const category = getListingCategory(listing);
  return {
    percentage:
      config.categoryCustomConfiguration.config[category]?.customerCommissionPercentage ??
      getCustomerDefaultCommission(config),
  };
};
