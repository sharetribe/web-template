////////////////////////////////////////////////////////////////////////////////
// Stripe config handler: built-in / env only (no hosted asset)               //
// Built-ins: defaultStripe.js (REACT_APP_STRIPE_PUBLISHABLE_KEY, countries…) //
////////////////////////////////////////////////////////////////////////////////

import { subUnitDivisors } from '../settingsCurrency';
import { configIssue, isPlainObject } from '../config.shared';

/**
 * Keep supportedCountries whose currency exists in settingsCurrency.subUnitDivisors.
 * Drops others with a warn (client cannot format / price those currencies).
 *
 * @param {Object} stripe built-in stripe defaults
 * @returns {{ value: Object, issues: Array }}
 */
export const filterSupportedCountriesByCurrency = stripe => {
  const issues = [];
  if (!isPlainObject(stripe)) {
    return { value: {}, issues };
  }

  const supportedCurrencies = Object.keys(subUnitDivisors);
  const supportedCountries = stripe.supportedCountries || [];
  const validSupportedCountries = supportedCountries.filter(country => {
    const currency = country?.currency;
    const isSupported = supportedCurrencies.includes(currency);

    if (!isSupported) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'STRIPE_UNSUPPORTED_COUNTRY_CURRENCY',
          message: `Stripe supported country "${country?.code ||
            '?'}" uses currency "${currency}", which is missing from settingsCurrency.subUnitDivisors. That country was dropped.`,
        })
      );
    }

    return isSupported;
  });

  return {
    value: { ...stripe, supportedCountries: validSupportedCountries },
    issues,
  };
};

/**
 * No hosted stripe asset — always {}.
 *
 * @returns {Object}
 */
const normalize = () => ({});

/**
 * Soft-filter built-in stripe countries against subUnitDivisors.
 *
 * @param {Object} _normalized
 * @param {Object} ctx
 * @returns {{ value: Object, issues: Array }}
 */
const validate = (_normalized, ctx) => filterSupportedCountriesByCurrency(ctx?.defaults?.stripe);

/**
 * @param {Object} validated filtered stripe from validate
 * @param {Object} defaults full defaultConfigs
 * @returns {Object}
 */
const resolve = (validated, defaults) =>
  isPlainObject(validated) && Object.keys(validated).length > 0
    ? validated
    : defaults?.stripe || {};

/**
 * Config handler for the `stripe` app-config key.
 *
 * - id: `stripe`
 * - assetKeys: `[]` — no Console asset; publishable key and countries come from defaultStripe.js
 */
export const stripeConfig = {
  id: 'stripe',
  assetKeys: [],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
