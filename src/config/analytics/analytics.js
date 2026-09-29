//////////////////////////////////////////////////////////////////
// Analytics config handler: hosted configs + built-in defaults //
//////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const GA_MEASUREMENT_ID_PATTERN = /^G-/;
// Domain must not be an absolute http(s) URL (same intent as schema pattern).
const PLAUSIBLE_DOMAIN_REJECTS_PROTOCOL = /^(https?:)?\/\//i;

const joinStrings = (...parts) => {
  const removeTrailingComma = str => str.trim().replace(/,\s*$/, '');
  return parts
    .filter(Boolean)
    .map(str => removeTrailingComma(str))
    .join(',');
};

/**
 * Whether a hosted Google Analytics measurement id is usable (GA4).
 * @param {string} measurementId
 * @returns {boolean}
 */
export const isValidGoogleAnalyticsMeasurementId = measurementId =>
  typeof measurementId === 'string' &&
  measurementId.length > 0 &&
  GA_MEASUREMENT_ID_PATTERN.test(measurementId);

/**
 * Whether a hosted Plausible domain is usable (non-empty, no http(s):// prefix).
 * @param {string} domain
 * @returns {boolean}
 */
export const isValidPlausibleDomain = domain =>
  typeof domain === 'string' &&
  domain.trim().length > 0 &&
  !PLAUSIBLE_DOMAIN_REJECTS_PROTOCOL.test(domain.trim());

/**
 * Merge hosted analytics config with built-in analytics defaults.
 * Hosted values take priority when present and usable; built-ins fill gaps.
 *
 * Expects hosted googleAnalytics / plausible to already be schema-sanitized
 * (see analyticsConfig.validate).
 *
 * @param {Object} hostedAnalyticsConfig data from the analytics hosted asset
 * @param {Object} defaultAnalyticsConfig built-in defaults from defaultAnalytics.js
 * @returns {Object} { googleAnalyticsId, plausibleDomains? }
 */
export const mergeAnalyticsConfig = (hostedAnalyticsConfig, defaultAnalyticsConfig = {}) => {
  const { enabled, measurementId } = hostedAnalyticsConfig?.googleAnalytics || {};
  const googleAnalyticsId =
    enabled === true && isValidGoogleAnalyticsMeasurementId(measurementId)
      ? measurementId
      : defaultAnalyticsConfig.googleAnalyticsId;

  // Plausible: combine hosted domain with built-in domains when both exist
  // (Plausible supports multiple domains).
  // Hosted format is: "plausible": { "enabled": true, "domain": "example.com" }
  const plausibleHostedConfig = hostedAnalyticsConfig?.plausible || {};
  const plausibleDomainsHosted =
    plausibleHostedConfig?.enabled === true && isValidPlausibleDomain(plausibleHostedConfig?.domain)
      ? plausibleHostedConfig.domain.trim()
      : '';
  const plausibleDomainsDefault = defaultAnalyticsConfig.plausibleDomains;
  const plausibleDomains = joinStrings(plausibleDomainsHosted, plausibleDomainsDefault);
  const plausibleDomainsMaybe = plausibleDomains ? { plausibleDomains } : {};

  return { googleAnalyticsId, ...plausibleDomainsMaybe };
};

/**
 * Shape the hosted analytics asset only (not built-in defaults).
 * Picks known provider blocks; returns {} if the slice is missing/invalid.
 *
 * @param {Object} hostedSlices values keyed by analyticsConfig.assetKeys (`analytics`)
 * @returns {Object} partial hosted analytics input for validate
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.analytics;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }
  const googleAnalytics = isPlainObject(hostedSlice.googleAnalytics)
    ? hostedSlice.googleAnalytics
    : undefined;
  const plausible = isPlainObject(hostedSlice.plausible) ? hostedSlice.plausible : undefined;
  return {
    ...(googleAnalytics ? { googleAnalytics } : {}),
    ...(plausible ? { plausible } : {}),
  };
};

/**
 * Validate the normalized hosted analytics slice only — does not read or check built-ins.
 * Drops invalid GA / Plausible blocks (with warns). Gaps may be filled in resolve from
 * built-in defaults (e.g. env vars in defaultAnalytics.js), if the customizer set them.
 *
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }} sanitized hosted slice + configIssues
 */
const validate = normalized => {
  const issues = [];
  const value = {};

  const { googleAnalytics, plausible } = normalized || {};

  if (googleAnalytics) {
    const enabled = googleAnalytics.enabled === true;
    const { measurementId } = googleAnalytics;

    if (!enabled) {
      value.googleAnalytics = { enabled: false };
    } else if (!isValidGoogleAnalyticsMeasurementId(measurementId)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'GA_INVALID_OR_MISSING_MEASUREMENT_ID',
          message:
            'Google Analytics is enabled, but the measurement ID is missing or invalid (it should start with "G-").',
        })
      );
      // Omit googleAnalytics so resolve does not treat hosted GA as active.
    } else {
      value.googleAnalytics = { enabled: true, measurementId };
    }
  }

  if (plausible) {
    const enabled = plausible.enabled === true;
    const domain =
      typeof plausible.domain === 'string' ? plausible.domain.trim() : plausible.domain;

    if (!enabled) {
      value.plausible = { enabled: false };
    } else if (!isValidPlausibleDomain(domain)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'PLAUSIBLE_INVALID_OR_MISSING_DOMAIN',
          message:
            'Plausible is enabled, but the domain is missing or invalid (use a bare domain, not a full URL).',
        })
      );
    } else {
      value.plausible = { enabled: true, domain };
    }
  }

  return { value, issues };
};

/**
 * Build final `config.analytics`: prefer validated hosted values; fill gaps from built-ins
 * (often env vars from defaultAnalytics.js). Plausible may union hosted + built-in domains.
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.analytics`)
 * @returns {Object} app-config analytics object
 */
const resolve = (validated, defaults) => mergeAnalyticsConfig(validated, defaults?.analytics);

/**
 * Config handler for the `analytics` app-config key.
 *
 * - id: key on the resolved app config (`config.analytics`)
 * - assetKeys: hosted-asset / appCdnAssets keys this handler reads
 *
 * Pipeline: normalize → validate → resolve (via buildAppConfig).
 * Hosted config takes priority; built-in defaults fill gaps (e.g. GA id when
 * hosted GA is off or invalid; Plausible also unions hosted + built-in domains).
 */
export const analyticsConfig = {
  id: 'analytics',
  assetKeys: ['analytics'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
