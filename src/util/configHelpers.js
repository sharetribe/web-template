/////////////////////////////////////////////////////////////////////////////
// Helpers for reading marketplace configuration in the UI.                //
// These could be used to get derived states and deeply nested properties. //
// In addition, they provide a stable path for reading configuration.      //
/////////////////////////////////////////////////////////////////////////////

export const displayDescription = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.description !== false;
};

export const displayPrice = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.price !== false;
};

export const displayLocation = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.location !== false;
};

export const displayDeliveryPickup = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.pickup !== false;
};

export const displayDeliveryShipping = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.shipping !== false;
};

export const requireListingFiles = listingTypeConfig => {
  // Unlike other require helpers, this uses a === true check instead of !== false because files are
  // opt-in. An undefined value indicates that files are not required and in general, new configs for
  // established listing types are undefined by default
  return listingTypeConfig?.defaultListingFields?.files === true;
};

export const requireListingImage = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.images !== false;
};

/**
 * Returns the max number of listing images allowed for a listing type, or null if unlimited.
 * Hosted listing-types may include imageSettings:
 * - missing / { limitImages: false } => unlimited (null)
 * - { limitImages: true, maxImages: N } => N
 *
 * @param {Object} listingTypeConfig
 * @returns {number|null}
 */
export const getListingImageMaxCount = listingTypeConfig => {
  const imageSettings = listingTypeConfig?.imageSettings;
  if (!imageSettings || imageSettings.limitImages !== true) {
    return null;
  }
  const { maxImages } = imageSettings;
  const hasValidMax = typeof maxImages === 'number' && Number.isFinite(maxImages) && maxImages >= 1;
  if (hasValidMax) {
    return maxImages;
  }
  return null;
};

export const requirePayoutDetails = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.payoutDetails !== false;
};

export const isPriceVariationsEnabled = (publicData, listingTypeConfig) => {
  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  return publicData?.priceVariationsEnabled != null
    ? publicData?.priceVariationsEnabled
    : listingTypeConfig?.priceVariations?.enabled;
};

export const allowCustomerCounterOffer = listingTypeConfig => {
  return listingTypeConfig?.negotiationOptions?.customerCounterOffer === true;
};

export const allowProviderUpdateOffer = listingTypeConfig => {
  return listingTypeConfig?.negotiationOptions?.providerUpdateOffer === true;
};
