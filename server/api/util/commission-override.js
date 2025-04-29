const extractOverridingProviderCommissionPercent = (authorJoinedListing, globalProviderCommission) => {
  
  const listingAttributes = authorJoinedListing.data.data?.attributes;
  const listingPublicData = listingAttributes?.publicData;

  console.log("Listing Attributes:", listingAttributes);
  console.log("Listing PublicData:", listingPublicData);
  console.log("Listing Type (publicData.listingType):", listingPublicData?.listingType);
  
  let overrideProviderCommissionPercent =
    Array.isArray(authorJoinedListing.data.included) && authorJoinedListing.data.included[0]?.attributes?.profile?.metadata?.provider_commission_percentage != null
      ? authorJoinedListing.data.included[0].attributes.profile.metadata.provider_commission_percentage
      : null;

  const overrideValueIsANumber = typeof overrideProviderCommissionPercent === 'number';

  // account for possibility of empty object on nullity chain
  if(typeof overrideProviderCommissionPercent === "object" &&
    overrideProviderCommissionPercent !== null &&
    Object.keys(overrideProviderCommissionPercent).length === 0) {
    overrideProviderCommissionPercent = null;
  }

  if (overrideProviderCommissionPercent && !overrideValueIsANumber) {
    console.warn(`provider_commission_percentage value was falsely passed as a ${typeof overrideProviderCommissionPercent}. Reverting to global value of ${globalProviderCommission?.percentage ?? 0}`);
  }

  return (overrideProviderCommissionPercent != null && overrideValueIsANumber) ? { percentage: overrideProviderCommissionPercent } : globalProviderCommission;
};

const extractOverridingCustomerCommissionPercent = (currentUserData, globalCustomerCommission) => {

  let overrideCustomerCommissionPercent = null;

  if(currentUserData === "Unauthenticated") {
    console.log("Checking customer commission in anonymous user session");
  } else {
    console.log("Checking customer commission in user session");
    overrideCustomerCommissionPercent = currentUserData.data.data?.attributes?.profile?.metadata?.customer_commission_percentage ?? null;
  }

  const overrideValueIsANumber = typeof overrideCustomerCommissionPercent === 'number';

  // account for possibility of empty object on nullity chain
  if(typeof overrideCustomerCommissionPercent === "object" &&
    overrideCustomerCommissionPercent !== null &&
    Object.keys(overrideCustomerCommissionPercent).length === 0) {
    overrideCustomerCommissionPercent = null;
  }

  if (overrideCustomerCommissionPercent && !overrideValueIsANumber) {
    console.warn(`customer_commission_percentage value was falsely passed as a ${typeof overrideCustomerCommissionPercent}. Reverting to global value of ${globalCustomerCommission?.percentage ?? 0}`);
  }

  return (overrideCustomerCommissionPercent != null && overrideValueIsANumber) ? { percentage: overrideCustomerCommissionPercent } : globalCustomerCommission;
};

module.exports = {
  extractOverridingProviderCommissionPercent,
  extractOverridingCustomerCommissionPercent
}
