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

  const isValidSearchPageConfig = ['map', 'list'].includes(searchPageVariant);
  const isValidListingPageConfig = ['hero-image', 'full-image'].includes(listingPageVariant);

  if (!isValidSearchPageConfig) {
    console.warn('Unsupported layout option for search page detected', searchPageVariant);
  } else if (!isValidListingPageConfig) {
    console.warn('Unsupported layout option for listing page detected', listingPageVariant);
  }

  return {
    searchPageVariant: isValidSearchPageConfig ? searchPageVariant : 'list',
    listingPageVariant: isValidListingPageConfig ? listingPageVariant : 'full-image',
    listingImage: {
      aspectWidth: aspectWidth || 1,
      aspectHeight: aspectHeight || 1,
      variantPrefix: defaultLayout.variantPrefix,
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

const validSchemaOptions = (schemaOptions, schemaType) => {
  const isUndefined = typeof schemaOptions === 'undefined';
  const isArray = Array.isArray(schemaOptions);
  const shouldHaveSchemaOptions = ['enum', 'multi-enum'].includes(schemaType) && !isUndefined;
  const isValid = isUndefined || shouldHaveSchemaOptions;
  const schemaOptionsMaybe = isArray ? { schemaOptions } : {};
  return [isValid, schemaOptionsMaybe];
};

// listingExtendedDataConfig.searchPageConfig
const filterTypes = ['SelectSingleFilter', 'SelectMultipleFilter'];
const validFilterType = (filterType, schemaType) => {
  const isEnumSchemaType = ['enum', 'multi-enum'].includes(schemaType);
  const shouldHaveFilterType = isEnumSchemaType && filterTypes.includes(filterType);
  const isValid = !isEnumSchemaType || shouldHaveFilterType;
  const filterTypeMaybe = shouldHaveFilterType ? { filterType } : {};
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

const validSearchPageConfig = (config, schemaType) => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: label, filterType, searchMode, group
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidFilterType, filterType] = validFilterType(config.filterType, schemaType);
  const [isValidSearchMode, searchMode] = validSearchMode(config.searchMode, schemaType);
  const groupOptions = ['primary', 'secondary'];
  const [isValidGroup, group] = validEnumString('group', config.group, groupOptions, 'primary');

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

// listingExtendedDataConfig.listingPageConfig
const validListingPageConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  // Validate: label, isDetail.
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidIsDetail, isDetail] = validBoolean('isDetail', config.isDetail, true);

  const isValid = isValidLabel && isValidIsDetail;
  const validValue = {
    listingPageConfig: {
      ...label,
      ...isDetail,
    },
  };
  return [isValid, validValue];
};

// listingExtendedDataConfig.editListingPageConfig
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

const validEditListingPageConfig = config => {
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
            : name === 'includeForProcessAliases'
            ? validProcessAliases(value, processAliasesInUse)
            : name === 'schemaType'
            ? validEnumString('schemaType', value, validSchemaTypes)
            : name === 'schemaOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'indexForSearch'
            ? validBoolean('indexForSearch', value, false)
            : name === 'searchPageConfig'
            ? validSearchPageConfig(value)
            : name === 'listingPageConfig'
            ? validListingPageConfig(value)
            : name === 'editListingPageConfig'
            ? validEditListingPageConfig(value)
            : [true, value];

        const hasFoundInvalid = !(acc.isValid === false || isValid === false);
        return { config: { ...acc.config, ...prop }, isValid: hasFoundInvalid };
      },
      { config: {}, isValid: true }
    );

    if (validationData.isValid) {
      return [...acc, validationData.config];
    } else {
      console.warn('Unsupported listing extended data configurations detected', data);
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
