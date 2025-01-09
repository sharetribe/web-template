import intersection from 'lodash/intersection';

import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM } from '../../util/types';
import { createResourceLocatorString } from '../../util/routes';
import {
  isAnyFilterActive,
  parseSelectFilterOptions,
  constructQueryParamName,
} from '../../util/search';
import { createSlug, parse, stringify } from '../../util/urlHelpers';
import {
  getStartOf,
  parseDateFromISO8601,
  subtractTime,
  addTime,
  stringifyDateToISO8601,
} from '../../util/dates';
import { isFieldForCategory } from '../../util/fieldHelpers';

/**
 * Omit those listing field parameters, that are not allowed with current category selection
 *
 * @param {Object} searchParams current search params
 * @param {Object} filterConfigs contains listingFieldsConfig and defaultFiltersConfig.
 * @returns search parameters without currently restricted listing fields
 */
export const omitLimitedListingFieldParams = (searchParams, filterConfigs) => {
  const { listingFieldsConfig, defaultFiltersConfig, listingCategories } = filterConfigs;
  const categorySearchConfig = defaultFiltersConfig.find(f => f.schemaType === 'category');
  const validNestedCategoryParamNames = categorySearchConfig
    ? validURLParamForCategoryData(categorySearchConfig.key, listingCategories, 1, searchParams)
    : {};

  return Object.entries(searchParams).reduce((picked, searchParam) => {
    const [searchParamKey, searchParamValue] = searchParam;
    const foundConfig = listingFieldsConfig.find(
      f => constructQueryParamName(f.key, f.scope) === searchParamKey
    );
    const currentCategories = Object.values(validNestedCategoryParamNames);
    const isForCategory = isFieldForCategory(currentCategories, foundConfig);
    const searchParamMaybe =
      !foundConfig || (foundConfig && isForCategory) ? { [searchParamKey]: searchParamValue } : {};
    return { ...picked, ...searchParamMaybe };
  }, {});
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
    const { min, max } = defaultFilters.find(conf => conf.schemaType === 'price') || {};
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
  } else if (queryParamName === 'seats') {
    return paramValue ? { [queryParamName]: paramValue } : {};
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

const validURLParamForCategoryData = (prefix, categories, level, params) => {
  const levelKey = constructQueryParamName(`${prefix}${level}`, 'public');
  const levelValue = params?.[levelKey];
  const foundCategory = categories.find(cat => cat.id === params?.[levelKey]);
  const subcategories = foundCategory?.subcategories || [];
  return foundCategory && subcategories.length > 0
    ? {
        [levelKey]: levelValue,
        ...validURLParamForCategoryData(prefix, subcategories, level + 1, params),
      }
    : foundCategory
    ? { [levelKey]: levelValue }
    : {};
};

/**
 * Checks filter param value validity.
 *
 * The URL params that are not part of listing.query filters are dropped by default.
 *
 * @param {Object} params Search query params
 * @param {Object} filterConfigs contains listingFieldsConfig and defaultFiltersConfig.
 * @param {boolean} dropNonFilterParams if false, extra params are passed through.
 */
export const validFilterParams = (params, filterConfigs, dropNonFilterParams = true) => {
  const { listingFieldsConfig, defaultFiltersConfig, listingCategories } = filterConfigs;

  const listingFieldFiltersConfig = listingFieldsConfig.filter(
    config => config.filterConfig?.indexForSearch
  );
  const listingFieldParamNames = listingFieldFiltersConfig.map(f =>
    constructQueryParamName(f.key, f.scope)
  );
  // Note: builtInFilterParamNames might include categoryLevel,
  //       even though it isn't a paramname that's used with nested category tree.
  //       (pub_categoryLevel1, pub_categoryLevel2, and pub_categoryLevel3 are used instead.)
  const builtInFilterParamNames = defaultFiltersConfig.map(f => {
    return f.schemaType === 'category' ? `pub_${f.key}` : f.key;
  });
  const filterParamNames = [...listingFieldParamNames, ...builtInFilterParamNames];

  // Note: currently, we only support nested enums with a single default filter
  //       that has schema type: "category"
  const categorySearchConfig = defaultFiltersConfig.find(f => f.schemaType === 'category');
  const validNestedCategoryParamNames = categorySearchConfig
    ? validURLParamForCategoryData(categorySearchConfig.key, listingCategories, 1, params)
    : {};
  const isParamNameNestedEnumRelated = (paramName, key, isNestedEnum) => {
    return isNestedEnum && key ? paramName.indexOf(key) > -1 : false;
  };

  // search params without category-restricted params
  const unlimitedSearchParams = omitLimitedListingFieldParams(params, filterConfigs);
  const paramEntries = Object.entries(unlimitedSearchParams);

  const listingFieldsAndBuiltInFilterParamNames = paramEntries.reduce((validParams, entry) => {
    const [paramName, paramValue] = entry;
    const isIndependentParam = filterParamNames.includes(paramName);
    const isNestedEnum = isIndependentParam
      ? false
      : isParamNameNestedEnumRelated(
          paramName,
          categorySearchConfig?.key,
          categorySearchConfig?.isNestedEnum
        );
    return isIndependentParam
      ? {
          ...validParams,
          ...validURLParamForExtendedData(
            paramName,
            paramValue,
            listingFieldFiltersConfig,
            defaultFiltersConfig
          ),
        }
      : dropNonFilterParams || isNestedEnum
      ? { ...validParams }
      : { ...validParams, [paramName]: paramValue };
  }, {});

  // TODO: Currently this only supports categoryLevel with nested param names.
  //       This needs more work to make other enum fields to understand nested keys.
  return { ...listingFieldsAndBuiltInFilterParamNames, ...validNestedCategoryParamNames };
};

/**
 * Helper to pick only valid values of search params from URL (location)
 * Note: location.search might look like: '?pub_category=men&pub_amenities=towels,bathroom'
 *
 * @param {Object} props object containing: location and (app) config
 * @returns picked search params against extended data config and default filter config
 */
export const validUrlQueryParamsFromProps = props => {
  const { location, config } = props;
  const { listingFields: listingFieldsConfig } = config?.listing || {};
  const { defaultFilters: defaultFiltersConfig } = config?.search || {};
  const listingCategories = config.categoryConfiguration.categories;
  const filterConfigs = {
    listingFieldsConfig,
    defaultFiltersConfig,
    listingCategories,
  };

  // eslint-disable-next-line no-unused-vars
  const { mapSearch, page, ...searchInURL } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });
  // urlQueryParams doesn't contain page specific url params
  // like mapSearch, page or origin (origin depends on config.maps.search.sortSearchByDistance)
  return validFilterParams(searchInURL, filterConfigs, false);
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
        const initValue = getInitialValue(paramName);
        const addInitialValueMaybe = initValue ? { [paramName]: initValue } : {};
        return { ...acc, ...addInitialValueMaybe };
      }, {})
    : {};
};

