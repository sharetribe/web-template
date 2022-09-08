import { createContext, useContext } from 'react';

///////////////////
// Merge layouts //
///////////////////
const mergeLayouts = (layoutConfig, defaultLayout) => {
  const isValidSearchPageConfig = ['map', 'list'].includes(layoutConfig?.searchPageVariant);
  const isValidListingPageConfig = ['hero-image', 'full-image'].includes(
    layoutConfig?.listingPageVariant
  );

  return {
    searchPageVariant: isValidSearchPageConfig
      ? layoutConfig?.searchPageVariant
      : defaultLayout.searchPageVariant,
    listingPageVariant: isValidListingPageConfig
      ? layoutConfig?.listingPageVariant
      : defaultLayout.listingPageVariant,
    listingImage: {
      aspectWidth:
        layoutConfig?.listingImage?.aspectWidth || defaultLayout?.listingImage?.aspectWidth,
      aspectHeight:
        layoutConfig?.listingImage?.aspectHeight || defaultLayout?.listingImage?.aspectHeight,
      variantPrefix: defaultLayout.variantPrefix,
    },
  };
};

///////////////////
// Merge listing //
///////////////////
const validKey = (key, allKeys) => {
  const isUniqueKey = allKeys.indexOf(key) === allKeys.lastIndexOf(key);
  return [isUniqueKey, { key }];
};

const validScope = scope => {
  const isValid = ['public', 'private'].includes(scope) || typeof scope === 'undefined';
  const validScope = isValid ? scope : 'public';
  return [isValid, { scope: validScope }];
};

const validProcessAliases = (includeForProcessAliases, processAliasesInUse) => {
  const isUndefined = typeof includeForProcessAliases === 'undefined';
  const isArray = Array.isArray(includeForProcessAliases);
  const validatedProcessAliases = isArray
    ? includeForProcessAliases.filter(pa => processAliasesInUse.includes(pa))
    : [];

  const hasValidProcessAliases = validatedProcessAliases.length >= 0;
  const isValid = hasValidProcessAliases || isUndefined;
  const validValue = hasValidProcessAliases ? validatedProcessAliases : processAliasesInUse;
  return [isValid, { includeForProcessAliases: validValue }];
};

const validSchemaTypes = ['enum', 'multi-enum', 'text', 'long', 'boolean'];
const validSchemaType = schemaType => {
  const isValid = validSchemaTypes.includes(schemaType);
  const schemaTypeMaybe = isValid ? { schemaType } : {};
  return [isValid, schemaTypeMaybe];
};

const validSchemaOptions = (schemaOptions, schemaType) => {
  const isUndefined = typeof schemaOptions === 'undefined';
  const isArray = Array.isArray(schemaOptions);
  const shouldHaveSchemaOptions = ['enum', 'multi-enum'].includes(schemaType) && !isUndefined;
  const isValid = isUndefined || shouldHaveSchemaOptions;
  const schemaOptionsMaybe = isArray ? { schemaOptions } : {};
  return [isValid, schemaOptionsMaybe];
};

const validIndexForSearch = indexForSearch => {
  const isValid = typeof indexForSearch == 'boolean';
  const validIndexForSearch = isValid ? { indexForSearch } : {};
  return [isValid, validIndexForSearch];
};

// searchPageConfig
const validLabel = label => {
  const isValid = typeof label === 'string';
  const labelMaybe = isValid ? { label } : {};
  return [isValid, labelMaybe];
};

const validFilterType = (filterType, schemaType) => {
  const isEnumSchemaType = ['enum', 'multi-enum'].includes(schemaType);
  const shouldHaveFilterType =
    isEnumSchemaType && ['SelectSingleFilter', 'SelectMultipleFilter'].includes(filterType);
  const isValid = !isEnumSchemaType || shouldHaveFilterType;
  const filterTypeMaybe = shouldHaveFilterType ? { filterType } : {};
  return [isValid, filterTypeMaybe];
};

const validSearchMode = (searchMode, schemaType) => {
  const isMultiEnumSchemaType = schemaType === 'multi-enum';
  const isUndefined = typeof searchMode === 'undefined';
  const hasValidMode = ['has_all', 'has_any'].includes(searchMode);
  const isSearchModeValid = isMultiEnumSchemaType && (isUndefined || hasValidMode);
  const isValid = !isMultiEnumSchemaType || isSearchModeValid;

  const searchModeMaybe = isSearchModeValid ? { searchMode: searchMode || 'has_all' } : {};
  return [isValid, searchModeMaybe];
};

const validGroup = group => {
  const isUndefined = typeof group === 'undefined';
  const isValidGroupValue = ['primary', 'secondary'].includes(group);
  const isValid = isUndefined || isValidGroupValue;
  const groupMaybe = isValid ? { group: group || 'primary' } : {};
  return [isValid, groupMaybe];
};

const validSearchPageConfig = (searchPageConfig, schemaType) => {
  const isUndefined = typeof searchPageConfig === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // filterType, label, searchMode, group
  const [isValidLabel, label] = validLabel(searchPageConfig.label);
  const [isValidFilterType, filterType] = validFilterType(searchPageConfig.filterType);
  const [isValidSearchMode, searchMode] = validSearchMode(searchPageConfig.searchMode, schemaType);
  const [isValidGroup, group] = validGroup(searchPageConfig.searchMode, schemaType);

  const isValid = isValidLabel && isValidFilterType && isValidSearchMode && isValidGroup;
  const validValue = {
    searchPageConfig: {
      ...label,
      ...filterType,
      ...searchMode,
      ...group,
    },
  };
  return [isValid, validValue];
};

