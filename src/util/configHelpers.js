import { subUnitDivisors } from '../config/settingsCurrency';
import { buildAppConfig } from '../config/buildAppConfig';
import { configHandlers } from '../config/configRegistry';
import {
  validBoolean,
  validEnumString,
  validHelpText,
  validKey,
  validLabel,
  validNumberConfig,
  validPlaceholderMessage,
  validRequiredMessage,
  validSchemaOptions,
  union,
  mergeDefaultTypesAndFieldsForDebugging,
} from '../config/config.shared';
import { EXTENDED_DATA_SCHEMA_TYPES } from './types';

// Generic helpers for validating config values

const mandatoryHostedAttributes = {
  branding: { attribute: 'logo', isValid: branding => !!branding?.logo },
  listingTypes: {
    attribute: 'listingTypes',
    isValid: listingTypes => listingTypes?.listingTypes?.length > 0,
  },
  listingFields: {
    attribute: 'listingFields',
    isValid: listingFields => !!listingFields?.listingFields,
  },
  transactionSize: {
    attribute: 'listingMinimumPrice',
    isValid: transactionSize => !!transactionSize?.listingMinimumPrice,
  },
};

const printErrorForInvalidHostedAsset = (assetName, asset, attribute) => {
  const isAssetEmpty = Object.keys(asset || {}).length === 0;
  const problem = isAssetEmpty
    ? `Mandatory hosted asset for ${assetName} is missing.`
    : `Mandatory hosted asset for ${assetName} is missing the "${attribute}" attribute.`;
  console.error(`${problem}
      Check that "appCdnAssets" property has valid paths in src/config/configDefault.js file,
      and that the marketplace has added content in Console`);
};

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


const validUserTypesForUserConfig = (userTypeConfig, userTypesInUse = null) => {
  const { limitToUserTypeIds, userTypeIds } = userTypeConfig;

  // When no user types are in use, fields by default cannot be limited to a subset of types
  if (!userTypesInUse) {
    const isValid = true;
    const validValue = {
      userTypeConfig: {
        limitToUserTypeIds: false,
      },
    };

    return [isValid, validValue];
  }

  const isArray = Array.isArray(userTypeIds);
  const validatedUserTypes = isArray ? userTypeIds.filter(ut => userTypesInUse?.includes(ut)) : [];

  // If a field is limited to user type ids, it has to have at least one valid type
  const hasValidUserTypes = validatedUserTypes.length > 0;
  const isValid = hasValidUserTypes || !limitToUserTypeIds;

  const validValue = hasValidUserTypes
    ? {
        userTypeConfig: {
          limitToUserTypeIds,
          userTypeIds: validatedUserTypes,
        },
      }
    : {
        userTypeConfig: {
          limitToUserTypeIds: false,
        },
      };
  return [isValid, validValue];
};

// Build sort options derived from listing fields that have showSorting enabled.
// Primary options are inserted before the default sort options and secondary after.
const getSortOptionsFromListingFields = listingFields => {
  const primaryOptions = [];
  const secondaryOptions = [];

  listingFields.forEach(field => {
    const { key, scope, schemaType, filterConfig } = field;
    // only add sort options for numeric fields and if showSorting is true
    if (schemaType !== 'long' || !filterConfig?.showSorting) {
      return;
    }

    const prefix = scope === 'metadata' ? 'meta_' : 'pub_';
    const sortKey = `${prefix}${key}`;
    const { label, sortingOrder, sortingGroup } = filterConfig;

    const options = [];

    if (sortingOrder.asc) {
      options.push({
        key: `-${sortKey}`,
        labelTranslationKey: 'SortBy.numericSortOption',
        translationValues: { fieldLabel: label, direction: 'asc' },
      });
    }
    if (sortingOrder.desc) {
      options.push({
        key: sortKey,
        labelTranslationKey: 'SortBy.numericSortOption',
        translationValues: { fieldLabel: label, direction: 'desc' },
      });
    }

    if (sortingGroup === 'secondary') {
      secondaryOptions.push(...options);
    } else {
      primaryOptions.push(...options);
    }
  });

  return { primaryOptions, secondaryOptions };
};
const validUserShowConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }

  // Validate: label, displayInProfile.
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidDisplayInProfile, displayInProfile] = validBoolean(
    'displayInProfile',
    config.displayInProfile,
    true
  );
  const [isValidUnselectedOptions, unselectedOptions] = validBoolean(
    'unselectedOptions',
    config.unselectedOptions,
    true
  );

  const isValid = isValidLabel && isValidDisplayInProfile && isValidUnselectedOptions;
  const validValue = {
    showConfig: {
      ...label,
      ...displayInProfile,
      ...unselectedOptions,
    },
  };
  return [isValid, validValue];
};

const validUserSaveConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: label, placeholderMessage, required, displayInSignUp, requiredMessage
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidPlaceholder, placeholderMessage] = validPlaceholderMessage(
    config.placeholderMessage
  );

  // At this point, all user fields are required by default, and shown in signup by default.
  const [isValidIsRequired, isRequired] = validBoolean('isRequired', config.isRequired, true);
  const [isValidDisplayInSignUp, displayInSignUp] = validBoolean(
    'displayInSignUp',
    config.displayInSignUp,
    true
  );
  const [isValidRequiredMessage, requiredMessage] = validRequiredMessage(config.requiredMessage);

  const isValid =
    isValidLabel &&
    isValidPlaceholder &&
    isValidIsRequired &&
    isValidDisplayInSignUp &&
    isValidRequiredMessage;
  const validValue = {
    saveConfig: {
      ...label,
      ...placeholderMessage,
      ...isRequired,
      ...displayInSignUp,
      ...requiredMessage,
    },
  };
  return [isValid, validValue];
};

const validUserTypes = userTypes => {
  const validTypes = userTypes.filter(config => {
    const { userType, label } = config;
    return userType && label;
  });

  return validTypes;
};

const validUserFields = (userFields, userTypesInUse) => {
  const keys = userFields.map(d => d.key);
  const scopeOptions = ['public', 'private', 'protected', 'metadata'];

  return userFields.reduce((acc, data) => {
    const schemaType = data.schemaType;

    const validationData = Object.entries(data).reduce(
      (acc, entry) => {
        const [name, value] = entry;

        // Validate each property
        const [isValid, prop] =
          name === 'key'
            ? validKey(value, keys)
            : name === 'label'
            ? validLabel(value)
            : name === 'scope'
            ? validEnumString('scope', value, scopeOptions, 'public')
            : name === 'schemaType'
            ? validEnumString('schemaType', value, EXTENDED_DATA_SCHEMA_TYPES)
            : name === 'enumOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'numberConfig'
            ? validNumberConfig(value, schemaType)
            : name === 'showConfig'
            ? validUserShowConfig(value)
            : name === 'userTypeConfig'
            ? validUserTypesForUserConfig(value, userTypesInUse)
            : name === 'saveConfig'
            ? validUserSaveConfig(value)
            : name === 'helpText'
            ? validHelpText(value)
            : [true, { [name]: value }];

        const hasFoundValid = !(acc.isValid === false || isValid === false);
        // Let's warn about wrong data in listing extended data config
        if (isValid === false) {
          console.warn(`Unsupported user extended data configurations detected (${name}) in`, data);
        }

        return { config: { ...acc.config, ...prop }, isValid: hasFoundValid };
      },
      { config: {}, isValid: true }
    );

    return validationData.isValid ? [...acc, validationData.config] : acc;
  }, []);
};


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

///////////////////////////////////////
// Restructure hosted user config //
///////////////////////////////////////

const restructureUserTypes = (hostedUserTypes = []) => {
  return hostedUserTypes.map(userType => {
    const { id, ...rest } = userType;
    return { userType: id, ...rest };
  });
};

const restructureUserFields = hostedUserFields => {
  return (
    hostedUserFields?.map(userField => {
      const {
        key,
        scope,
        schemaType,
        enumOptions,
        label,
        showConfig = {},
        saveConfig = {},
        userTypeConfig = {},
        ...rest
      } = userField;
      const defaultLabel = label || key;
      const enumOptionsMaybe = ['enum', 'multi-enum'].includes(schemaType) ? { enumOptions } : {};
      const { required: isRequired, ...restSaveConfig } = saveConfig;

      return key
        ? {
            key,
            scope,
            schemaType,
            ...enumOptionsMaybe,
            showConfig: {
              ...showConfig,
              label: showConfig.label || defaultLabel,
            },
            saveConfig: {
              ...restSaveConfig,
              isRequired,
              label: saveConfig.label || defaultLabel,
            },
            userTypeConfig,
            ...rest,
          }
        : null;
    }) || []
  );
};







};