/**
 * Some parameters could conflict with sort. If sortConfig defines conflictingFilters,
 * This function checks if they are active and returns "sort" param as null
 *
 * @param {*} searchParams
 * @param {*} filterConfigs contains config like listingFieldsConfig and defaultFiltersConfig
 * @param {*} sortConfig
 * @returns sort parameter as null if sortConfig defines conflictingFilters
 */
export const cleanSearchFromConflictingParams = (searchParams, filterConfigs, sortConfig) => {
  // Single out filters that should disable SortBy when an active
  // keyword search sorts the listings according to relevance.
  // In those cases, sort parameter should be removed.
  const sortingFiltersActive = isAnyFilterActive(
    sortConfig.conflictingFilters,
    searchParams,
    filterConfigs
  );

  // search params without category-restricted params
  const unlimitedSearchParams = omitLimitedListingFieldParams(searchParams, filterConfigs);

  return sortingFiltersActive
    ? { ...unlimitedSearchParams, [sortConfig.queryParamName]: null }
    : unlimitedSearchParams;
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
export const pickSearchParamsOnly = (params, filterConfigs, sortConfig, isOriginInUse) => {
  const { address, origin, bounds, ...rest } = params || {};
  const boundsMaybe = bounds ? { bounds } : {};
  const originMaybe = isOriginInUse && origin ? { origin } : {};
  const filterParams = validFilterParams(rest, filterConfigs);
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
  filterConfigs,
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
    filterConfigs,
    sortConfig,
    isOriginInUse
  );
  // Pick only search params that are part of current search configuration
  const queryParamsFromURL = pickSearchParamsOnly(
    searchParamsInURL,
    filterConfigs,
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

export const pickListingFieldFilters = params => {
  const { listingFields, locationSearch, categoryConfiguration } = params;
  const searchParams = parse(locationSearch);
  const categories = categoryConfiguration.categories;
  const validNestedCategoryParamNames = categories
    ? validURLParamForCategoryData(categoryConfiguration.key, categories, 1, searchParams)
    : {};
  const currentCategories = Object.values(validNestedCategoryParamNames);
  const pickedFields = listingFields.reduce((picked, fieldConfig) => {
    const isTargetCategory = isFieldForCategory(currentCategories, fieldConfig);
    return isTargetCategory ? [...picked, fieldConfig] : picked;
  }, []);
  return pickedFields;
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
      const { listingTypeConfig = {}, filterConfig } = config;
      const isIndexed = filterConfig?.indexForSearch === true;
      const isActiveListingTypes =
        !listingTypeConfig.limitToListingTypeIds ||
        listingTypeConfig.listingTypeIds.every(lt => activeListingTypes.includes(lt));
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

export const getDatesAndSeatsMaybe = (currentParams, newParams) => {
  const { seats, dates: newDates } = newParams;
  const { dates: currentDates } = currentParams;

  // Determine which dates and seats to use:
  // - if newDates has a value, it was just selected
  // - if newDates is null, it was just cleared
  // - if newDates is undefined, it was not modified, and we use currentDates
  const dates = !!newDates || newDates === null ? newDates : currentDates;

  const today = stringifyDateToISO8601(new Date());
  const aWeekFromNow = stringifyDateToISO8601(addTime(today, 7, 'day'));
  // Get parameters for dates and seats:
  // - If both dates and seats are included, pass both
  // - Dates can be queried without seats
  // - Seats cannot be queried without dates – pass a default date range
  //   of one week with the provided seats value
  // - If neither dates nor seats exist, set them to null to clear them from search
  const datesAndSeatsMaybe =
    dates && seats
      ? { dates, seats }
      : dates
      ? { dates }
      : seats
      ? { seats, dates: `${today},${aWeekFromNow}` }
      : { seats: null, dates: null };
  return datesAndSeatsMaybe;
};
