function calculateMaxFlatFee(price, providerFlatFee) {
  const { providerMinFlatFee = 0, providerFeePercentage = 0 } = providerFlatFee || {};

  const calculatedPercentage = Math.round(price * (providerFeePercentage / 100));
  return Math.max(providerMinFlatFee, calculatedPercentage);
}

export default calculateMaxFlatFee;