const mergeUserConfig = (hostedConfig, defaultConfigs) => {
  const hostedUserTypes = restructureUserTypes(hostedConfig?.userTypes?.userTypes);
  const hostedUserFields = restructureUserFields(hostedConfig?.userFields?.userFields);

  const { userFields: defaultUserFields, userTypes: defaultUserTypes } = defaultConfigs.user;

  // When debugging, include default configs by passing 'true' here.
  // Otherwise, use user fields from hosted assets.
  const shouldMerge = mergeDefaultTypesAndFieldsForDebugging(false);
  const userTypes = shouldMerge
    ? union(hostedUserTypes, defaultUserTypes, 'userType')
    : hostedUserTypes;
  const userFields = shouldMerge
    ? union(hostedUserFields, defaultUserFields, 'key')
    : hostedUserFields;

  // To include user type validation (if you have user types in your default configuration),
  // pass userTypes to the validUserFields function as well:
  const userTypesInUse = userTypes.map(ut => `${ut.userType}`);
  return {
    userTypes: validUserTypes(userTypes),
    userFields: validUserFields(userFields, userTypesInUse),
  };
};

//////////////////////////////
// Validate Default filters //
//////////////////////////////

const validCategoryConfig = (config, categoryConfiguration) => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  const { key, scope, categoryLevelKeys } = categoryConfiguration;
  // This ensures that flat category structure still uses categoryLevel1 key
  const isNestedEnum = true;
  const nestedParams = categoryLevelKeys;

  // Note: this adds more configurations to category filter configs
  // - The scope unifies the URL parameter handling (category is behaving like built-in, but handled through public data)
  // - isNestedEnum & nestedParams help to reason out if multiple URL search parameters are needed or not.
  return { key, schemaType: 'category', scope, isNestedEnum, nestedParams };
};

const validListingTypeSearchConfig = (config, listingTypeConfig) => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  const options = listingTypeConfig.map(lt => ({ option: lt.listingType, label: lt.label }));

  return {
    key: 'listingType',
    schemaType: 'listingType',
    scope: 'public',
    options,
  };
};

const validDatesConfig = config => {
  const {
    enabled = true,
    label = 'Dates',
    dateRangeMode = 'day',
    availability = 'time-full',
  } = config;
  const isValidLabel = typeof label === 'string';
  const isValidMode = ['day', 'night'].includes(dateRangeMode);
  const isValidAvailability = ['time-full', 'time-partial'].includes(availability);

  if (!(enabled && isValidLabel && isValidMode && isValidAvailability)) {
    return null;
  }

  return { key: 'dates', schemaType: 'dates', label, availability, dateRangeMode };
};

const validSeatsConfig = config => {
  const { enabled = true, label = 'Seats' } = config;
  const isValidLabel = typeof label === 'string';

  if (!(enabled && isValidLabel)) {
    return null;
  }

  return { key: 'seats', schemaType: 'seats', label };
};

const validPriceConfig = config => {
  const { enabled = true, label = 'Price', min = 0, max = 1000, step = 5 } = config;
  const isValidLabel = typeof label === 'string';
  const isValidMin = typeof min === 'number';
  const isValidMax = typeof max === 'number';
  const isValidStep = typeof step === 'number';

  if (!(enabled && isValidLabel && isValidMin && isValidMax && isValidStep)) {
    return null;
  }

  const isMaxBigger = max > min;
  if (!isMaxBigger) {
    console.error(`Price filter: min value (${min}) needs to be smaller than max (${max})`);
  }
  return isMaxBigger ? { key: 'price', schemaType: 'price', label, min, max, step } : null;
};

const validKeywordsConfig = config => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  return { key: 'keywords', schemaType: 'keywords' };
};

