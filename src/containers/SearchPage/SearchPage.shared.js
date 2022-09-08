import intersection from 'lodash/intersection';

import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM } from '../../util/types';
import { createResourceLocatorString } from '../../util/routes';
import { isAnyFilterActive, parseSelectFilterOptions } from '../../util/search';
import { createSlug, parse, stringify } from '../../util/urlHelpers';

/**
 * Create the name of the query parameter.
 *
 * @param {String} key Key extracted from listingExtendData config.
 * @param {String} scope Scope extracted from listingExtendData config.
 */
export const constructQueryParamName = (key, scope) => {
  const paramName = scope === 'meta' ? `meta_${key}` : `pub_${key}`;
  return paramName.replace(/\s/g, '_');
};

/**
 * Validates a filter search param against the default and extended data configuration of listings.
 *
 * All invalid param names and values are dropped
 *
 * @param {String} queryParamName Search parameter name
 * @param {Object} paramValue Search parameter value
 * @param {Object} extendedDataFilters extended data configuration with indexForSearch === true
 * @param {Object} defaultFilters configuration for default built-in filters.
 */
export const validURLParamForExtendedData = (
  queryParamName,
  paramValueRaw,
  extendedDataFilters,
  defaultFilters
) => {
  const paramValue = paramValueRaw.toString();

  // Price is built-in filter for listing entities
  if (queryParamName === 'price') {
    // Restrict price range to correct min & max
    const { min, max } = defaultFilters || {};
    const valueArray = paramValue ? paramValue.split(',') : [];
    const validValues = valueArray.map(v => {
      return v < min ? min : v > max ? max : v;
    });
    return validValues.length === 2 ? { [queryParamName]: validValues.join(',') } : {};
  } else if (queryParamName === 'keywords') {
    return paramValue.length > 0 ? { [queryParamName]: paramValue } : {};
  } else if (queryParamName === 'dates') {
    return paramValue.length > 0 ? { [queryParamName]: paramValue } : {};
  }
  // TODO: handle 'dates' filter for bookings.

  // Resolve configurations for extended data filters
  const extendedDataFilterConfig = extendedDataFilters.find(
    f => queryParamName === constructQueryParamName(f.key, f.scope)
  );

  if (extendedDataFilterConfig) {
    const { schemaType, schemaOptions = [], searchPageConfig } = extendedDataFilterConfig;
    if ([SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM].includes(schemaType)) {
      const getOptionValue = option => `${option}`.toLowerCase().replace(/\s/g, '_');
      const isSchemaTypeMultiEnum = schemaType === SCHEMA_TYPE_MULTI_ENUM;
      const searchMode = searchPageConfig?.searchMode;

      // Pick valid select options only
      const valueArray = parseSelectFilterOptions(paramValue);
      const allowedValues = schemaOptions.map(o => getOptionValue(o));
      const validValues = intersection(valueArray, allowedValues).join(',');

      return validValues.length > 0
        ? {
            [queryParamName]:
              isSchemaTypeMultiEnum && searchMode ? `${searchMode}:${validValues}` : validValues,
          }
        : {};
    } else {
      // Generic filter - remove empty params
      return paramValue.length > 0 ? { [queryParamName]: paramValue } : {};
    }
  }
  return {};
};

/**
 * Checks filter param value validity.
 *
 * Non-filter params are dropped.
 *
 * @param {Object} params Search query params
 * @param {Object} extendedDataFilters extended data configuration with indexForSearch === true
 * @param {Object} defaultFilters configuration for default built-in filters.
 */
export const validFilterParams = (params, listingExtendedDataConfig, defaultFiltersConfig) => {
  const paramEntries = Object.entries(params);
  const extendedDataFilters = listingExtendedDataConfig.filter(config => config.indexForSearch);
  const extendedDataParamNames = extendedDataFilters.map(f =>
    constructQueryParamName(f.key, f.scope)
  );
  const defaultFilterParamNames = defaultFiltersConfig.map(f => f.key);
  const paramNames = [...extendedDataParamNames, ...defaultFilterParamNames];

  return paramEntries.reduce((validParams, entry) => {
    const [paramName, paramValue] = entry;

    return paramNames.includes(paramName)
      ? {
          ...validParams,
          ...validURLParamForExtendedData(
            paramName,
            paramValue,
            extendedDataFilters,
            defaultFiltersConfig
          ),
        }
      : { ...validParams };
  }, {});
};

/**
 * Checks filter param value validity.
 *
 * Non-filter params are returned as they are.
 *
 * @param {Object} params Search query params
 * @param {Object} extendedDataFilters extended data configuration with indexForSearch === true
 * @param {Object} defaultFilters configuration for default built-in filters.
 */
