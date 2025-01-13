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

// Functions to create built-in specs for category setup.
const depthFirstSearch = (category, iterator, depth = 0) => {
  const { subcategories = [] } = category;
  return iterator(depth, subcategories.map(cat => depthFirstSearch(cat, iterator, depth + 1)));
};
// Pick maximum depth from subcategories or default to given depth parameter
const getMaxDepth = (depth, subcategories) =>
  subcategories.length ? Math.max(...subcategories) : depth;
const createArray = length => [...Array(length)].fill(null).map((_, i) => i + 1);

/**
 * Returns the fixed/built-in configs. Marketplace API has specified search schema for
 * categoryLevel1, categoryLevel2, categoryLevel3
 *
 * @param {Array} categories config from listing-categories.json asset
 * @returns object-literal containing fixed key and array of extended data keys used with nested categories.
 */
const getBuiltInCategorySpecs = (categories = []) => {
  // Don't change! The search schema is fixed to categoryLevel1, categoryLevel2, categoryLevel3
  const key = 'categoryLevel';
  const maxDepth = depthFirstSearch({ subcategories: categories }, getMaxDepth);
  const categoryLevelKeys = createArray(maxDepth).map(i => `${key}${i}`);

  return { key, scope: 'public', categoryLevelKeys, categories };
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
    'categoryLevel1',
    'categoryLevel2',
    'categoryLevel3',
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

/**
 * This ensures that accessControl config has private marketplace flag in place.
 *
 * @param {Object} accessControlConfig (returned by access-control.json)
 * @returns {Object} accessControl config
 */
const validAccessControl = accessControlConfig => {
  const accessControl = accessControlConfig || {};
  const marketplace = accessControl?.marketplace || {};
  return { ...accessControl, marketplace: { private: false, ...marketplace } };
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

  // The 'marketplaceColor' has a special status for branding. Other colors are just prefixed with "color".
  const colorPrimaryButton = marketplaceColors?.primaryButton;
  const colorPrimaryButtonDark = colorPrimaryButton ? hexToCssHsl(colorPrimaryButton, -10) : null;
  const colorPrimaryButtonLight = colorPrimaryButton ? hexToCssHsl(colorPrimaryButton, 10) : null;

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
    colorPrimaryButton,
    colorPrimaryButtonDark,
    colorPrimaryButtonLight,
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

// TODO: this (includeForListingTypes) is deprecated config key!
// You should change your buil-in listing field configs:
// do not use includeForListingTypes but listingTypeConfig: { limitToListingTypeIds, listingTypeIds }
const validListingTypesForBuiltInSetup = (includeForListingTypes, listingTypesInUse) => {
  const isUndefinedOrNull = includeForListingTypes == null;
  const isArray = Array.isArray(includeForListingTypes);
  const validatedListingTypes = isArray
    ? includeForListingTypes.filter(pa => listingTypesInUse.includes(pa))
    : [];

  const hasValidListingTypes = validatedListingTypes.length > 0;
  const isValid = hasValidListingTypes || isUndefinedOrNull;
  const validValue = hasValidListingTypes
    ? { listingTypeConfig: { limitToListingTypeIds: true, listingTypeIds: validatedListingTypes } }
    : isUndefinedOrNull
    ? { listingTypeConfig: { limitToListingTypeIds: false } }
    : {};
  return [isValid, validValue];
};

const validListingTypesForListingTypeConfig = (listingTypeConfig, listingTypesInUse) => {
  const { limitToListingTypeIds, listingTypeIds } = listingTypeConfig || {};

  // When no user types are in use, fields by default cannot be limited to a subset of types
  if (!listingTypesInUse) {
    const isValid = true;
    const validValue = {
      listingTypeConfig: {
        limitToListingTypeIds: false,
      },
    };

    return [isValid, validValue];
  }

  const isArray = Array.isArray(listingTypeIds);
  const validatedListingTypeIds = isArray
    ? listingTypeIds.filter(c => listingTypesInUse?.includes(c))
    : [];

  // If a field is limited to user type ids, it has to have at least one valid type
  const hasValidListingTypeIds = validatedListingTypeIds.length > 0;
  const isValid = hasValidListingTypeIds || !limitToListingTypeIds;

  const validValue = hasValidListingTypeIds
    ? {
        listingTypeConfig: {
          limitToListingTypeIds,
          listingTypeIds: validatedListingTypeIds,
        },
      }
    : { listingTypeConfig: { limitToListingTypeIds: false } };
  return [isValid, validValue];
};

const getCategoryIds = categories => {
  return categories.reduce((picked, conf) => {
    const { id, subcategories } = conf;
    return Array.isArray(subcategories) && subcategories.length > 0
      ? [...picked, id, ...getCategoryIds(subcategories)]
      : [...picked, id];
  }, []);
};

const validListingTypesForCategoryConfig = (categoryConfig, categoriesInUse) => {
  const { limitToCategoryIds, categoryIds } = categoryConfig || {};

  // When no user types are in use, fields by default cannot be limited to a subset of types
  if (!categoriesInUse) {
    const isValid = true;
    const validValue = {
      categoryConfig: {
        limitToCategoryIds: false,
      },
    };

    return [isValid, validValue];
  }

  const validCategoryIds = getCategoryIds(categoriesInUse);
  const isArray = Array.isArray(categoryIds);
  const validatedCategoryIds = isArray
    ? categoryIds.filter(c => validCategoryIds?.includes(c))
    : [];

  // If a field is limited to user type ids, it has to have at least one valid type
  const hasValidCategoryIds = validatedCategoryIds.length > 0;
  const isValid = hasValidCategoryIds || !limitToCategoryIds;

  const validValue = hasValidCategoryIds
    ? {
        categoryConfig: {
          limitToCategoryIds,
          categoryIds: validatedCategoryIds,
        },
      }
    : { categoryConfig: { limitToCategoryIds: false } };
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
  const isEnumSchemaType = ['enum', 'multi-enum'].includes(schemaType);
  const shouldHaveSchemaOptions = isEnumSchemaType && !isUndefined && enumOptions.length > 0;

  const isValid = !isEnumSchemaType || (shouldHaveSchemaOptions && arrayContainsOptionShapes);

  const schemaOptionsMaybe =
    isEnumSchemaType && isArray ? { enumOptions } : isEnumSchemaType ? { enumOptions: [] } : {};

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
  const [isValidUnselectedOptions, unselectedOptions] = validBoolean(
    'unselectedOptions',
    config.unselectedOptions,
    true
  );

  const isValid = isValidLabel && isValidIsDetail && isValidUnselectedOptions;
  const validValue = {
    showConfig: {
      ...label,
      ...isDetail,
      ...unselectedOptions,
    },
  };
  return [isValid, validValue];
};

// numberConfig is passed along with listing fields that use the schema type `long`
const validNumberConfig = config => {
  const { minimum, maximum } = config;
  const integerConfig = { minimum, maximum, step: 1 };

  // Check if both minimum and maximum are integers
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum)) {
    return [false, integerConfig];
  }

  // Ensure both values are within the safe integer range
  if (
    minimum < Number.MIN_SAFE_INTEGER ||
    minimum > Number.MAX_SAFE_INTEGER ||
    maximum < Number.MIN_SAFE_INTEGER ||
    maximum > Number.MAX_SAFE_INTEGER
  ) {
    return [false, integerConfig];
  }

  // Check that the maximum is greater than the minimum
  if (maximum <= minimum) {
    return [false, integerConfig];
  }
  return [true, integerConfig];
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

const validListingFields = (listingFields, listingTypesInUse, categoriesInUse) => {
  const keys = listingFields.map(d => d.key);
  const scopeOptions = ['public', 'private'];
  const validSchemaTypes = ['enum', 'multi-enum', 'text', 'long', 'boolean', 'youtubeVideoUrl'];

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
            : name === 'numberConfig'
            ? validNumberConfig(value)
            : name === 'includeForListingTypes'
            ? validListingTypesForBuiltInSetup(value, listingTypesInUse)
            : name === 'listingTypeConfig'
            ? validListingTypesForListingTypeConfig(value, listingTypesInUse)
            : name === 'categoryConfig'
            ? validListingTypesForCategoryConfig(value, categoriesInUse)
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
            : [true, { [name]: value }];

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
      return [...acc, validationData.config];
    } else {
      return acc;
    }
  }, []);
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
  const validSchemaTypes = ['enum', 'multi-enum', 'text', 'long', 'boolean', 'youtubeVideoUrl'];

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
            ? validEnumString('schemaType', value, validSchemaTypes)
            : name === 'enumOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'showConfig'
            ? validUserShowConfig(value)
            : name === 'userTypeConfig'
            ? validUserTypesForUserConfig(value, userTypesInUse)
            : name === 'saveConfig'
            ? validUserSaveConfig(value)
            : [true, value];

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

