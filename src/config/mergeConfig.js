///////////////////////////////////////////////////////////////////////////
// App-config pipeline: handler registry → run → merge into appConfig    //
///////////////////////////////////////////////////////////////////////////

import { accessControlConfig } from './accessControl/accessControl';
import { analyticsConfig } from './analytics/analytics';
import { brandingConfig } from './branding/branding';
import { categoryConfigurationConfig } from './categoryConfiguration/categoryConfiguration';
import { footerConfig } from './footer/footer';
import { googleSearchConsoleConfig } from './googleSearchConsole/googleSearchConsole';
import { layoutConfig } from './layout/layout';
import { listingConfig } from './listing/listing';
import { localizationConfig, getMarketplaceCurrency } from './localization/localization';
import { mapsConfig } from './maps/maps';
import { searchConfig } from './search/search';
import { stripeConfig } from './stripe/stripe';
import { topbarConfig } from './topbar/topbar';
import { transactionConfig, getListingMinimumPriceSubUnits } from './transaction/transaction';
import { userConfig } from './user/user';

/**
 * Ordered registry of config handlers.
 *
 * Each entry owns one config domain.
 * They normalize and validate hosted asset(s) and then resolve them into app-config keys.
 * Handlers declare `id` (app-config key) and `assetKeys` (hosted-asset keys).
 * Add new domain handlers here (and a default*.js when needed).
 *
 * Interdependent handlers must follow their dependencies and rely on ctx for context.
 * (E.g. categoryConfiguration before listing and listing before search).
 */
export const configHandlers = [
  analyticsConfig,
  brandingConfig,
  layoutConfig,
  mapsConfig,
  googleSearchConsoleConfig,
  accessControlConfig,
  localizationConfig,
  topbarConfig,
  footerConfig,
  stripeConfig,
  categoryConfigurationConfig,
  listingConfig,
  searchConfig,
  userConfig,
  transactionConfig,
];

/**
 * Run config handlers to produce per-domain slices (not the full app config).
 *
 * For each handler: collect hosted[assetKey] for each entry in `assetKeys` →
 * normalize → validate → resolve. Resolve prefers usable hosted values;
 * built-in defaults fill gaps.
 *
 * - `id` — key written onto `resolved` (the app-config property for that domain)
 * - `assetKeys` — hosted-assets keys this handler consumes (array; may be empty for
 *   built-in/env-only domains such as stripe)
 *
 * Missing hosted keys yield `undefined` entries in the slices object; the handler
 * should fall back to built-in defaults in resolve. Empty `assetKeys` → normalize
 * receives `{}`.
 *
 * Fetching hosted assets stays outside this runner: pass an already-loaded
 * `hosted` object so the same handlers can run for Sharetribe or other hosts.
 * Prefer `mergeConfig` for the final app config; use this in domain tests.
 *
 * @param {Object} params
 * @param {Object} [params.hosted] hosted config object (e.g. Sharetribe assets)
 * @param {Object} [params.defaults] built-in defaultConfigs
 * @param {Array<Object>} params.handlers ordered config handlers (see configHandlers)
 * @returns {{ resolved: Object, configIssues: Array }}
 *   resolved — `{ [handler.id]: value }` ready to merge into the app config
 *   configIssues — structured issues from validate, resolve (`ctx.issues`), and invalid handlers
 */