export const validURLParamsForExtendedData = (
  params,
  listingExtendedDataConfig,
  defaultFiltersConfig
) => {
  const extendedDataFilters = listingExtendedDataConfig.filter(config => config.indexForSearch);
  const extendedDataParamNames = extendedDataFilters.map(f =>
    constructQueryParamName(f.key, f.scope)
  );
  const builtInFilterParamNames = defaultFiltersConfig.map(df => df.key);
  const filterParamNames = [...builtInFilterParamNames, ...extendedDataParamNames];

  const paramEntries = Object.entries(params);

  return paramEntries.reduce((validParams, entry) => {
    const [paramName, paramValue] = entry;

    return filterParamNames.includes(paramName)
      ? {
          ...validParams,
          ...validURLParamForExtendedData(
            paramName,
            paramValue,
            extendedDataFilters,
            defaultFiltersConfig
          ),
        }
      : { ...validParams, [paramName]: paramValue };
  }, {});
};

/**
 * Helper to pick only valid values of search params from URL (location)
 * Note: location.search might look like: '?pub_category=men&pub_amenities=towels,bathroom'
 *
 * @param {Object} props object containing: location, listingExtendedDataConfig, defaultFiltersConfig
 * @returns picked search params against extended data config and default filter config
 */
export const validUrlQueryParamsFromProps = props => {
  const { location, config } = props;
  const { listingExtendedData: listingExtendedDataConfig } = config?.listing || {};
  const { defaultFilters: defaultFiltersConfig } = config?.search || {};
  // eslint-disable-next-line no-unused-vars
  const { mapSearch, page, ...searchInURL } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  // urlQueryParams doesn't contain page specific url params
  // like mapSearch, page or origin (origin depends on config.maps.search.sortSearchByDistance)
  return validURLParamsForExtendedData(
    searchInURL,
    listingExtendedDataConfig,
    defaultFiltersConfig
  );
};

/**
 * Helper to figure out initialValues for Final Form that handles search filters
 *
 * @param {Object} props object containing: location, listingExtendedDataConfig, defaultFiltersConfig
 * @param {Object} currentQueryParams object containing current state of queryParams (used only when isLiveEdit is false)
 * @returns a function with params queryParamNames, and isLiveEdit.
 *          It's called from FilterComponent and it returns initial values for the filter.
 */
export const initialValues = (props, currentQueryParams) => (queryParamNames, isLiveEdit) => {
  const urlQueryParams = validUrlQueryParamsFromProps(props);

  // Get initial value for a given parameter from state if its there.
  const getInitialValue = paramName => {
    // Query parameters that are in state (user might have not yet clicked "Apply")
    const currentQueryParam = currentQueryParams[paramName];
    const hasQueryParamInState = typeof currentQueryParam !== 'undefined';
    return hasQueryParamInState && !isLiveEdit ? currentQueryParam : urlQueryParams[paramName];
  };

  // Return all the initial values related to given queryParamNames
  // InitialValues for "amenities" filter could be
  // { amenities: "has_any:towel,jacuzzi" }
  const isArray = Array.isArray(queryParamNames);
  return isArray
    ? queryParamNames.reduce((acc, paramName) => {
        return { ...acc, [paramName]: getInitialValue(paramName) };
      }, {})
    : {};
};

/**
 * Some parameters could conflict with sort. If sortConfig defines conflictingFilters,
 * This function checks if they are active and returns "sort" param as null
 *
 * @param {*} searchParams
 * @param {*} listingExtendedDataConfig
 * @param {*} defaultFiltersConfig
 * @param {*} sortConfig
 * @returns sort parameter as null if sortConfig defines conflictingFilters
 */
export const cleanSearchFromConflictingParams = (
  searchParams,
  listingExtendedDataConfig,
  defaultFiltersConfig,
  sortConfig
) => {
  // Single out filters that should disable SortBy when an active
  // keyword search sorts the listings according to relevance.
  // In those cases, sort parameter should be removed.
  const sortingFiltersActive = isAnyFilterActive(
    sortConfig.conflictingFilters,
    searchParams,
    listingExtendedDataConfig,
    defaultFiltersConfig
  );
  return sortingFiltersActive
    ? { ...searchParams, [sortConfig.queryParamName]: null }
    : searchParams;
};

/**
 * Extract search parameters, including a custom URL params,
 * which are validated by mapping the values to marketplace custom config.
 *
 * @param {Object} params Search query params
 * @param {Object} extendedDataFilters extended data configuration with indexForSearch === true
 * @param {Object} defaultFilters configuration for default built-in filters.
 * @param {Object} sortConfig config for sort search results feature
 */
export const pickSearchParamsOnly = (
  params,
  listingExtendedDataConfig,
  defaultFiltersConfig,
  sortConfig,
  isOriginInUse
) => {
  const { address, origin, bounds, ...rest } = params || {};
  const boundsMaybe = bounds ? { bounds } : {};
  const originMaybe = isOriginInUse && origin ? { origin } : {};
  const filterParams = validFilterParams(rest, listingExtendedDataConfig, defaultFiltersConfig);
  const sort = rest[sortConfig.queryParamName];
  const sortMaybe = sort ? { sort } : {};

  return {
    ...boundsMaybe,
    ...originMaybe,
    ...filterParams,
    ...sortMaybe,
  };
};

