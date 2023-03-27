import { getSupportedProcessesInfo } from '../transactions/transaction';

// Generic helpers for validating config values

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

const mergeBranding = (brandingConfig, defaultBranding) => {
  const marketplaceColor = brandingConfig?.marketplaceColor || defaultBranding.marketplaceColor;
  const marketplaceColorDark =
    brandingConfig?.marketplaceColorDark ||
    defaultBranding.marketplaceColorDark ||
    (marketplaceColor ? hexToCssHsl(marketplaceColor, -10) : null);
  const marketplaceColorLight =
    brandingConfig?.marketplaceColorLight ||
    defaultBranding.marketplaceColorLight ||
    (marketplaceColor ? hexToCssHsl(marketplaceColor, 10) : null);

  return {
    marketplaceColor,
    marketplaceColorDark,
    marketplaceColorLight,
    logoImageDesktopURL: brandingConfig?.logoImageDesktopURL || defaultBranding.logoImageDesktopURL,
    logoImageMobileURL: brandingConfig?.logoImageMobileURL || defaultBranding.logoImageMobileURL,
    brandImageURL: brandingConfig?.brandImageURL || defaultBranding.brandImageURL,
    facebookImageURL: brandingConfig?.facebookImageURL || defaultBranding.facebookImageURL,
    twitterImageURL: brandingConfig?.twitterImageURL || defaultBranding.twitterImageURL,
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
    return isValidVariant ? { ...variant, aspectWidth, aspectHeight } : fallback;
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

  const aspectWidth =
    layoutConfig?.listingImage?.aspectWidth || defaultLayout?.listingImage?.aspectWidth;
  const aspectHeight =
    layoutConfig?.listingImage?.aspectHeight || defaultLayout?.listingImage?.aspectHeight;

  return {
    searchPage,
    listingPage,
    listingImage,
  };
};

/////////////////////////////
// Validate listing config //
/////////////////////////////

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

const validListingConfig = config => {
  const { enforceValidListingType, listingTypes = [], listingFields = [], ...rest } = config;
  const listingTypesInUse = getListingTypeStringsInUse(listingTypes);

  return {
    listingFields: validListingFields(listingFields, listingTypesInUse),
    listingTypes: validListingTypes(listingTypes),
    enforceValidListingType,
    rest,
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
  const options = optionsRaw.filter(o => !!o.key && !!o.label);
  return { active, queryParamName, relevanceKey, relevanceFilter, conflictingFilters, options };
};

const validSearchConfig = config => {
  const { mainSearch, dateRangeFilter, priceFilter, keywordsFilter, sortConfig, ...rest } =
    config || {};
  const searchType = ['location', 'keywords'].includes(mainSearch?.searchType)
    ? mainSearch?.searchType
    : 'keywords';
  const keywordsFilterMaybe = keywordsFilter ? [keywordsFilter] : [];

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

////////////////////////////////////
// Validate and merge all configs //
////////////////////////////////////

export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  return {
    ...defaultConfigs,
    branding: mergeBranding(configAsset.branding, defaultConfigs.branding),
    layout: mergeLayouts(configAsset.layout, defaultConfigs.layout),

    // TODO: defaultConfigs.listing probably needs to be removed, when config is fetched from assets.
    listing: validListingConfig(configAsset.listing || defaultConfigs.listing),
    // TODO: defaultConfigs.search probably needs to be removed, when config is fetched from assets.
    search: validSearchConfig(configAsset.search || defaultConfigs.search),
  };
};