export const applyConfigHandlers = ({ hosted = {}, defaults = {}, handlers = [] } = {}) => {
  const configIssues = [];
  const resolved = {};
  const ctx = { hosted, defaults, resolved };

  handlers.forEach(handler => {
    const assetKeys = handler?.assetKeys;

    if (!handler?.id || !Array.isArray(assetKeys) || typeof handler.resolve !== 'function') {
      configIssues.push({
        level: 'error',
        configId: handler?.id || 'unknown',
        code: 'INVALID_CONFIG_HANDLER',
        message: 'Config handler must define id, assetKeys (array, may be empty), and resolve()',
      });
      return;
    }

    const hostedSlices = Object.fromEntries(assetKeys.map(key => [key, hosted?.[key]]));

    // 1. Normalize the incoming configuration to the format that this app prefers.
    const normalized =
      typeof handler.normalize === 'function' ? handler.normalize(hostedSlices, ctx) : hostedSlices;

    // 2. Validate the incoming configuration to ensure it's not missing any required fields.
    const { value, issues: validateIssues = [] } =
      typeof handler.validate === 'function'
        ? handler.validate(normalized, ctx)
        : { value: normalized, issues: [] };

    // 3. Resolve the finalized configuration by also incorporating the built-in defaults when necessary.
    // Resolve may push additional issues onto ctx.issues (e.g. search merge warns).
    const resolveIssues = [];
    resolved[handler.id] = handler.resolve(value, defaults, { ...ctx, issues: resolveIssues });

    const tag = issue => ({ configId: handler.id, ...issue });
    configIssues.push(...validateIssues.map(tag), ...resolveIssues.map(tag));
  });

  return { resolved, configIssues };
};

// Log structured issues from config handlers.
// Skip console noise in tests; issues still feed hasMandatoryConfigurations.
const isTestEnvironment = process.env.NODE_ENV === 'test';
const logConfigIssues = (configIssues = []) => {
  if (isTestEnvironment) {
    return;
  }
  configIssues.forEach(issue => {
    const line = `[${issue.configId}] ${issue.code}: ${issue.message}`;
    if (issue.level === 'error') {
      console.error(line);
    } else if (issue.level === 'warn') {
      console.warn(line);
    }
  });
};

// MaintenanceMode when any handler issue has level: 'error'.
const hasMandatoryConfigurations = (configIssues = []) => {
  logConfigIssues(configIssues);
  return !configIssues.some(issue => issue.level === 'error');
};

/**
 * Merge hosted config assets with built-in defaults into the final app config.
 *
 * Runs registered handlers via applyConfigHandlers, elevates derived top-level keys
 * (currency, listingMinimumPriceSubUnits), and sets hasMandatoryConfigurations
 * from error-level config issues.
 *
 * @param {Object} [configAsset] hosted configs (Asset Delivery API / other host)
 * @param {Object} [defaultConfigs] built-in defaults from configDefault.js
 * @returns {Object} app config for ConfigurationProvider
 */
export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  // Remove trailing slash from marketplaceRootURL if any
  const marketplaceRootURL = defaultConfigs.marketplaceRootURL;
  const cleanedRootURL =
    typeof marketplaceRootURL === 'string' ? marketplaceRootURL.replace(/\/$/, '') : '';

  // App-config slices from registered handlers (normalize -> validate -> resolve).
  // Keys match handler.id (e.g. analytics, categoryConfiguration, listing, search, user, transaction).
  // Hosted configs win when usable; built-in defaults fill gaps.
  // configIssues (level: 'error') feed hasMandatoryConfigurations / MaintenanceMode.
  const { resolved: appConfigs, configIssues } = applyConfigHandlers({
    hosted: configAsset,
    defaults: defaultConfigs,
    handlers: configHandlers,
  });

  return {
    // Use default configs as a starting point for app config.
    // Note: configDefault.js still contains marketplace-specific configs
    // that are not handled by the handlers. E.g. marketplaceRootURL, marketplaceName, and address.
    ...defaultConfigs,

    marketplaceRootURL: cleanedRootURL,

    // Derived top-level convenience from config.transaction.
    // - Prefer hosted listingMinimumPrice.amount when usable
    // - If missing or 0, use defaultConfigs.listingMinimumPriceSubUnits
    //   (The latter is mainly due to backward compatibility atm, since Console won't allow saving 0 anymore.)
    listingMinimumPriceSubUnits: getListingMinimumPriceSubUnits(
      appConfigs.transaction,
      defaultConfigs.listingMinimumPriceSubUnits
    ),

    // Elevated from config.localization.currency (derived property for existing call sites).
    currency: getMarketplaceCurrency(appConfigs.localization, defaultConfigs.currency),

    // Mandatory gates: handler errors only (branding.logo, listing, transaction.listingMinimumPrice, …)
    hasMandatoryConfigurations: hasMandatoryConfigurations(configIssues),

    // Handler-built slices. Spread last so these keys override defaultConfigs.
    ...appConfigs,
  };
};
