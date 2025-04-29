/**
 * SelectMultipleFilter needs to parse values from format
 * "has_all:a,b,c,d" or "a,b,c,d"
 */
export const parseSelectFilterOptions = uriComponentValue => {
  const startsWithHasAll = uriComponentValue && uriComponentValue.indexOf('has_all:') === 0;
  const startsWithHasAny = uriComponentValue && uriComponentValue.indexOf('has_any:') === 0;

  if (startsWithHasAll) {
    return uriComponentValue.substring(8).split(',');
  } else if (startsWithHasAny) {
    return uriComponentValue.substring(8).split(',');
  } else {
    return uriComponentValue.split(',');
  }
};

/**
 * Create the name of the query parameter.
 *
 * @param {String} key Key extracted from listingExtendData config.
 * @param {String} scope Scope extracted from listingExtendData config.
 */
export const constructQueryParamName = (key, scope) => {
  const prefixedKey = scope === 'meta' ? `meta_${key}` : `pub_${key}`;
  return prefixedKey.replace(/\s/g, '_');
};

/**
 * Get parameter names for search query. Extract those from config.
 * The configuration of default filters has key, which is 1-on-1 mapping
 * with the name of the query parameter. E.g. 'price'.
 *
 * @param {Object} listingFieldsConfig Custom filters are checked agains extended data config of a listing entity.
 * @param {Object} defaultFiltersConfig Configuration of default filters.
 */
export const getQueryParamNames = (listingFieldsConfig, defaultFiltersConfig) => {
  const queryParamKeysOfDefaultFilters = defaultFiltersConfig.reduce((pickedKeys, config) => {
    const { key, schemaType, scope, nestedParams } = config;
    const newKeys =
      schemaType === 'category' && nestedParams
        ? nestedParams?.map(p => constructQueryParamName(p, scope))
        : schemaType === 'listingType'
        ? [constructQueryParamName(key, scope)]
        : [key];
    return [...pickedKeys, ...newKeys];
  }, []);
  const queryParamKeysOfListingFields = listingFieldsConfig.reduce((params, config) => {
    const param = constructQueryParamName(config.key, config.scope);
    return config.filterConfig?.indexForSearch ? [...params, param] : params;
  }, []);
  return [...queryParamKeysOfDefaultFilters, ...queryParamKeysOfListingFields];
};
/**
 * Check if any of the filters (defined by filterKeys) have currently active query parameter in URL.
 */
export const isAnyFilterActive = (filterKeys, urlQueryParams, filterConfigs) => {
  const { listingFieldsConfig, defaultFiltersConfig } = filterConfigs;
  const queryParamKeys = getQueryParamNames(listingFieldsConfig, defaultFiltersConfig);

  const getQueryParamKeysOfGivenFilters = (pickedKeys, key) => {
    const isFilterIncluded = filterKeys.includes(key);
    const addedQueryParamNamesMaybe = isFilterIncluded ? [key] : [];
    return [...pickedKeys, ...addedQueryParamNamesMaybe];
  };
  const queryParamKeysOfGivenFilters = queryParamKeys.reduce(getQueryParamKeysOfGivenFilters, []);

  const paramEntries = Object.entries(urlQueryParams);
  const activeKey = paramEntries.find(entry => {
    const [key, value] = entry;
    return queryParamKeysOfGivenFilters.includes(key) && value != null;
  });
  return !!activeKey;
};

/**
 * Pick initial vales for FieldSelectTree component.
 * The value object should be an object containing search params:
 * { pub_categoryLevel1: 'cats', pub_categoryLevel2: 'egyptian-mau', meta_foo: 'bar' }
 *
 * @param {String} prefix like "pub_categoryLevel"
 * @param {Object} values object literal containing level-specific info
 *
 * @returns returns properties, which have a key that starts with the given prefix.
 */
export const pickInitialValuesForFieldSelectTree = (prefix, values, isNestedEnum) => {
  const pickValuesFn = (picked, entry) => {
    const [key, value] = entry;
    const prefixIndex = key.indexOf(prefix);
    const startsWithPrefix = prefixIndex > -1;
    const slicedKey = isNestedEnum ? key.slice(prefixIndex) : `${key.slice(prefixIndex)}1`;
    return startsWithPrefix ? { ...picked, [slicedKey]: value } : picked;
  };
  const prefixCollection = Object.entries(values).reduce(pickValuesFn, {});
  return prefixCollection;
};

/**
 * This converts the category structure to the format that that's understood by SelectSingleFilter
 * and its child component: FieldSelectTree.
 *
 * @param {Array} categories contain objects with props: _id_, _name_, potentially _subcategories_.
 * @returns an array that contains objects with props: _option_, _label_ and potentially _suboptions_.
 */
export const convertCategoriesToSelectTreeOptions = categories => {
  const convertSubcategoryData = params => {
    const { id, name, subcategories } = params;
    const suboptionsMaybe = subcategories
      ? { suboptions: subcategories.map(cat => convertSubcategoryData(cat)) }
      : {};
    return { option: id, label: name, ...suboptionsMaybe };
  };

  const categoriesArray = Array.isArray(categories) ? categories : [];
  return categoriesArray.map(cat => convertSubcategoryData(cat));
};

/**
 * Check if the main search type is 'keywords'
 */
export const isMainSearchTypeKeywords = config =>
  config.search?.mainSearch?.searchType === 'keywords';

/**
 * Check if the origin parameter is currently active.
 */
export const isOriginInUse = config =>
  config.search?.mainSearch?.searchType === 'location' && config.maps?.search?.sortSearchByDistance;

/**
 * Check if the stock management is currently active.
 */
export const isStockInUse = config => {
  const listingTypes = config.listing.listingTypes;
  const stockProcesses = ['default-purchase'];
  const hasStockProcessesInUse = !!listingTypes.find(conf =>
    stockProcesses.includes(conf.transactionType.process)
  );

  // Note: these are active processes!
  return hasStockProcessesInUse;
};
