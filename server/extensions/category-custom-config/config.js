const CATEGORY_ID_LOCATION = 'location';
const CATEGORY_ID_MACHINE = 'machine';
const CATEGORY_ID_LOCATION_MACHINE = 'location-machine';
const CATEGORY_ID_ATM_LOCATION = 'atm-location';
const CATEGORY_ID_PARTS = 'parts';
const CATEGORY_ID_SERVICES = 'services';

/**
 * @param {number} minimumPrice must have subunit numbers included
 * @param {number} providerFlatFee must have subunit numbers included
 * @param {number} providerCommissionPercentage must be a number between 0 and 100
 * @param {number} customerCommissionPercentage must be a number between 0 and 100
 **/
const categoriesExtraConfig = {
  [CATEGORY_ID_LOCATION]: {
    minimumPrice: 10000,
    providerFlatFee: 1000,
    providerCommissionPercentage: 10,
    customerCommissionPercentage: 0,
  },
  [CATEGORY_ID_MACHINE]: {
    minimumPrice: 10000,
    providerFlatFee: 1500,
    providerCommissionPercentage: 10,
    customerCommissionPercentage: 5,
  },
  [CATEGORY_ID_LOCATION_MACHINE]: {
    minimumPrice: 10000,
    providerFlatFee: 1000,
    providerCommissionPercentage: 10,
    customerCommissionPercentage: 0,
  },
  [CATEGORY_ID_ATM_LOCATION]: {
    minimumPrice: 10000,
    providerFlatFee: 1000,
    providerCommissionPercentage: 10,
    customerCommissionPercentage: 0,
  },
  [CATEGORY_ID_PARTS]: {
    minimumPrice: 10000,
    providerFlatFee: 1000,
    providerCommissionPercentage: 10,
    customerCommissionPercentage: 0,
  },
  [CATEGORY_ID_SERVICES]: {
    minimumPrice: 10000,
    providerFlatFee: 1000,
    providerCommissionPercentage: 10,
    customerCommissionPercentage: 0,
  },
};

module.exports = {
  categoriesExtraConfig,
};
