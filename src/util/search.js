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
const constructQueryParamName = (key, scope) => {
  const prefixedKey = scope === 'meta' ? `meta_${key}` : `pub_${key}`;
  return prefixedKey.replace(/\s/g, '_');
};

/**
 * Get parameter names for search query. Extract those from config.
 * The configuration of default filters has key, which is 1-on-1 mapping
 * with the name of the query parameter. E.g. 'price'.
 *
 * @param {Object} listingExtendedDataConfig Custom filters are checked agains extended data config of a listing entity.
 * @param {Object} defaultFiltersConfig Configuration of default filters.
 */
export const getQueryParamNames = (listingExtendedDataConfig, defaultFiltersConfig) => {
  const queryParamKeysOfDefaultFilters = defaultFiltersConfig.map(config => config.key);
  const queryParamKeysOfListingExtendedData = listingExtendedDataConfig.reduce((params, config) => {
    const param = constructQueryParamName(config.key, config.scope);
    return config.indexForSearch ? [...params, param] : params;
  }, []);
  return [...queryParamKeysOfDefaultFilters, ...queryParamKeysOfListingExtendedData];
};
/**
 * Check if any of the filters (defined by filterKeys) have currently active query parameter in URL.
 */
export const isAnyFilterActive = (
  filterKeys,
  urlQueryParams,
  listingExtendedDataConfig,
  defaultFiltersConfig
) => {
  const queryParamKeys = getQueryParamNames(listingExtendedDataConfig, defaultFiltersConfig);

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
 * Check if the filter is currently active.
 */
export const findOptionsForSelectFilter = (filterKey, listingExtendedDataConfig) => {
  const config = listingExtendedDataConfig.find(f => f.key === filterKey);
  return config?.schemaOptions || [];
};

/**
 * Check if the main search type is 'keywords'
 */
export const isMainSearchTypeKeywords = config => config.search?.mainSearchType === 'keywords';

/**
 * Check if the origin parameter is currently active.
 */
export const isOriginInUse = config =>
  config.search?.mainSearchType === 'location' && config.maps?.search?.sortSearchByDistance;

/**
 * Check if the stock management is currently active.
 */
export const isStockInUse = config => config.search?.listingManagementType === 'stock';