/**
 * This helper has 2 functions:
 * - It picks search params from Location instance (location.search)
 * - It verifies that those search params are the same as search params in state.
 *   In some cases, search params are referencing previous params
 *   and listings should not be considered loaded.
 *
 * @param {Object} searchFromLocation searchParams from URL (location.search)
 * @param {Object} searchParamsInProps searchParams from store
 * @param {Object} listingExtendedDataConfig config for listing's extended data
 * @param {Object} defaultFiltersConfig config for default filters
 * @param {Object} sortConfig config for SortBy feature
 * @returns object containing
 *   1. searchParamsInURL (omit pagination 'page' or 'mapSearch'),
 *   2. urlQueryParams (picked valid search params for listing query), and
 *   3. searchParamsAreInSync is true if searchFromLocation and searchParamsInProps match.
 */
export const searchParamsPicker = (
  searchFromLocation,
  searchParamsInProps,
  listingExtendedDataConfig,
  defaultFiltersConfig,
  sortConfig,
  isOriginInUse
) => {
  const { mapSearch, page, ...searchParamsInURL } = parse(searchFromLocation, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  // Pick only search params that are part of current search configuration
  const queryParamsFromSearchParams = pickSearchParamsOnly(
    searchParamsInProps,
    listingExtendedDataConfig,
    defaultFiltersConfig,
    sortConfig,
    isOriginInUse
  );
  // Pick only search params that are part of current search configuration
  const queryParamsFromURL = pickSearchParamsOnly(
    searchParamsInURL,
    listingExtendedDataConfig,
    defaultFiltersConfig,
    sortConfig,
    isOriginInUse
  );

  // Page transition might initially use values from previous search
  const searchParamsAreInSync =
    stringify(queryParamsFromURL) === stringify(queryParamsFromSearchParams);

  return {
    urlQueryParams: queryParamsFromURL,
    searchParamsInURL,
    searchParamsAreInSync,
  };
};

/**
 * Returns listing extended data configs grouped into arrays. [primaryConfigArray, secondaryConfigArray]
 * @param {*} configs listing extended data config
 * @param {*} activeProcesses select configs that are marked only for these active processes
 * @returns Array of grouped arrays. First subarray contains primary configs and the second contains secondary configs.
 */
export const groupExtendedDataConfigs = (configs, activeProcesses) =>
  configs.reduce(
    (grouped, config) => {
      const [primary, secondary] = grouped;
      const { includeForProcessAliases, indexForSearch, searchPageConfig } = config;
      const isIndexed = indexForSearch === true;
      const isActiveProcess = includeForProcessAliases.every(p =>
        activeProcesses.includes(p.split('/')[0])
      );
      const isPrimary = searchPageConfig?.group === 'primary';
      return isActiveProcess && isIndexed && isPrimary
        ? [[...primary, config], secondary]
        : isActiveProcess && isIndexed
        ? [primary, [...secondary, config]]
        : grouped;
    },
    [[], []]
  );

export const createSearchResultSchema = (
  listings,
  mainSearchData,
  intl,
  routeConfiguration,
  config
) => {
  // Schema for search engines (helps them to understand what this page is about)
  // http://schema.org
  // We are using JSON-LD format
  const siteTitle = config.siteTitle;
  const { address, keywords } = mainSearchData;
  const keywordsMaybe = keywords ? `"${keywords}"` : null;
  const searchTitle =
    address || keywordsMaybe || intl.formatMessage({ id: 'SearchPage.schemaForSearch' });
  const schemaDescription = intl.formatMessage({ id: 'SearchPage.schemaDescription' });
  const schemaTitle = intl.formatMessage(
    { id: 'SearchPage.schemaTitle' },
    { searchTitle, siteTitle }
  );

  const schemaListings = listings.map((l, i) => {
    const title = l.attributes.title;
    const pathToItem = createResourceLocatorString('ListingPage', routeConfiguration, {
      id: l.id.uuid,
      slug: createSlug(title),
    });
    return {
      '@type': 'ListItem',
      position: i,
      url: `${config.canonicalRootURL}${pathToItem}`,
      name: title,
    };
  });

  const schemaMainEntity = JSON.stringify({
    '@type': 'ItemList',
    name: searchTitle,
    itemListOrder: 'http://schema.org/ItemListOrderAscending',
    itemListElement: schemaListings,
  });
  return {
    title: schemaTitle,
    description: schemaDescription,
    schema: {
      '@context': 'http://schema.org',
      '@type': 'SearchResultsPage',
      description: schemaDescription,
      name: schemaTitle,
      mainEntity: [schemaMainEntity],
    },
  };
};
