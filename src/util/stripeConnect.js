const countriesRequiringSoleProprietorshipForIndividuals = new Set([
  'AT',
  'BE',
  'BG',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GB',
  'GI',
  'GR',
  'HR',
  'HU',
  'IE',
  'IS',
  'IT',
  'LI',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
]);

export const requiresSoleProprietorshipAccount = country =>
  countriesRequiringSoleProprietorshipForIndividuals.has(country);

export const getStripeAccountTokenInfo = ({ country, accountType }) => {
  const isIndividualInRestrictedCountry =
    accountType === 'individual' && requiresSoleProprietorshipAccount(country);

  return isIndividualInRestrictedCountry
    ? {
        business_type: 'company',
        company: {
          structure: 'sole_proprietorship',
        },
      }
    : {
        business_type: accountType,
      };
};

export const getDisplayAccountType = stripeAccountData => {
  const businessType = stripeAccountData?.business_type;
  const companyStructure = stripeAccountData?.company?.structure;

  return businessType === 'company' && companyStructure === 'sole_proprietorship'
    ? 'individual'
    : businessType;
};
