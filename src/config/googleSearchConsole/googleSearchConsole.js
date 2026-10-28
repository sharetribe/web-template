//////////////////////////////////////////////////////////////////////////////
// Google Search Console config handler: hosted configs + built-in defaults //
// Hosted asset path: /integrations/google-search-console.json              //
//////////////////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const isUsableSiteVerificationToken = token =>
  typeof token === 'string' && token.length > 0 && /^\S+$/.test(token);

/**
 * Prefer hosted googleSiteVerification when present; otherwise built-in defaults.
 *
 * @param {Object} hostedGscConfig normalized hosted slice (GoogleSearchConsole asset)
 * @param {Object} defaultGscConfig built-in defaults from configDefault.js
 * @returns {Object} { googleSiteVerification }
 */
export const mergeGoogleSearchConsoleConfig = (hostedGscConfig, defaultGscConfig = {}) => {
  const token = hostedGscConfig?.googleSiteVerification;
  if (isUsableSiteVerificationToken(token)) {
    return { googleSiteVerification: token };
  }
  return {
    googleSiteVerification: defaultGscConfig.googleSiteVerification ?? null,
  };
};

/**
 * Shape the hosted googleSearchConsole asset only.
 *
 * @param {Object} hostedSlices values keyed by googleSearchConsoleConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.googleSearchConsole;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const { googleSiteVerification } = hostedSlice;
  // Pass strings through (including ""); validate decides usable vs unset vs invalid.
  return typeof googleSiteVerification === 'string' ? { googleSiteVerification } : {};
};

/**
 * Soft-check hosted token (undefined and empty means unset)
 * whitespace or other junk → warn + built-in.
 *
 * @param {Object} normalized
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];
  const value = {};
  const token = normalized?.googleSiteVerification;

  if (token === undefined || token === '') {
    return { value, issues };
  }

  if (!isUsableSiteVerificationToken(token)) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'GSC_INVALID_SITE_VERIFICATION',
        message:
          'The Google Search Console verification token is invalid (it must be non-empty and contain no spaces). Using the built-in default instead, if one is set.',
      })
    );
    return { value, issues };
  }

  value.googleSiteVerification = token;
  return { value, issues };
};

/**
 * @param {Object} validated
 * @param {Object} defaults full defaultConfigs
 * @returns {Object}
 */
const resolve = (validated, defaults) =>
  mergeGoogleSearchConsoleConfig(validated, defaults?.googleSearchConsole);

/**
 * Config handler for the `googleSearchConsole` app-config key.
 *
 * - id / assetKeys: `googleSearchConsole`
 * - Hosted: googleSiteVerification (non-empty string) → meta tag via seo.js
 * - Missing/empty/invalid → built-in default (often null)
 */
export const googleSearchConsoleConfig = {
  id: 'googleSearchConsole',
  assetKeys: ['googleSearchConsole'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
