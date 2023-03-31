import intersection from 'lodash/intersection';

import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM } from '../../util/types';
import { createResourceLocatorString } from '../../util/routes';
import { isAnyFilterActive, parseSelectFilterOptions } from '../../util/search';
import { createSlug, parse, stringify } from '../../util/urlHelpers';
import { getStartOf, parseDateFromISO8601, subtractTime } from '../../util/dates';

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
 * @param {Object} listingFieldFilters extended data configuration with indexForSearch === true
 * @param {Object} defaultFilters configuration for default built-in filters.
 */
export const validURLParamForExtendedData = (
  queryParamName,
  paramValueRaw,
  listingFieldFilters,
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
    const searchTZ = 'Etc/UTC';
    const today = getStartOf(new Date(), 'day', searchTZ);
    const possibleStartDate = subtractTime(today, 14, 'hours', searchTZ);
    const dates = paramValue ? paramValue.split(',') : [];
    const hasValues = dates.length > 0;
    const startDate = hasValues ? parseDateFromISO8601(dates[0], searchTZ) : null;
    const endDate = hasValues ? parseDateFromISO8601(dates[1], searchTZ) : null;
    const hasValidDates =
      hasValues &&
      startDate.getTime() >= possibleStartDate.getTime() &&
      startDate.getTime() <= endDate.getTime();

    return hasValidDates ? { [queryParamName]: paramValue } : {};
  }

  // Resolve configurations for extended data filters
  const listingFieldFilterConfig = listingFieldFilters.find(
    f => queryParamName === constructQueryParamName(f.key, f.scope)
  );

  if (listingFieldFilterConfig) {
    const { schemaType, enumOptions = [], filterConfig } = listingFieldFilterConfig;
    if ([SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM].includes(schemaType)) {
      const isSchemaTypeMultiEnum = schemaType === SCHEMA_TYPE_MULTI_ENUM;
      const searchMode = filterConfig?.searchMode;

      // Pick valid select options only
      const valueArray = parseSelectFilterOptions(paramValue);
      const allowedValues = enumOptions.map(o => `${o.option}`);
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
 * The URL params that are not part of listing.query filters are dropped by default.
 *
 * @param {Object} params Search query params
 * @param {Object} listingFieldsConfig extended data configuration with indexForSearch === true
 * @param {Object} defaultFiltersConfig configuration for default built-in filters.
 * @param {boolean} dropNonFilterParams if false, extra params are passed through.
 */
export const validFilterParams = (
  params,
  listingFieldsConfig,
  defaultFiltersConfig,
  dropNonFilterParams = true
) => {
  const listingFieldFiltersConfig = listingFieldsConfig.filter(
    config => config.filterConfig?.indexForSearch
  );
  const listingFieldParamNames = listingFieldFiltersConfig.map(f =>
    constructQueryParamName(f.key, f.scope)
  );
  const builtInFilterParamNames = defaultFiltersConfig.map(f => f.key);
  const filterParamNames = [...listingFieldParamNames, ...builtInFilterParamNames];

  const paramEntries = Object.entries(params);

  return paramEntries.reduce((validParams, entry) => {
    const [paramName, paramValue] = entry;

    return filterParamNames.includes(paramName)
      ? {
          ...validParams,
          ...validURLParamForExtendedData(
            paramName,
            paramValue,
            listingFieldFiltersConfig,
            defaultFiltersConfig
          ),
        }
      : dropNonFilterParams
      ? { ...validParams }
      : { ...validParams, [paramName]: paramValue };
  }, {});
};

/**
 * Helper to pick only valid values of search params from URL (location)
 * Note: location.search might look like: '?pub_category=men&pub_amenities=towels,bathroom'
 *
 * @param {Object} props object containing: location, listingFieldsConfig, defaultFiltersConfig
 * @returns picked search params against extended data config and default filter config
 */
export const validUrlQueryParamsFromProps = props => {
  const { location, config } = props;
  const { listingFields: listingFieldsConfig } = config?.listing || {};
  const { defaultFilters: defaultFiltersConfig } = config?.search || {};
  // eslint-disable-next-line no-unused-vars
  const { mapSearch, page, ...searchInURL } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  // urlQueryParams doesn't contain page specific url params
  // like mapSearch, page or origin (origin depends on config.maps.search.sortSearchByDistance)
  return validFilterParams(searchInURL, listingFieldsConfig, defaultFiltersConfig, false);
};

/**
 * Helper to figure out initialValues for Final Form that handles search filters
 *
 * @param {Object} props object containing: location, listingFieldsConfig, defaultFiltersConfig
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
 * @param {*} listingFieldsConfig
 * @param {*} defaultFiltersConfig
 * @param {*} sortConfig
 * @returns sort parameter as null if sortConfig defines conflictingFilters
 */
export const cleanSearchFromConflictingParams = (
  searchParams,
  listingFieldsConfig,
  defaultFiltersConfig,
  sortConfig
) => {
  // Single out filters that should disable SortBy when an active
  // keyword search sorts the listings according to relevance.
  // In those cases, sort parameter should be removed.
  const sortingFiltersActive = isAnyFilterActive(
    sortConfig.conflictingFilters,
    searchParams,
    listingFieldsConfig,
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
 * @param {Object} listingFieldsConfig extended data configuration with indexForSearch === true
 * @param {Object} defaultFiltersConfig configuration for default built-in filters.
 * @param {Object} sortConfig config for sort search results feature
 * @param {boolean} isOriginInUse if origin is in use, return it too.
 */
export const pickSearchParamsOnly = (
  params,
  listingFieldsConfig,
  defaultFiltersConfig,
  sortConfig,
  isOriginInUse
) => {
  const { address, origin, bounds, ...rest } = params || {};
  const boundsMaybe = bounds ? { bounds } : {};
  const originMaybe = isOriginInUse && origin ? { origin } : {};
  const filterParams = validFilterParams(rest, listingFieldsConfig, defaultFiltersConfig);
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
 * @param {Object} listingFieldsConfig config for listing's extended data
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
  listingFieldsConfig,
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
    listingFieldsConfig,
    defaultFiltersConfig,
    sortConfig,
    isOriginInUse
  );
  // Pick only search params that are part of current search configuration
  const queryParamsFromURL = pickSearchParamsOnly(
    searchParamsInURL,
    listingFieldsConfig,
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
 * Returns listing fields (extended data configs) grouped into arrays. [primaryConfigArray, secondaryConfigArray]
 * @param {Object} configs listing extended data config
 * @param {Array<String>} activeListingTypes select configs that are marked only for these active listing types
 * @returns Array of grouped arrays. First subarray contains primary configs and the second contains secondary configs.
 */
export const groupListingFieldConfigs = (configs, activeListingTypes) =>
  configs.reduce(
    (grouped, config) => {
      const [primary, secondary] = grouped;
      const { includeForListingTypes, filterConfig } = config;
      const isIndexed = filterConfig?.indexForSearch === true;
      const isActiveListingTypes =
        includeForListingTypes == null ||
        includeForListingTypes.every(lt => activeListingTypes.includes(lt));
      const isPrimary = filterConfig?.group === 'primary';
      return isActiveListingTypes && isIndexed && isPrimary
        ? [[...primary, config], secondary]
        : isActiveListingTypes && isIndexed
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
  const marketplaceName = config.marketplaceName;
  const { address, keywords } = mainSearchData;
  const keywordsMaybe = keywords ? `"${keywords}"` : null;
  const searchTitle =
    address || keywordsMaybe || intl.formatMessage({ id: 'SearchPage.schemaForSearch' });
  const schemaDescription = intl.formatMessage({ id: 'SearchPage.schemaDescription' });
  const schemaTitle = intl.formatMessage(
    { id: 'SearchPage.schemaTitle' },
    { searchTitle, marketplaceName }
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
      url: `${config.marketplaceRootURL}${pathToItem}`,
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
