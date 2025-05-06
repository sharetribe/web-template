const { categoriesExtraConfig } = require('../config');

exports.getValidConfigs = () => {
  return Object.entries(categoriesExtraConfig).reduce((acc, [key, value]) => {
    const {
      minimumPrice: rawMinimumPrice,
      providerMinFlatFee: rawProviderMinFlatFee,
      providerCommissionPercentage,
      providerFeePercentage,
    } = value;

    // Handle subunit rounding
    const minimumPrice = rawMinimumPrice.toFixed(0);
    const providerMinFlatFee = rawProviderMinFlatFee.toFixed(0);

    const minimumCommission = Math.round(minimumPrice * (providerCommissionPercentage / 100));

    if (
      (minimumPrice - providerMinFlatFee - minimumCommission > 0) &
        (providerFeePercentage + providerCommissionPercentage < 100) &&
      Object.values(value).every(val => val >= 0)
    ) {
      acc[key] = value;
    }

    return acc;
  }, {});
};
