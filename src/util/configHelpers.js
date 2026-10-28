import { subUnitDivisors } from '../config/settingsCurrency';
import { buildAppConfig } from '../config/buildAppConfig';
import { configHandlers } from '../config/configRegistry';
import { getListingMinimumPriceSubUnits } from '../config/transaction/transaction';

// Generic helpers for validating config values

/**
 * This ensures that accessControl config has private marketplace flag in place.
 *
 * @param {Object} accessControlConfig (returned by access-control.json)
 * @returns {Object} accessControl config
 */
const validAccessControl = accessControlConfig => {
  const accessControl = accessControlConfig || {};
  const marketplace = accessControl?.marketplace || {};
  return {
    ...accessControl,
    marketplace: { private: false, fileUploadAndDownloadDisabled: false, ...marketplace },
  };
};

/////////////////////////
// Merge localizations //
/////////////////////////

const mergeCurrency = (hostedCurrency, defaultCurrency) => {
  const currency = hostedCurrency || defaultCurrency;
  const supportedCurrencies = Object.keys(subUnitDivisors);
  if (supportedCurrencies.includes(currency)) {
    return currency;
  } else {
    console.error(
      `The given currency (${currency}) is not supported.
      There's a missing entry on subUnitDivisors`
    );
    return null;
  }
};

const validateStripeCurrency = stripe => {
  const supportedCountries = stripe.supportedCountries || [];
  const supportedCurrencies = Object.keys(subUnitDivisors);
  const validSupportedCountries = supportedCountries.filter(country => {
    const isSupported = supportedCurrencies.includes(country.currency);

    if (!isSupported) {
      console.error(
        `Stripe configuration contained currency that was not supported by the client app.
        There's a missing entry on subUnitDivisors for ${country.currency}.`
      );
    }

    return isSupported;
  });
  return { ...stripe, supportedCountries: validSupportedCountries };
};

const mergeLocalizations = (hostedLocalization, defaultLocalization) => {
  // This defaults to 'en', if no locale is set.
  const locale = hostedLocalization?.locale || defaultLocalization.locale || 'en';
  // NOTE: We use this with DatePicker and moment, the range should be 0 - 6 instead of 1-7.
  const firstDay = hostedLocalization?.firstDayOfWeek || defaultLocalization.firstDayOfWeek || 1;
  const firstDayInMomentRange = firstDay % 7;
  return { locale, firstDayOfWeek: firstDayInMomentRange };
};

///////////////////////////////////////////////////////////////////////////
// Config handlers (ported)                                              //
// Domains like analytics are built via buildAppConfig + configRegistry. //
// Legacy merge* helpers below remain until those domains are ported.    //
///////////////////////////////////////////////////////////////////////////


export const displayDescription = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.description !== false;
};

export const displayPrice = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.price !== false;
};

export const displayLocation = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.location !== false;
};

export const displayDeliveryPickup = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.pickup !== false;
};

export const displayDeliveryShipping = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.shipping !== false;
};

export const requireListingFiles = listingTypeConfig => {
  // Unlike other require helpers, this uses a === true check instead of !== false because files are
  // opt-in. An undefined value indicates that files are not required and in general, new configs for
  // established listing types are undefined by default
  return listingTypeConfig?.defaultListingFields?.files === true;
};

export const requireListingImage = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.images !== false;
};

/**
 * Returns the max number of listing images allowed for a listing type, or null if unlimited.
 * Hosted listing-types may include imageSettings:
 * - missing / { limitImages: false } => unlimited (null)
 * - { limitImages: true, maxImages: N } => N
 *
 * @param {Object} listingTypeConfig
 * @returns {number|null}
 */
export const getListingImageMaxCount = listingTypeConfig => {
  const imageSettings = listingTypeConfig?.imageSettings;
  if (!imageSettings || imageSettings.limitImages !== true) {
    return null;
  }
  const { maxImages } = imageSettings;
  const hasValidMax = typeof maxImages === 'number' && Number.isFinite(maxImages) && maxImages >= 1;
  if (hasValidMax) {
    return maxImages;
  }
  return null;
};

export const requirePayoutDetails = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.payoutDetails !== false;
};

export const isPriceVariationsEnabled = (publicData, listingTypeConfig) => {
  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  return publicData?.priceVariationsEnabled != null
    ? publicData?.priceVariationsEnabled
    : listingTypeConfig?.priceVariations?.enabled;
};

export const allowCustomerCounterOffer = listingTypeConfig => {
  return listingTypeConfig?.negotiationOptions?.customerCounterOffer === true;
};

export const allowProviderUpdateOffer = listingTypeConfig => {
  return listingTypeConfig?.negotiationOptions?.providerUpdateOffer === true;
};

////////////////////////////////////
// Validate and merge all configs //
////////////////////////////////////

// Check if all the mandatory info have been retrieved from hosted assets
const hasMandatoryConfigs = hostedConfig => {
  const invalidAssetNames = Object.entries(mandatoryHostedAttributes)
    .filter(([assetName, { isValid }]) => !isValid(hostedConfig[assetName]))
    .map(([assetName, { attribute }]) => {
      printErrorForInvalidHostedAsset(assetName, hostedConfig[assetName], attribute);
      return assetName;
    });

  return (
    invalidAssetNames.length === 0 &&
    !hasClashWithBuiltInPublicDataKey(hostedConfig.listingFields?.listingFields)
  );
};

export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  // Remove trailing slash from marketplaceRootURL if any
  const marketplaceRootURL = defaultConfigs.marketplaceRootURL;
  const cleanedRootURL =
    typeof marketplaceRootURL === 'string' ? marketplaceRootURL.replace(/\/$/, '') : '';

  // App-config slices from registered handlers (normalize -> validate -> resolve).
  // Keys match handler.id (e.g. analytics). Hosted inputs come from handler.assetKeys.
  // Hosted configs win when usable; built-in defaults fill gaps.
  const { resolved: appConfigs } = buildAppConfig({
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

  return {
    // Use default configs as a starting point for app config.
    ...defaultConfigs,

    marketplaceRootURL: cleanedRootURL,

    // AccessControl config contains a flag whether the marketplace is private.
    accessControl: validAccessControl(configAsset.accessControl),

    // Elevated from config.transaction.listingMinimumPrice (derived property for existing call sites).
    listingMinimumPriceSubUnits,

    // Localization: currency is first-level config atm.
    currency: mergeCurrency(configAsset.localization?.currency, defaultConfigs.currency),

    // Stripe config currently comes from defaultConfigs atm.
    stripe: validateStripeCurrency(defaultConfigs.stripe),

    // Localization (locale, first day of week)
    localization: mergeLocalizations(configAsset.localization, defaultConfigs.localization),

    // The top-bar.json asset contains logo link and custom links
    // - The logo link can be used to link logo to another domain
    // - Custom links are links specified by marketplace operator (both internal and external)
    //   - Topbar tries to fit primary links to the visible space,
    //     but secondary links are always behind dropdown menu.
    topbar: configAsset.topbar, // defaultConfigs.topbar,

    // Include hosted footer config, if it exists
    // Note: if footer asset is not set, Footer is not rendered.
    footer: configAsset.footer,

    // Check if all the mandatory info have been retrieved from hosted assets
    hasMandatoryConfigurations: hasMandatoryConfigs(configAsset),

    // Handler-built slices 
    ...appConfigs,
  };
};
