import { subUnitDivisors } from '../config/settingsCurrency';
import { getSupportedProcessesInfo } from '../transactions/transaction';

// Generic helpers for validating config values

const printErrorIfHostedAssetIsMissing = props => {
  Object.entries(props).map(entry => {
    const [key, value = {}] = entry || [];
    if (Object.keys(value)?.length === 0) {
      console.error(`Mandatory hosted asset for ${key} is missing.
      Check that "appCdnAssets" property has valid paths in src/config/configDefault.js file,
      and that the marketplace has added content in Console`);
    }
  });
};

/**
 * Check that listing fields don't have keys that clash with built-in keys
 * that this app uses in public data.
 *
 * @param {Object} listingFields object that has 'key' property.
 * @returns true if there's a clash with specific built-in keys.
 */
const hasClashWithBuiltInPublicDataKey = listingFields => {
  const builtInPublicDataKeys = [
    'listingType',
    'transactionProcessAlias',
    'unitType',
    'location',
    'pickupEnabled',
    'shippingEnabled',
    'shippingPriceInSubunitsOneItem',
    'shippingPriceInSubunitsAdditionalItems',
  ];
  let hasClash = false;
  listingFields.forEach(field => {
    if (builtInPublicDataKeys.includes(field.key)) {
      hasClash = true;
      console.error(
        `The id of a listing field ("${field.key}") clashes with the built-in keys that this app uses in public data.`
      );
    }
  });
  return hasClash;
};

/////////////////////////
// Merge localizations //
/////////////////////////

const mergeCurrency = (hostedCurrency, defaultCurrency) => {
  const currency = hostedCurrency || defaultCurrency;
  const supportedCurrencies = Object.keys(subUnitDivisors);
  if (supportedCurrencies.includes(currency)) {
    // TODO: is the currency a mandatory data coming from a hosted asset?
    return currency;
  } else {
    return null;
  }
};

const mergeLocalizations = (hostedLocalization, defaultLocalization) => {
  // This defaults to 'en', if no locale is set.
  const locale = hostedLocalization?.locale || defaultLocalization.locale || 'en';
  // NOTE: We use this with react-dates and moment, the range should be 0 - 6 instead of 1-7.
  const firstDay = hostedLocalization?.firstDayOfWeek || defaultLocalization.firstDayOfWeek || 1;
  const firstDayInMomentRange = firstDay % 7;
  return { locale, firstDayOfWeek: firstDayInMomentRange };
};

/////////////////////
// Merge analytics //
/////////////////////

// The "arguments" (an Array like object) is only available for non-arrow functions.
function joinStrings(str1, str2) {
  const removeTrailingComma = str => str.trim().replace(/,\s*$/, '');
  // Filter out empty strings (falsy) and join remaining items with comma
  return Array.from(arguments)
    .filter(Boolean)
    .map(str => removeTrailingComma(str))
    .join(',');
}

const mergeAnalyticsConfig = (hostedAnalyticsConfig, defaultAnalyticsConfig) => {
  const { enabled, measurementId } = hostedAnalyticsConfig?.googleAnalytics || {};
  const googleAnalyticsId =
    enabled && measurementId ? measurementId : defaultAnalyticsConfig.googleAnalyticsId;

  // With Plausible, we merge hosted analytics and default (built-in) analytics if any (Plausible supports multiple domains)
  // Hosted format is: "plausible": { "enabled": true, "domain": "example.com" }
  const plausibleHostedConfig = hostedAnalyticsConfig?.plausible || {};
  const plausibleDomainsHosted =
    plausibleHostedConfig?.enabled && plausibleHostedConfig?.domain
      ? plausibleHostedConfig.domain
      : '';
  const plausibleDomainsDefault = defaultAnalyticsConfig.plausibleDomains;
  const plausibleDomains = joinStrings(plausibleDomainsHosted, plausibleDomainsDefault);
  const plausibleDomainsMaybe = plausibleDomains ? { plausibleDomains } : {};

  return { googleAnalyticsId, ...plausibleDomainsMaybe };
};

////////////////////
// Merge branding //
////////////////////