const validDefaultFilters = (defaultFilters, categoryConfiguration, listingTypeConfig) => {
  return defaultFilters
    .map(data => {
      const schemaType = data.schemaType;
      return schemaType === 'category'
        ? validCategoryConfig(data, categoryConfiguration)
        : schemaType === 'listingType'
        ? validListingTypeSearchConfig(data, listingTypeConfig)
        : schemaType === 'dates'
        ? validDatesConfig(data)
        : schemaType === 'seats'
        ? validSeatsConfig(data)
        : schemaType === 'price'
        ? validPriceConfig(data)
        : schemaType === 'keywords'
        ? validKeywordsConfig(data)
        : data;
    })
    .filter(Boolean);
};

//////////////////////////
// Validate sort config //
//////////////////////////

const validSortConfig = config => {
  const active = typeof config.active === 'boolean' ? config.active : true;
  const queryParamName = config.queryParamName || 'sort';
  const relevanceKey = config.relevanceKey || 'relevance';
  const relevanceFilter = config.relevanceFilter || 'keywords';
  const conflictingFilters = config.conflictingFilters || [];
  const optionsRaw = config.options || [];
  const options = optionsRaw.filter(o => !!o.key && !!(o.label || o.labelTranslationKey));
  return { active, queryParamName, relevanceKey, relevanceFilter, conflictingFilters, options };
};

const mergeSortConfig = (hostedSortConfig, defaultSortConfig, omitRelevance, listingFields) => {
  // Flag filters to remove if the default sorting option is toggled off in Console
  const removeByKey = {
    createdAt: !hostedSortConfig?.newest,
    '-createdAt': !hostedSortConfig?.oldest,
    '-price': !hostedSortConfig?.lowestPrice,
    price: !hostedSortConfig?.highestPrice,
    relevance: !hostedSortConfig?.relevance || omitRelevance,
  };

  // In addition to the search configuration, additional sort options can be configured
  // through listing fields. getSortOptionsFromListingFields iterates through the listing fields
  // and returns primaryOptions and secondaryOptions. primaryOptions are prepended to the
  // sort options and secondaryOptions are appended.
  const { primaryOptions, secondaryOptions } = getSortOptionsFromListingFields(listingFields);
  // hostedSortConfig can be undefined if listing search settings have not been updated in Console,
  // in which case there's no need to filter out any options
  const filteredDefaults =
    hostedSortConfig == null
      ? defaultSortConfig.options
      : defaultSortConfig.options.filter(option => !removeByKey[option.key]);
  const options = [...primaryOptions, ...filteredDefaults, ...secondaryOptions];

  return {
    ...defaultSortConfig,
    // Disable SortBy component if there are less than 2 options
    active: options.length > 1,
    options: options,
  };
};

const mergeSearchConfig = (
  hostedSearchConfig,
  defaultSearchConfig,
  categoryConfiguration,
  listingTypeConfig,
  listingFieldsConfig
) => {
  // the mainSearch attribute (reflects whether the user has chosen keyword or location search) is required in Console if modifying search configuration, so its presence reliably indicates a hosted config exists.
  // If absent, we still check listingFieldsConfig since numeric fields may contribute sort options.
  // If neither is set, return defaultSearchConfig
  const searchConfig = hostedSearchConfig?.mainSearch
    ? {
        sortConfig: mergeSortConfig(
          hostedSearchConfig?.sorting?.defaultSortingOptions,
          defaultSearchConfig.sortConfig,
          hostedSearchConfig?.mainSearch?.searchType === 'location',
          listingFieldsConfig
        ),
        // This is an example of how to load custom built-in filters through the listing/defaultListing.js file
        // Note: listingTypeFilter and categoryFilter might be overwritten by hostedSearchConfig
        listingTypeFilter: defaultSearchConfig.listingTypeFilter,
        categoryFilter: defaultSearchConfig.categoryFilter,
        ...hostedSearchConfig,
      }
    : listingFieldsConfig
    ? {
        ...defaultSearchConfig,
        // here we pass null since in this scenario no hosted search configuration exists
        sortConfig: mergeSortConfig(
          null,
          defaultSearchConfig.sortConfig,
          false,
          listingFieldsConfig
        ),
      }
    : defaultSearchConfig;

  const {
    mainSearch,
    categoryFilter,
    listingTypeFilter,
    dateRangeFilter,
    seatsFilter,
    priceFilter,
    keywordsFilter,
    sortConfig,
    ...rest
  } = searchConfig || {};
  const searchType = ['location', 'keywords'].includes(mainSearch?.searchType)
    ? mainSearch?.searchType
    : 'keywords';

  const categoryFilterMaybe =
    categoryFilter && categoryConfiguration.categories?.length > 0 ? [categoryFilter] : [];
  const keywordsFilterMaybe =
    keywordsFilter?.enabled === true
      ? [{ key: 'keywords', schemaType: 'keywords' }]
      : defaultSearchConfig.keywordsFilter
      ? [defaultSearchConfig.keywordsFilter]
      : [];

  const seatsFilterMaybe = typeof seatsFilter?.enabled === 'boolean' ? [seatsFilter] : [];

  const listingTypeFilterMaybe =
    typeof listingTypeFilter?.enabled === 'boolean' ? [listingTypeFilter] : [];

  // This will define the order of default filters
  // The reason: These default filters come from config assets and
  // there they'll be their own separate entities and not wrapped in an array.
  // Note: The category filter might affect the visibility of custom filters (listing fields).
  //       It might be somewhat strange experience if a primary filter is among those filters
  //       that are affected by category selection.
  const defaultFilters = [
    ...listingTypeFilterMaybe,
    ...categoryFilterMaybe,
    dateRangeFilter,
    ...seatsFilterMaybe,
    priceFilter,
    ...keywordsFilterMaybe,
  ];

  return {
    mainSearch: { searchType },
    defaultFilters: validDefaultFilters(defaultFilters, categoryConfiguration, listingTypeConfig),
    sortConfig: validSortConfig(sortConfig),
    ...rest,
  };
};

