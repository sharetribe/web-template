const CATEGORY_ID_LOCATION = 'location';
const CATEGORY_ID_MACHINE = 'machine';
const CATEGORY_ID_LOCATION_MACHINE = 'location-machine';
const CATEGORY_ID_ATM_LOCATION = 'atm-location';
const CATEGORY_ID_PARTS = 'parts';
const CATEGORY_ID_SERVICES = 'services';
const CATEGORY_ID_LOCATION_FIND = 'location-find';
const CATEGORY_ID_LOCATION_BID = 'location-bid';

/**
 * @param {number} minimumPrice must have subunit numbers included
 * @param {number} providerFlatFee must have subunit numbers included
 * @param {number} providerCommissionPercentage must be a number between 0 and 100
 * @param {number} customerCommissionPercentage must be a number between 0 and 100
 **/
const categoriesExtraConfig = {
  [CATEGORY_ID_LOCATION]: {
    minimumPrice: 20000,
    providerMinFlatFee: 10000,
    providerFeePercentage: 20,
    providerCommissionPercentage: 3,
    customerCommissionPercentage: 0,
  },
  [CATEGORY_ID_LOCATION_FIND]: {
    minimumPrice: 20000,
    providerMinFlatFee: 10000,
    providerFeePercentage: 20,
    providerCommissionPercentage: 3,
    customerCommissionPercentage: 0,
  },
  [CATEGORY_ID_LOCATION_BID]: {
    minimumPrice: 30000,
    providerMinFlatFee: 20000,
    providerFeePercentage: 20,
    providerCommissionPercentage: 3,
    customerCommissionPercentage: 0,
  },
};

module.exports = {
  categoriesExtraConfig,
};
