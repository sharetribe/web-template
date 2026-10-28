///////////////////////////////////////////////////////////////////////////
// App-config wiring: buildAppConfig + registry + derived top-level keys //
///////////////////////////////////////////////////////////////////////////

import { buildAppConfig } from './buildAppConfig';
import { configHandlers } from './configRegistry';
import { getListingMinimumPriceSubUnits } from './transaction/transaction';
import { getMarketplaceCurrency } from './localization/localization';

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
 * Runs registered handlers via buildAppConfig, elevates derived top-level keys
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
  const { resolved: appConfigs, configIssues } = buildAppConfig({
    hosted: configAsset,
    defaults: defaultConfigs,
    handlers: configHandlers,
  });

  // Derived top-level convenience from config.transaction (not a handler id).
  // - Prefer hosted listingMinimumPrice.amount when usable
  // - If missing or 0, use defaultConfigs.listingMinimumPriceSubUnits
  //   (The latter is mainly due to backward compatibility atm, since Console won't allow saving 0 anymore.)
  const listingMinimumPriceSubUnits = getListingMinimumPriceSubUnits(
    appConfigs.transaction,
    defaultConfigs.listingMinimumPriceSubUnits
  );

  // Elevated from config.localization.currency (derived property for existing call sites).
  const currency = getMarketplaceCurrency(appConfigs.localization, defaultConfigs.currency);

  return {
    // Use default configs as a starting point for app config.
    ...defaultConfigs,

    marketplaceRootURL: cleanedRootURL,

    // Elevated from config.transaction.listingMinimumPrice (derived property for existing call sites).
    listingMinimumPriceSubUnits,

    // Elevated from config.localization.currency.
    currency,

    // Mandatory gates: handler errors only (branding.logo, listing, transaction.listingMinimumPrice, …)
    hasMandatoryConfigurations: hasMandatoryConfigurations(configIssues),

    // Handler-built slices (including stripe). Spread last so these keys override defaultConfigs.
    ...appConfigs,
  };
};
