const { categoriesExtraConfig } = require('../config');

exports.validateMinFlatFee = () => {
  return Object.values(categoriesExtraConfig).reduce((acc, value) => {
    const {
      minimumPrice,
      providerMinFlatFee,
      providerCommissionPercentage,
      providerFeePercentage,
    } = value;
    const minimumCommission = Math.round(minimumPrice * (providerCommissionPercentage / 100));

    if (minimumPrice - providerMinFlatFee - minimumCommission <= 0) {
      return false;
    }

    if (providerFeePercentage + minimumCommission >= 100) {
      return false;
    }

    return acc;
  }, true);
};