// Generate darker and lighter versions of marketplace color,
// if those values are not set by default.
// Adjusted from https://gist.github.com/xenozauros/f6e185c8de2a04cdfecf
const hexToCssHsl = (hexColor, lightnessDiff) => {
  let hex = hexColor.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h;
  let s;
  let l = (max + min) / 2;

  if (max == min) {
    // achromatic
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${l + lightnessDiff}%)`;
};

const getVariantURL = (socialSharingImage, variantName) => {
  return socialSharingImage?.type === 'imageAsset'
    ? socialSharingImage.attributes.variants[variantName]?.url
    : null;
};

const mergeBranding = (brandingConfig, defaultBranding) => {
  const {
    marketplaceColors,
    logo,
    logoSettings,
    loginBackgroundImage,
    socialSharingImage,
    ...rest
  } = brandingConfig || {};

  const marketplaceColor = marketplaceColors?.mainColor || defaultBranding.marketplaceColor;
  const marketplaceColorDark = marketplaceColor ? hexToCssHsl(marketplaceColor, -10) : null;
  const marketplaceColorLight = marketplaceColor ? hexToCssHsl(marketplaceColor, 10) : null;

  const logoSettingsRaw = logoSettings || defaultBranding.logoSettings;
  const validLogoSettings =
    logoSettingsRaw?.format === 'image' && [24, 36, 48].includes(logoSettingsRaw?.height);

  const facebookImage =
    getVariantURL(socialSharingImage, 'scaled1200') || defaultBranding.facebookImageURL;
  const twitterImage =
    getVariantURL(socialSharingImage, 'scaled600') || defaultBranding.twitterImageURL;

  return {
    marketplaceColor,
    marketplaceColorDark,
    marketplaceColorLight,
    logoSettings: validLogoSettings ? logoSettingsRaw : { format: 'image', height: 24 },
    logoImageDesktop: logo || defaultBranding.logoImageDesktopURL,
    logoImageMobile: logo || defaultBranding.logoImageMobileURL,
    brandImage: loginBackgroundImage,
    facebookImage,
    twitterImage,
    ...rest,
  };
};

///////////////////
// Merge layouts //
///////////////////

const pickVariant = (hostedVariant, defaultVariant) =>
  hostedVariant?.variantType ? hostedVariant : defaultVariant;
const validVariantConfig = (hostedVariant, defaultVariant, validVariantTypes, fallback) => {
  const variant = pickVariant(hostedVariant, defaultVariant);
  const isValidVariant = validVariantTypes.includes(variant?.variantType);

  if (!isValidVariant) {
    console.warn('Unsupported layout option detected', variant);
  }
  if (variant.variantType === 'cropImage') {
    const [w, h] = variant.aspectRatio.split('/') || ['1', '1'];
    const aspectWidth = Number.parseInt(w, 10);
    const aspectHeight = Number.parseInt(h, 10);
    return isValidVariant
      ? { ...variant, aspectWidth, aspectHeight, variantPrefix: defaultVariant.variantPrefix }
      : fallback;
  }

  return isValidVariant ? variant : fallback;
};

const mergeLayouts = (layoutConfig, defaultLayout) => {
  const searchPage = validVariantConfig(
    layoutConfig?.searchPage,
    defaultLayout?.searchPage,
    ['map', 'grid'],
    { variantType: 'grid' }
  );

  const listingPage = validVariantConfig(
    layoutConfig?.listingPage,
    defaultLayout?.listingPage,
    ['coverPhoto', 'carousel'],
    { variantType: 'carousel' }
  );

  const listingImage = validVariantConfig(
    layoutConfig?.listingImage,
    defaultLayout?.listingImage,
    ['cropImage'],
    { variantType: 'cropImage', aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' }
  );

  return {
    searchPage,
    listingPage,
    listingImage,
  };
};

////////////////////////////////////
// Validate listing fields config //
////////////////////////////////////

// Validate enum type strings (if default value is given, value is considered optional)
const validEnumString = (key, value, options, defaultOption) => {
  const isUndefined = typeof value === 'undefined';
  const isValidValue = options.includes(value);
  const isValid = (typeof defaultOption !== 'undefined' && isUndefined) || isValidValue;
  const valueMaybe = isValid ? { [key]: value || defaultOption } : {};
  return [isValid, valueMaybe];
};

// Validate boolean values (if default value is given, value is considered optional)
const validBoolean = (key, value, defaultValue) => {
  const isUndefined = typeof value === 'undefined';
  const isBoolean = typeof value == 'boolean';
  const isValid = (typeof defaultValue !== 'undefined' && isUndefined) || isBoolean;

  const validValue = isBoolean ? { [key]: value } : isValid ? { [key]: defaultValue } : {};
  return [isValid, validValue];
};

const validLabel = label => {
  const isValid = typeof label === 'string';
  const labelMaybe = isValid ? { label } : {};
  return [isValid, labelMaybe];
};

const validKey = (key, allKeys) => {
  const isUniqueKey = allKeys.indexOf(key) === allKeys.lastIndexOf(key);
  return [isUniqueKey, { key }];
};

const validListingTypesForListingConfig = (includeForListingTypes, listingTypesInUse) => {
  const isUndefinedOrNull = includeForListingTypes == null;
  const isArray = Array.isArray(includeForListingTypes);
  const validatedListingTypes = isArray
    ? includeForListingTypes.filter(pa => listingTypesInUse.includes(pa))
    : [];

  const hasValidListingTypes = validatedListingTypes.length > 0;
  const isValid = hasValidListingTypes || isUndefinedOrNull;
  const validValue = hasValidListingTypes
    ? { includeForListingTypes: validatedListingTypes }
    : isUndefinedOrNull
    ? { includeForListingTypes: listingTypesInUse }
    : {};
  return [isValid, validValue];
};

const isStringType = str => typeof str === 'string';
const pickOptionShapes = o => isStringType(o.option) && isStringType(o.label);

const validSchemaOptions = (enumOptions, schemaType) => {
  const isUndefined = typeof enumOptions === 'undefined';
  const isArray = Array.isArray(enumOptions);
  const arrayContainsOptionShapes = isArray
    ? enumOptions.filter(pickOptionShapes).length === enumOptions.length
    : false;
  const shouldHaveSchemaOptions = ['enum', 'multi-enum'].includes(schemaType) && !isUndefined;

  const isValid = isUndefined || shouldHaveSchemaOptions || arrayContainsOptionShapes;
  const schemaOptionsMaybe = isArray ? { enumOptions } : {};
  return [isValid, schemaOptionsMaybe];
};

// listingFieldsConfig.filterConfig
const filterTypes = ['SelectSingleFilter', 'SelectMultipleFilter'];
const validFilterType = (filterType, schemaType) => {
  const isEnumSchemaType = ['enum', 'multi-enum'].includes(schemaType);
  const isUndefined = typeof searchMode === 'undefined';
  const isKnownFilterType = filterTypes.includes(filterType);
  const shouldHaveFilterType = isEnumSchemaType && (isKnownFilterType || isUndefined);
  const isValid = !isEnumSchemaType || shouldHaveFilterType;
  const filterTypeMaybe = shouldHaveFilterType
    ? { filterType: filterType || 'SelectMultipleFilter' }
    : {};
  return [isValid, filterTypeMaybe];
};

const searchModes = ['has_all', 'has_any'];
const validSearchMode = (searchMode, schemaType) => {
  const isMultiEnumSchemaType = schemaType === 'multi-enum';
  const isUndefined = typeof searchMode === 'undefined';
  const hasValidMode = searchModes.includes(searchMode);
  const isSearchModeValid = isMultiEnumSchemaType && (isUndefined || hasValidMode);
  const isValid = !isMultiEnumSchemaType || isSearchModeValid;
  const searchModeMaybe = isSearchModeValid ? { searchMode: searchMode || 'has_all' } : {};
  return [isValid, searchModeMaybe];
};

const validFilterConfig = (config, schemaType) => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: indexForSearch, label, filterType, searchMode, group
  const [isValidIndexForSearch, indexForSearch] = validBoolean(
    'indexForSearch',
    config.indexForSearch,
    false
  );
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidFilterType, filterType] = validFilterType(config.filterType, schemaType);
  const [isValidSearchMode, searchMode] = validSearchMode(config.searchMode, schemaType);
  const groupOptions = ['primary', 'secondary'];
  const [isValidGroup, group] = validEnumString('group', config.group, groupOptions, 'primary');

  const isValid =
    isValidIndexForSearch && isValidLabel && isValidFilterType && isValidSearchMode && isValidGroup;
  const validValue = {
    filterConfig: {
      ...indexForSearch,
      ...label,
      ...filterType,
      ...searchMode,
      ...group,
    },
  };
  return [isValid, validValue];
};

// listingFieldsConfig.showConfig
const validShowConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: label, isDetail.
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidIsDetail, isDetail] = validBoolean('isDetail', config.isDetail, true);

  const isValid = isValidLabel && isValidIsDetail;
  const validValue = {
    showConfig: {
      ...label,
      ...isDetail,
    },
  };
  return [isValid, validValue];
};

// listingFieldsConfig.saveConfig
const validPlaceholderMessage = placeholderMessage => {
  const isUndefined = typeof placeholderMessage === 'undefined';
  const isString = typeof placeholderMessage === 'string';
  const isValid = isUndefined || isString;
  const validValue = isValid ? { placeholderMessage } : {};
  return [isValid, validValue];
};
const validRequiredMessage = requiredMessage => {
  const isUndefined = typeof requiredMessage === 'undefined';
  const isString = typeof requiredMessage === 'string';
  const isValid = isUndefined || isString;
  const validValue = isValid ? { requiredMessage } : {};
  return [isValid, validValue];
};

const validSaveConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: label, placeholderMessage, required, requiredMessage
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidPlaceholder, placeholderMessage] = validPlaceholderMessage(
    config.placeholderMessage
  );
  const [isValidIsRequired, isRequired] = validBoolean('isRequired', config.isRequired, false);
  const [isValidRequiredMessage, requiredMessage] = validRequiredMessage(config.requiredMessage);

  const isValid = isValidLabel && isValidPlaceholder && isValidIsRequired && isValidRequiredMessage;
  const validValue = {
    saveConfig: {
      ...label,
      ...placeholderMessage,
      ...isRequired,
      ...requiredMessage,
    },
  };
  return [isValid, validValue];
};

const validListingFields = (listingFields, listingTypesInUse) => {
  const keys = listingFields.map(d => d.key);
  const scopeOptions = ['public', 'private'];
  const validSchemaTypes = ['enum', 'multi-enum', 'text', 'long', 'boolean'];

  return listingFields.reduce((acc, data) => {
    const schemaType = data.schemaType;

    const validationData = Object.entries(data).reduce(
      (acc, entry) => {
        const [name, value] = entry;

        // Validate each property
        const [isValid, prop] =
          name === 'key'
            ? validKey(value, keys)
            : name === 'scope'
            ? validEnumString('scope', value, scopeOptions, 'public')
            : name === 'includeForListingTypes'
            ? validListingTypesForListingConfig(value, listingTypesInUse)
            : name === 'schemaType'
            ? validEnumString('schemaType', value, validSchemaTypes)
            : name === 'enumOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'filterConfig'
            ? validFilterConfig(value, schemaType)
            : name === 'showConfig'
            ? validShowConfig(value)
            : name === 'saveConfig'
            ? validSaveConfig(value)
            : [true, value];

        const hasFoundValid = !(acc.isValid === false || isValid === false);
        // Let's warn about wrong data in listing extended data config
        if (isValid === false) {
          console.warn(
            `Unsupported listing extended data configurations detected (${name}) in`,
            data
          );
        }

        return { config: { ...acc.config, ...prop }, isValid: hasFoundValid };
      },
      { config: {}, isValid: true }
    );

    if (validationData.isValid) {
      const hasIncludeForListingTypes = validationData.config?.includeForListingTypes;
      const includeForListingTypesMaybe = !hasIncludeForListingTypes
        ? { includeForListingTypes: listingTypesInUse }
        : {};

      return [...acc, { ...validationData.config, ...includeForListingTypesMaybe }];
    } else {
      return acc;
    }
  }, []);
};

///////////////////////////////////
// Validate listing types config //
///////////////////////////////////

const getListingTypeStringsInUse = listingTypes => {
  return listingTypes.map(lt => `${lt.listingType}`);
};

const validListingTypes = listingTypes => {
  // Check what transaction processes this client app supports
  const supportedProcessesInfo = getSupportedProcessesInfo();

  const validTypes = listingTypes.reduce((validConfigs, listingType) => {
    const { listingType: type, label, transactionType, ...restOfListingType } = listingType;
    const { process: processName, alias, unitType, ...restOfTransactionType } = transactionType;

    const isSupportedProcessName = supportedProcessesInfo.find(p => p.name === processName);
    const isSupportedProcessAlias = supportedProcessesInfo.find(p => p.alias === alias);
    const isSupportedUnitType = supportedProcessesInfo.find(p => p.unitTypes.includes(unitType));

    if (isSupportedProcessName && isSupportedProcessAlias && isSupportedUnitType) {
      return [
        ...validConfigs,
        {
          listingType: type,
          label,
          transactionType: {
            process: processName,
            alias,
            unitType,
            ...restOfTransactionType,
          },
          // e.g. stockType
          ...restOfListingType,
        },
      ];
    }
    console.warn('Unsupported listing type configurations detected', listingType);
    return validConfigs;
  }, []);

  return validTypes;
};

export const displayPrice = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.price !== false;
};

///////////////////////////////////////
// Restructure hosted listing config //
///////////////////////////////////////

const restructureListingTypes = hostedListingTypes => {
  return (
    hostedListingTypes?.map(listingType => {
      const { id, label, transactionProcess, unitType, ...rest } = listingType;
      return transactionProcess
        ? {
            listingType: id,
            label,
            transactionType: {
              process: transactionProcess.name,
              alias: transactionProcess.alias,
              unitType,
            },
            ...rest,
          }
        : null;
    }) || []
  );
};

const restructureListingFields = hostedListingFields => {
  return (
    hostedListingFields?.map(listingField => {
      const {
        key,
        scope,
        schemaType,
        enumOptions,
        label,
        filterConfig = {},
        showConfig = {},
        saveConfig = {},
        ...rest
      } = listingField;
      const defaultLabel = label || key;
      const enumOptionsMaybe = ['enum', 'multi-enum'].includes(schemaType) ? { enumOptions } : {};
      const { required: isRequired, ...restSaveConfig } = saveConfig;

      return key
        ? {
            key,
            scope,
            schemaType,
            ...enumOptionsMaybe,
            filterConfig: {
              ...filterConfig,
              label: filterConfig.label || defaultLabel,
            },
            showConfig: {
              ...showConfig,
              label: showConfig.label || defaultLabel,
            },
            saveConfig: {
              ...restSaveConfig,
              isRequired,
              label: saveConfig.label || defaultLabel,
            },
            ...rest,
          }
        : null;
    }) || []
  );
};

///////////////////////////
// Merge listing configs //
///////////////////////////

// Merge 2 arrays and pick only unique objects according to "key" property
// Note: This solution prefers objects from the second array
//       I.e. default configs override hosted asset configs if they have the same key.
const union = (arr1, arr2, key) => {
  const all = [...arr1, ...arr2];
  const map = new Map(all.map(obj => [obj[key], obj]));
  return [...map.values()];
};

// For debugging, it becomes sometimes important to be able to merge and overwrite with local values
// Note: We don't want to expose this to production by default.
//       If you customization relies on multiple listing types or custom listing fields, you need to change this.
const mergeDefaultTypesAndFieldsForDebugging = isDebugging => {
  const isDev = process.env.NODE_ENV === 'development';
  return isDebugging && isDev;
};

// Note: by default, listing types and fields are only merged if explicitly set for debugging
const mergeListingConfig = (hostedConfig, defaultConfigs) => {
  // Listing configuration is splitted to several assets in Console
  const hostedListingTypes = restructureListingTypes(hostedConfig.listingTypes?.listingTypes);
  const hostedListingFields = restructureListingFields(hostedConfig.listingFields?.listingFields);

  // The default values for local debugging
  const { listingTypes: defaultListingTypes, listingFields: defaultListingFields, ...rest } =
    defaultConfigs.listing || {};

  // When debugging, include default configs.
  // Otherwise, use listing types and fields from hosted assets.
  const shouldMerge = mergeDefaultTypesAndFieldsForDebugging(false);
  const listingTypes = shouldMerge
    ? union(hostedListingTypes, defaultListingTypes, 'listingType')
    : hostedListingTypes;
  const listingFields = shouldMerge
    ? union(hostedListingFields, defaultListingFields, 'key')
    : hostedListingFields;

  const listingTypesInUse = getListingTypeStringsInUse(listingTypes);

  return {
    ...rest,
    listingFields: validListingFields(listingFields, listingTypesInUse),
    listingTypes: validListingTypes(listingTypes),
    enforceValidListingType: defaultConfigs.listing.enforceValidListingType,
  };
};

//////////////////////////////
// Validate Default filters //
//////////////////////////////

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

const validDefaultFilters = defaultFilters => {
  return defaultFilters
    .map(data => {
      const schemaType = data.schemaType;
      return schemaType === 'dates'
        ? validDatesConfig(data)
        : schemaType === 'price'
        ? validPriceConfig(data)
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

const mergeSearchConfig = (hostedSearchConfig, defaultSearchConfig) => {
  // The sortConfig is not yet configurable through Console / hosted assets,
  // but other default search configs come from hosted assets
  const searchConfig = hostedSearchConfig?.mainSearch
    ? {
        sortConfig: defaultSearchConfig.sortConfig,
        ...hostedSearchConfig,
      }
    : defaultSearchConfig;

  const { mainSearch, dateRangeFilter, priceFilter, keywordsFilter, sortConfig, ...rest } =
    searchConfig || {};
  const searchType = ['location', 'keywords'].includes(mainSearch?.searchType)
    ? mainSearch?.searchType
    : 'keywords';

  const keywordsFilterMaybe =
    keywordsFilter?.enabled === true
      ? [{ key: 'keywords', schemaType: 'text' }]
      : defaultSearchConfig.keywordsFilter
      ? [defaultSearchConfig.keywordsFilter]
      : [];

  // This will define the order of default filters
  // The reason: later on, we'll add these default filters to config assets and
  // there they'll be their own separate entities and not wrapped in an array.
  const defaultFilters = [dateRangeFilter, priceFilter, ...keywordsFilterMaybe];
  return {
    mainSearch: { searchType },
    defaultFilters: validDefaultFilters(defaultFilters),
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
// Validate and merge map configs //
////////////////////////////////////
const mergeMapConfig = (hostedMapConfig, defaultMapConfig) => {
  const { mapProvider, mapboxAccessToken, googleMapsAPIKey, ...restOfDefault } = defaultMapConfig;
  return {
    ...restOfDefault,
    mapProvider: hostedMapConfig?.provider || mapProvider,
    mapboxAccessToken: hostedMapConfig?.mapboxAccessToken || mapboxAccessToken,
    googleMapsAPIKey: hostedMapConfig?.googleMapsApiKey || googleMapsAPIKey,
  };
};

////////////////////////////////////
// Validate and merge all configs //
////////////////////////////////////

// Check if all the mandatory info have been retrieved from hosted assets
const hasMandatoryConfigs = hostedConfig => {
  const { branding, listingTypes, listingFields, transactionSize } = hostedConfig;
  printErrorIfHostedAssetIsMissing({ branding, listingTypes, listingFields, transactionSize });
  return (
    branding?.logo &&
    listingTypes?.listingTypes &&
    listingFields?.listingFields &&
    transactionSize?.listingMinimumPrice &&
    !hasClashWithBuiltInPublicDataKey(listingFields?.listingFields)
  );
};

export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  // defaultConfigs.listingMinimumPriceSubUnits is the backup for listing's minimum price
  const listingMinimumPriceSubUnits =
    getListingMinimumPrice(configAsset.transactionSize) ||
    defaultConfigs.listingMinimumPriceSubUnits;

  return {
    // Use default configs as a starting point for app config.
    ...defaultConfigs,

    // Overwrite default configs if hosted config is available
    listingMinimumPriceSubUnits,

    // Localization: currency is first-level config atm.
    currency: mergeCurrency(configAsset.localization?.currency, defaultConfigs.currency),
    // Localization (locale, first day of week)
    localization: mergeLocalizations(configAsset.localization, defaultConfigs.localization),

    // Analytics might come from hosted assets at some point.
    analytics: mergeAnalyticsConfig(configAsset.analytics, defaultConfigs.analytics),

    // Branding configuration comes entirely from hosted assets,
    // but defaults to values set in defaultConfigs.branding for
    // marketplace color, logo, brandImage and Facebook and Twitter images
    branding: mergeBranding(configAsset.branding, defaultConfigs.branding),

    // Layout configuration comes entirely from hosted assets,
    // but defaultConfigs is used if type of the hosted configs is unknown
    layout: mergeLayouts(configAsset.layout, defaultConfigs.layout),

    // Listing configuration comes entirely from hosted assets
    listing: mergeListingConfig(configAsset, defaultConfigs),

    // Hosted search configuration does not yet contain sortConfig
    search: mergeSearchConfig(configAsset.search, defaultConfigs.search),

    // Map provider info might come from hosted assets. Other map configs come from defaultConfigs.
    maps: mergeMapConfig(configAsset.maps, defaultConfigs.maps),

    // Google Site Verification can be given through configs.
    // Renders a meta tag: <meta name="google-site-verification" content="[token-here]>" />
    googleSearchConsole: configAsset.googleSearchConsole?.googleSiteVerification
      ? configAsset.googleSearchConsole
      : defaultConfigs.googleSearchConsole,

    // Include hosted footer config, if it exists
    // Note: if footer asset is not set, Footer is not rendered.
    footer: configAsset.footer,

    // Check if all the mandatory info have been retrieved from hosted assets
    hasMandatoryConfigurations: hasMandatoryConfigs(configAsset),
  };
};