// listingPageConfig
const validIsDetail = isDetail => {
  const isUndefined = typeof isDetail === 'undefined';
  const isBoolean = typeof isDetail == 'boolean';
  const isValid = isUndefined || isBoolean;

  const validValue = isValid ? { isDetail: isDetail || true } : {};
  return [isValid, validValue];
};

const validListingPageConfig = (listingPageConfig, schemaType) => {
  const isUndefined = typeof listingPageConfig === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Currently, only label is relevant.
  const [isValidLabel, label] = validLabel(listingPageConfig.label);
  const [isValidIsDetail, isDetail] = validIsDetail(listingPageConfig.isDetail);

  const isValid = isValidLabel && isValidIsDetail;
  const validValue = {
    listingPageConfig: {
      ...label,
      ...isDetail,
    },
  };
  return [isValid, validValue];
};

// editListingPageConfig
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
const validIsRequired = isRequired => {
  const isUndefined = typeof isRequired === 'undefined';
  const isBoolean = typeof isRequired == 'boolean';
  const isValid = isUndefined || isBoolean;

  const validValue = isValid ? { isRequired: isRequired || false } : {};
  return [isValid, validValue];
};

const validEditListingPageConfig = (editListingPageConfig, schemaType) => {
  const isUndefined = typeof editListingPageConfig === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // label, placeholderMessage, required, requiredMessage
  const [isValidLabel, label] = validLabel(editListingPageConfig.label);
  const [isValidPlaceholderMessage, placeholderMessage] = validPlaceholderMessage(
    editListingPageConfig.placeholderMessage
  );
  const [isValidIsRequired, isRequired] = validIsRequired(editListingPageConfig.isRequired);
  const [isValidRequiredMessage, requiredMessage] = validRequiredMessage(
    editListingPageConfig.requiredMessage
  );

  const isValid =
    isValidLabel && isValidPlaceholderMessage && isValidIsRequired && isValidRequiredMessage;
  const validValue = {
    editListingPageConfig: {
      ...label,
      ...placeholderMessage,
      ...isRequired,
      ...requiredMessage,
    },
  };
  return [isValid, validValue];
};

const validListingExtendedData = (listingExtendedData, processAliasesInUse) => {
  const keys = listingExtendedData.map(d => d.key);
  return listingExtendedData.reduce((acc, data) => {
    const [isValidKey, key] = validKey(data.key, keys);
    const [isValidScope, scope] = validScope(data.scope);
    const [isValidProcessAliases, includeForProcessAliases] = validProcessAliases(
      data.includeForProcessAliases,
      processAliasesInUse
    );
    const [isValidSchemaType, schemaType] = validSchemaType(data.schemaType);
    const [isValidSchemaOptions, schemaOptions] = validSchemaOptions(
      data.schemaOptions,
      data.schemaType
    );
    const [isValidIndexForSearch, indexForSearch] = validIndexForSearch(data.indexForSearch);
    const [isValidSearchPageConfig, searchPageConfig] = validSearchPageConfig(
      data.searchPageConfig
    );
    const [isValidListingPageConfig, listingPageConfig] = validListingPageConfig(
      data.listingPageConfig
    );
    const [isValidEditListingPageConfig, editListingPageConfig] = validEditListingPageConfig(
      data.editListingPageConfig,
      data.schemaType
    );

    if (
      isValidKey &&
      isValidScope &&
      isValidProcessAliases &&
      isValidSchemaType &&
      isValidSchemaOptions &&
      isValidIndexForSearch &&
      isValidSearchPageConfig &&
      isValidListingPageConfig &&
      isValidEditListingPageConfig
    ) {
      return [
        ...acc,
        {
          ...key,
          ...scope,
          ...includeForProcessAliases,
          ...schemaType,
          ...schemaOptions,
          ...indexForSearch,
          ...searchPageConfig,
          ...listingPageConfig,
          ...editListingPageConfig,
        },
      ];
    } else {
      return acc;
    }
  }, []);
};

const validListingConfig = (config, processAliasesInUse) => {
  const listingExtendedData = config?.listingExtendedData || [];
  return {
    listingExtendedData: validListingExtendedData(listingExtendedData, processAliasesInUse),
  };
};

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

const validSortConfig = config => {
  const active = typeof config.active === 'boolean' ? config.active : true;
  const queryParamName = config.queryParamName || 'sort';
  const relevanceKey = config.relevanceKey || 'relevance';
  const relevanceFilter = config.relevanceFilter || 'keywords';
  const conflictingFilters = config.conflictingFilters || [];
  const optionsRaw = config.options || [];
  const options = optionsRaw.filter(o => !!o.key && !!o.label);
  return {
    active,
    queryParamName,
    relevanceKey,
    relevanceFilter,
    conflictingFilters,
    options,
  };
};

const validSearchConfig = config => {
  const { defaultFilters, sortConfig } = config || {};

  return {
    defaultFilters: validDefaultFilters(defaultFilters),
    sortConfig: validSortConfig(sortConfig),
  };
};

////////////////////
// Combine merges //
////////////////////
export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  return {
    ...configAsset,
    ...defaultConfigs,
    layout: mergeLayouts(configAsset.layout, defaultConfigs.layout),

    // TODO: defaultConfigs.listing probably needs to be removed, when config is fetched from assets.
    listing: validListingConfig(configAsset.listing || defaultConfigs.listing, [
      'flex-product-default-process/release-1',
      'flex-booking-default-process/release-1',
    ]),
    // TODO: defaultConfigs.search probably needs to be removed, when config is fetched from assets.
    search: validSearchConfig(configAsset.search || defaultConfigs.search),
  };
};

export const ConfigurationContext = createContext();

export const ConfigurationProvider = ConfigurationContext.Provider;

export const useConfiguration = () => {
  return useContext(ConfigurationContext);
};
