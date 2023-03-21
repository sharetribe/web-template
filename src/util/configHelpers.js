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

const mergeLayouts = (layoutConfig, defaultLayout) => {
  const searchPageVariant = layoutConfig?.searchPageVariant || defaultLayout.searchPageVariant;
  const listingPageVariant = layoutConfig?.listingPageVariant || defaultLayout.listingPageVariant;
  const aspectWidth =
    layoutConfig?.listingImage?.aspectWidth || defaultLayout?.listingImage?.aspectWidth;
  const aspectHeight =
    layoutConfig?.listingImage?.aspectHeight || defaultLayout?.listingImage?.aspectHeight;

  const isValidSearchPageVariant = ['map', 'list'].includes(searchPageVariant);
  const isValidListingPageVariant = ['hero-image', 'full-image'].includes(listingPageVariant);

  if (!isValidSearchPageVariant) {
    console.warn('Unsupported layout option for search page detected', searchPageVariant);
  } else if (!isValidListingPageVariant) {
    console.warn('Unsupported layout option for listing page detected', listingPageVariant);
  }

  return {
    searchPageVariant: isValidSearchPageVariant ? searchPageVariant : 'list',
    listingPageVariant: isValidListingPageVariant ? listingPageVariant : 'full-image',
    listingImage: {
      aspectWidth: aspectWidth || 1,
      aspectHeight: aspectHeight || 1,
      variantPrefix: defaultLayout.listingImage.variantPrefix,
    },
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

// listingExtendedDataConfig.filterConfig
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

// listingExtendedDataConfig.showConfig
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

// listingExtendedDataConfig.saveConfig
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

const validListingExtendedData = (listingExtendedData, listingTypesInUse) => {
  const keys = listingExtendedData.map(d => d.key);
  const scopeOptions = ['public', 'private'];
  const validSchemaTypes = ['enum', 'multi-enum', 'text', 'long', 'boolean'];

  return listingExtendedData.reduce((acc, data) => {
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
  const { enforceValidListingType, listingTypes = [], listingExtendedData = [], ...rest } = config;
  const listingTypesInUse = getListingTypeStringsInUse(listingTypes);

  return {
    listingExtendedData: validListingExtendedData(listingExtendedData, listingTypesInUse),
    listingTypes: validListingTypes(listingTypes),
    enforceValidListingType,
    rest,
  };
};

//////////////////////////////
// Validate Default filters //
//////////////////////////////

const validDatesConfig = config => {
  const label = typeof config.label === 'string' ? config.label : 'Dates';
  const entireRangeAvailable =
    typeof config.entireRangeAvailable === 'boolean' ? config.entireRangeAvailable : true;
  const mode = ['day', 'night'].includes(config.mode) ? config.mode : 'day';
  return { key: 'dates', schemaType: 'dates', label, entireRangeAvailable, mode };
};

const validPriceConfig = config => {
  const label = typeof config.label === 'string' ? config.label : 'Price';
  const min = typeof config.min === 'number' ? config.min : 0;
  const max = typeof config.max === 'number' ? config.max : 1000;
  const step = typeof config.step === 'number' ? config.step : 5;
  return { key: 'price', schemaType: 'price', label, min, max, step };
};

const validDefaultFilters = defaultFilters => {
  return defaultFilters.filter(data => {
    const key = data.key;
    return key === 'dates'
      ? validDatesConfig(data)
      : key === 'price'
      ? validPriceConfig(data)
      : data;
  });
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
  const { mainSearchType: mainSearchTypeRaw, defaultFilters, sortConfig, ...rest } = config || {};
  const mainSearchType = ['location', 'keywords'].includes(mainSearchTypeRaw)
    ? mainSearchTypeRaw
    : 'keywords';

  return {
    mainSearchType,
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
