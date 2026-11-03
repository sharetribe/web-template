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
 * Nothing hosted to soft-check. Built-in filtering happens in resolve.
 *
 * @returns {{ value: Object, issues: Array }}
 */
const validate = () => ({ value: {}, issues: [] });

/**
 * Build `config.stripe` from built-in defaults: filter supportedCountries against
 * subUnitDivisors. Pushes warns onto `ctx.issues` when present.
 *
 * @param {Object} _validated unused (no hosted stripe slice)
 * @param {Object} defaults full defaultConfigs (uses `defaults.stripe`)
 * @param {Object} ctx builder context (optional `issues`)
 * @returns {Object} app-config stripe object
 */
const resolve = (_validated, defaults, ctx = {}) => {
  const { value, issues } = filterSupportedCountriesByCurrency(defaults?.stripe);
  if (Array.isArray(ctx.issues)) {
    ctx.issues.push(...issues);
  }
  return value;
};

/**
 * Config handler for the `stripe` app-config key.
 *
 * - id: `stripe`
 * - assetKeys: `[]` — no Console asset; publishable key and countries come from defaultStripe.js
 * - Pipeline: normalize → validate (noop) → resolve (filter defaults)
 */
export const stripeConfig = {
  id: 'stripe',
  assetKeys: [],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
