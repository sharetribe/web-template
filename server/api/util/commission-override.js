// Custom commission mapping by listing type
//Customer commission is set to be 0% and the provider commission are given values
const listingTypeCommissionMap = {
  'in-person': { provider: 5, customer: 0 },
  'in-person-school': { provider: 0, customer: 0 },
  'full_course': { provider: 8, customer: 0 },
  'aircraft-rental': { provider: 8, customer: 0 },
  'instruction_and_consultation': { provider: 10, customer: 0 },
  'Full-Course-Live-Online': { provider: 10, customer: 0 },
};

const extractOverridingProviderCommissionPercent = (authorJoinedListing, globalProviderCommission) => {
  const listingAttributes = authorJoinedListing.data.data?.attributes;
  const listingPublicData = listingAttributes?.publicData;

  console.log("Listing Attributes:", listingAttributes);
  console.log("Listing PublicData:", listingPublicData);
  console.log("Listing Type (publicData.listingType):", listingType);

  // Check for custom commission based on listingType
  const customCommission = listingTypeCommissionMap[listingType];
  if (customCommission?.provider != null) {
    console.log(`Custom provider commission for listing type "${listingType}": ${customCommission.provider}%`);
    return { percentage: customCommission.provider };
  }

  // Check for user override from metadata
  let overrideProviderCommissionPercent =
    Array.isArray(authorJoinedListing.data.included) && authorJoinedListing.data.included[0]?.attributes?.profile?.metadata?.provider_commission_percentage != null
      ? authorJoinedListing.data.included[0].attributes.profile.metadata.provider_commission_percentage
      : null;
  console.log("Listing data is: ", authorJoinedListing.data.included);

  const overrideValueIsANumber = typeof overrideProviderCommissionPercent === 'number';

  if (typeof overrideProviderCommissionPercent === "object" &&
    overrideProviderCommissionPercent !== null &&
    Object.keys(overrideProviderCommissionPercent).length === 0) {
    overrideProviderCommissionPercent = null;
  }

  if (overrideProviderCommissionPercent && !overrideValueIsANumber) {
    console.warn(`provider_commission_percentage value was falsely passed as a ${typeof overrideProviderCommissionPercent}. Reverting to global value of ${globalProviderCommission?.percentage ?? 0}`);
  }

  return (overrideProviderCommissionPercent != null && overrideValueIsANumber)
    ? { percentage: overrideProviderCommissionPercent }
    : globalProviderCommission;
};

const extractOverridingCustomerCommissionPercent = (currentUserData, globalCustomerCommission, listingType) => {
  let overrideCustomerCommissionPercent = null;

  if (currentUserData === "Unauthenticated") {
    console.log("Checking customer commission in anonymous user session");
  } else {
    console.log("Checking customer commission in user session");
    overrideCustomerCommissionPercent = currentUserData.data.data?.attributes?.profile?.metadata?.customer_commission_percentage ?? null;
  }

  // Check for custom commission based on listingType
  const customCommission = listingTypeCommissionMap[listingType];
  if (customCommission?.customer != null) {
    console.log(`Custom customer commission for listing type "${listingType}": ${customCommission.customer}%`);
    return { percentage: customCommission.customer };
  }

  const overrideValueIsANumber = typeof overrideCustomerCommissionPercent === 'number';

  if (typeof overrideCustomerCommissionPercent === "object" &&
    overrideCustomerCommissionPercent !== null &&
    Object.keys(overrideCustomerCommissionPercent).length === 0) {
    overrideCustomerCommissionPercent = null;
  }

  if (overrideCustomerCommissionPercent && !overrideValueIsANumber) {
    console.warn(`customer_commission_percentage value was falsely passed as a ${typeof overrideCustomerCommissionPercent}. Reverting to global value of ${globalCustomerCommission?.percentage ?? 0}`);
  }

  return (overrideCustomerCommissionPercent != null && overrideValueIsANumber)
    ? { percentage: overrideCustomerCommissionPercent }
    : globalCustomerCommission;
};

module.exports = {
  extractOverridingProviderCommissionPercent,
  extractOverridingCustomerCommissionPercent
};