//////////////////////////////////
// Validate transaction configs //
//////////////////////////////////

const getListingMinimumPrice = transactionSize => {
  const { listingMinimumPrice } = transactionSize || {};
  return listingMinimumPrice?.type === 'subunit' ? listingMinimumPrice.amount : 0;
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

  // By default, always try to take the value of listingMinimumPriceSubUnits from the transaction-size.json asset.
  // - If there is no value, we use the defaultConfigs.listingMinimumPriceSubUnits
  // - If the value is 0 (aka _falsy_), we use the defaultConfigs.listingMinimumPriceSubUnits
  //   (The latter is mainly due to backward compatibility atm, since Console won't allow saving 0 anymore.)
  // Note: It might make sense that 0 handling is different for default-inquiry process.
  //       With the built-in code flow, you can only remove price altogether from listing type using default-inquiries.
  const listingMinimumPriceSubUnits =
    getListingMinimumPrice(configAsset.transactionSize) ||
    defaultConfigs.listingMinimumPriceSubUnits;

  // App-config slices from registered handlers (normalize -> validate -> resolve).
  // Keys match handler.id (e.g. analytics). Hosted inputs come from handler.assetKeys.
  // Hosted configs win when usable; built-in defaults fill gaps.
  const { resolved: appConfigs } = buildAppConfig({
    hosted: configAsset,
    defaults: defaultConfigs,
    handlers: configHandlers,
  });

  return {
    // Use default configs as a starting point for app config.
    ...defaultConfigs,

    marketplaceRootURL: cleanedRootURL,

    // AccessControl config contains a flag whether the marketplace is private.
    accessControl: validAccessControl(configAsset.accessControl),

    // Overwrite default configs if hosted config is available
    listingMinimumPriceSubUnits,

    // Localization: currency is first-level config atm.
    currency: mergeCurrency(configAsset.localization?.currency, defaultConfigs.currency),

    // Stripe config currently comes from defaultConfigs atm.
    stripe: validateStripeCurrency(defaultConfigs.stripe),

    // Localization (locale, first day of week)
    localization: mergeLocalizations(configAsset.localization, defaultConfigs.localization),

    // User configuration comes entirely from hosted assets by default.
    user: mergeUserConfig(configAsset, defaultConfigs),

    // Hosted search configuration does not yet contain sortConfig
    search: mergeSearchConfig(
      configAsset.search,
      defaultConfigs.search,
      categoryConfiguration,
      listingConfiguration.listingTypes,
      listingConfiguration.listingFields
    ),

    // Google Site Verification can be given through configs.
    // Renders a meta tag: <meta name="google-site-verification" content="[token-here]>" />
    googleSearchConsole: configAsset.googleSearchConsole?.googleSiteVerification
      ? configAsset.googleSearchConsole
      : defaultConfigs.googleSearchConsole,

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
