////////////////////////////////////////////////////////////////////////////////
// Localization config handler: hosted configs + built-in defaults            //
// Hosted asset path: /general/localization.json                              //
// Top-level `currency` is elevated in mergeConfig via getMarketplaceCurrency //
////////////////////////////////////////////////////////////////////////////////

import { subUnitDivisors } from '../settingsCurrency';
import { configIssue, isPlainObject } from '../config.shared';

const supportedCurrencies = Object.keys(subUnitDivisors);

const FIRST_DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7];

/**
 * Picks the marketplace currency for top-level `config.currency`.
 * Uses the currency from localization when it is set, and falls back to the
 * built-in default from configDefault.js. Returns null if the chosen code is
 * not listed in subUnitDivisors.
 *
 * @param {Object} [localization] resolved `config.localization`
 * @param {string} defaultCurrency built-in top-level currency (e.g. 'USD')
 * @returns {string|null}
 */
export const getMarketplaceCurrency = (localization, defaultCurrency) => {
  const currency = localization?.currency || defaultCurrency;
  return supportedCurrencies.includes(currency) ? currency : null;
};

/**
 * Merge hosted localization with built-in defaults (locale + firstDayOfWeek).
 * Currency is included when validated so mergeConfig can elevate it.
 *
 * @param {Object} hostedLocalization normalized hosted slice
 * @param {Object} defaultLocalization built-ins from defaultLocalization.js
 * @param {string} [defaultCurrency] top-level defaultConfigs.currency
 * @returns {Object} { locale, firstDayOfWeek, currency? }
 */
export const mergeLocalizationConfig = (
  hostedLocalization,
  defaultLocalization = {},
  defaultCurrency
) => {
  const locale = hostedLocalization?.locale || defaultLocalization.locale || 'en';
  // Days are numbered 1 (Monday) … 7 (Sunday). Moment might use 0–6.
  const firstDay = hostedLocalization?.firstDayOfWeek ?? defaultLocalization.firstDayOfWeek ?? 1;
  const firstDayOfWeek = Number(firstDay) % 7;

  const currency = hostedLocalization?.currency || defaultCurrency;
  const currencyMaybe = supportedCurrencies.includes(currency) ? { currency } : {};

  return { locale, firstDayOfWeek, ...currencyMaybe };
};

/**
 * Shape the hosted localization asset only.
 *
 * @param {Object} hostedSlices values keyed by localizationConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.localization;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const { locale, currency, firstDayOfWeek } = hostedSlice;
  return {
    ...(typeof locale === 'string' ? { locale } : {}),
    ...(typeof currency === 'string' ? { currency } : {}),
    ...(FIRST_DAYS_OF_WEEK.includes(firstDayOfWeek) ? { firstDayOfWeek } : {}),
  };
};

/**
 * Soft-check hosted localization fields.
 *
 * @param {Object} normalized
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];
  const value = {};

  if (typeof normalized?.locale === 'string' && normalized.locale.length > 0) {
    value.locale = normalized.locale;
  } else if (normalized?.locale !== undefined) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'LOCALIZATION_INVALID_LOCALE',
        message:
          'The marketplace locale is missing or invalid. Using the built-in default instead.',
      })
    );
  }

  if (FIRST_DAYS_OF_WEEK.includes(normalized?.firstDayOfWeek)) {
    value.firstDayOfWeek = normalized.firstDayOfWeek;
  } else if (normalized?.firstDayOfWeek !== undefined) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'LOCALIZATION_INVALID_FIRST_DAY',
        message:
          'The first day of the week must be a number from 1 (Monday) to 7 (Sunday). Using the built-in default instead.',
      })
    );
  }

  if (normalized?.currency !== undefined) {
    if (supportedCurrencies.includes(normalized.currency)) {
      value.currency = normalized.currency;
    } else {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LOCALIZATION_INVALID_CURRENCY',
          message:
            'The marketplace currency is missing or not supported by this app. Using the built-in default instead.',
        })
      );
    }
  }

  return { value, issues };
};

/**
 * @param {Object} validated
 * @param {Object} defaults full defaultConfigs
 * @returns {Object}
 */
const resolve = (validated, defaults) =>
  mergeLocalizationConfig(validated, defaults?.localization, defaults?.currency);

/**
 * Config handler for the `localization` app-config key.
 *
 * - id / assetKeys: `localization`
 * - Hosted: locale, firstDayOfWeek, currency
 * - Top-level `currency` elevated in mergeConfig via getMarketplaceCurrency
 */
export const localizationConfig = {
  id: 'localization',
  assetKeys: ['localization'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