///////////////////////////////////
// Validate listing types config //
///////////////////////////////////

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

export const displayLocation = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.location !== false;
};

export const displayDeliveryPickup = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.pickup !== false;
};

export const displayDeliveryShipping = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.shipping !== false;
};

export const requirePayoutDetails = listingTypeConfig => {
  return listingTypeConfig?.defaultListingFields?.payoutDetails !== false;
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
        numberConfig = {},
        categoryConfig = {},
        ...rest
      } = listingField;
      const defaultLabel = label || key;
      const enumOptionsMaybe = ['enum', 'multi-enum'].includes(schemaType) ? { enumOptions } : {};
      const numberConfigMaybe = schemaType === 'long' ? { numberConfig } : {};
      const { required: isRequired, ...restSaveConfig } = saveConfig;

      return key
        ? {
            key,
            scope,
            schemaType,
            ...enumOptionsMaybe,
            ...numberConfigMaybe,
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
            categoryConfig,
            ...rest,
          }
        : null;
    }) || []
  );
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

///////////////////////////
// Merge category config //
///////////////////////////

// The expected structure of the category configuration should be an object with a 'categories' key,
// where 'categories' is an array containing objects representing different categories. Each category object should have:
//   - 'name': A string representing the name of the category.
//   - 'id': A string representing the unique identifier of the category.
//   - 'subcategories': An array containing objects representing subcategories within the category (can also be an empty array).
// Each subcategory object should have:
//   - 'name': A string representing the name of the subcategory.
//   - 'id': A string representing the unique identifier of the subcategory.
//   - 'subcategories': (optional) An array of subcategories following the same structure as above,
//    allowing for nesting of subcategories.
// Example structure:
// {
//   categories: [
//     {
//       name: 'Cats',
//       id: 'cats',
//       subcategories: [
//         { name: 'Burmese', id: 'burmese' },
//         { name: 'Egyptian Mau', id: 'egyptian-mau' },
//         // Additional subcategories can be added here, including nested subcategories if needed.
//       ],
//     },
//     // Additional categories can be added here.
//   ],
// }
const validateCategoryConfig = hostedConfig => {
  const validateData = data => {
    if (!data || !data.categories || !Array.isArray(data.categories)) {
      return {};
    }

    return {
      categories: data.categories.map(({ name, id, subcategories }) => ({
        name,
        id,
        subcategories: validateSubcategories(subcategories),
      })),
    };
  };

  const validateSubcategories = subcategories => {
    if (!subcategories || !Array.isArray(subcategories)) {
      return [];
    }

    return subcategories.map(({ name, id, subcategories }) => ({
      name,
      id,
      subcategories: validateSubcategories(subcategories),
    }));
  };
  return validateData(hostedConfig).categories;
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
const mergeListingConfig = (hostedConfig, defaultConfigs, categoriesInUse) => {
  // Listing configuration is splitted to several assets in Console
  const hostedListingTypes = restructureListingTypes(hostedConfig.listingTypes?.listingTypes);
  const hostedListingFields = restructureListingFields(hostedConfig.listingFields?.listingFields);

  // The default values for local debugging
  const { listingTypes: defaultListingTypes, listingFields: defaultListingFields, ...rest } =
    defaultConfigs.listing || {};

  // When debugging, include default configs by passing 'true' here.
  // Otherwise, use listing types and fields from hosted assets.
  const shouldMerge = mergeDefaultTypesAndFieldsForDebugging(false);
  const listingTypes = shouldMerge
    ? union(hostedListingTypes, defaultListingTypes, 'listingType')
    : hostedListingTypes;
  const listingFields = shouldMerge
    ? union(hostedListingFields, defaultListingFields, 'key')
    : hostedListingFields;

  const listingTypesInUse = listingTypes.map(lt => `${lt.listingType}`);

  return {
    ...rest,
    listingFields: validListingFields(listingFields, listingTypesInUse, categoriesInUse),
    listingTypes: validListingTypes(listingTypes),
    enforceValidListingType: defaultConfigs.listing.enforceValidListingType,
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

const validKeywordsConfig = config => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  return { key: 'keywords', schemaType: 'keywords' };
};

const validDefaultFilters = (defaultFilters, categoryConfiguration) => {
  return defaultFilters
    .map(data => {
      const schemaType = data.schemaType;
      return schemaType === 'category'
        ? validCategoryConfig(data, categoryConfiguration)
        : schemaType === 'dates'
        ? validDatesConfig(data)
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

const mergeSearchConfig = (hostedSearchConfig, defaultSearchConfig, categoryConfiguration) => {
  // The sortConfig is not yet configurable through Console / hosted assets,
  // but other default search configs come from hosted assets
  const searchConfig = hostedSearchConfig?.mainSearch
    ? {
        sortConfig: defaultSearchConfig.sortConfig,
        ...hostedSearchConfig,
      }
    : defaultSearchConfig;

  const {
    mainSearch,
    categoryFilter,
    dateRangeFilter,
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

  // This will define the order of default filters
  // The reason: These default filters come from config assets and
  // there they'll be their own separate entities and not wrapped in an array.
  // Note: The category filter might affect the visibility of custom filters (listing fields).
  //       It might be somewhat strange experience if a primary filter is among those filters
  //       that are affected by category selection.
  const defaultFilters = [
    ...categoryFilterMaybe,
    dateRangeFilter,
    priceFilter,
    ...keywordsFilterMaybe,
  ];
  return {
    mainSearch: { searchType },
    defaultFilters: validDefaultFilters(defaultFilters, categoryConfiguration),
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
  const mapProviderPicked = hostedMapConfig?.provider || mapProvider;
  const mapboxAccessTokenPicked = hostedMapConfig?.mapboxAccessToken || mapboxAccessToken;
  const googleMapsAPIKeyPicked = hostedMapConfig?.googleMapsApiKey || googleMapsAPIKey;

  const hasApiAccess =
    mapProviderPicked === 'googleMaps' ? !!googleMapsAPIKeyPicked : !!mapboxAccessTokenPicked;
  if (!hasApiAccess) {
    console.error(
      `The access tokens are not in place for the selected map provider (${mapProviderPicked})`
    );
  }

  return {
    ...restOfDefault,
    mapProvider: mapProviderPicked,
    mapboxAccessToken: mapboxAccessTokenPicked,
    googleMapsAPIKey: googleMapsAPIKeyPicked,
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
    listingTypes?.listingTypes?.length > 0 &&
    listingFields?.listingFields &&
    transactionSize?.listingMinimumPrice &&
    !hasClashWithBuiltInPublicDataKey(listingFields?.listingFields)
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

  const validHostedCategories = validateCategoryConfig(configAsset.categories);
  const categoryConfiguration = getBuiltInCategorySpecs(validHostedCategories);

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

    // Analytics might come from hosted assets at some point.
    analytics: mergeAnalyticsConfig(configAsset.analytics, defaultConfigs.analytics),

    // Branding configuration comes entirely from hosted assets,
    // but defaults to values set in defaultConfigs.branding for
    // marketplace color, logo, brandImage and Facebook and Twitter images
    branding: mergeBranding(configAsset.branding, defaultConfigs.branding),

    // Layout configuration comes entirely from hosted assets,
    // but defaultConfigs is used if type of the hosted configs is unknown
    layout: mergeLayouts(configAsset.layout, defaultConfigs.layout),

    // User configuration comes entirely from hosted assets by default.
    user: mergeUserConfig(configAsset, defaultConfigs),

    // Set category configuration (includes fixed key, array of categories etc.
    categoryConfiguration,

    // Listing configuration comes entirely from hosted assets by default.
    listing: mergeListingConfig(configAsset, defaultConfigs, validHostedCategories),

    // Hosted search configuration does not yet contain sortConfig
    search: mergeSearchConfig(configAsset.search, defaultConfigs.search, categoryConfiguration),

    // Map provider info might come from hosted assets. Other map configs come from defaultConfigs.
    maps: mergeMapConfig(configAsset.maps, defaultConfigs.maps),

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
  };
};
