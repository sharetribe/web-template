// Netherlands used to require a sole proprietorship for individuals.
// This code pattern is reflecting that requirement.
// According to Stripe: "Starting May 14, 2026, connected accounts representing individuals or
// unincorporated entities that don’t have access to a Stripe-hosted Dashboard are no longer
// required to provide a KvK number.
// Connected accounts representing individuals or unincorporated entities that have access to
// the full Stripe Dashboard or the Express Dashboard must still provide a KvK number."
// https://docs.stripe.com/connect/upcoming-requirements-updates?program=eu-2025#netherlands-business-registration-requirements
// Note: this code pattern can still be used by changing the set of countries to `new Set(['NL']);`
// However, since Template works with custom Connect accounts, hiding Stripe dashboard,
// the sole proprietorship requirement is not needed.
const countriesRequiringSoleProprietorshipForIndividuals = new Set([]);

/**
 * Whether Connect onboarding for an individual in this country must use a company account with
 * sole proprietorship structure (Stripe compliance; currently applies to NL).
 *
 * @param {string} country - ISO 3166-1 alpha-2 country code
 * @returns {boolean}
 */
const requiresSoleProprietorshipAccount = country =>
  countriesRequiringSoleProprietorshipForIndividuals.has(country);

/**
 * Builds `business_type` and optional `company.structure` for Stripe account creation or token
 * flows when the seller's country and account type trigger sole-proprietorship rules.
 *
 * @param {Object} params
 * @param {string} params.country - ISO 3166-1 alpha-2 country code
 * @param {string} params.accountType - Stripe business type, e.g. `individual` or `company`
 * @returns {Object} Either `{ business_type: 'company', company: { structure: 'sole_proprietorship' } }`
 *   for individuals in restricted countries, or `{ business_type: accountType }` otherwise
 */
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

/**
 * Normalizes Stripe account data for display: company accounts with sole proprietorship structure
 * are shown as `individual` to match how the seller signed up.
 *
 * @param {Object} [stripeAccountData] - Account object with optional `business_type` and `company.structure`
 * @returns {string|undefined} Display type (`individual` for mapped sole props, otherwise `business_type`, or
 *   `undefined` when missing)
 */
export const getDisplayAccountType = stripeAccountData => {
  const businessType = stripeAccountData?.business_type;
  const companyStructure = stripeAccountData?.company?.structure;

  return businessType === 'company' && companyStructure === 'sole_proprietorship'
    ? 'individual'
    : businessType;
};
