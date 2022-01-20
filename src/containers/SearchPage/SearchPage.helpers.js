import intersection from 'lodash/intersection';
import config from '../../config';
import { createResourceLocatorString } from '../../util/routes';
import { parseSelectFilterOptions, isOriginInUse } from '../../util/search';
import { createSlug } from '../../util/urlHelpers';
import routeConfiguration from '../../routing/routeConfiguration';

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
  }
  // TODO: handle 'dates' filter for bookings.

  // Resolve configurations for extended data filters
  const extendedDataFilterConfig = extendedDataFilters.find(
    f => queryParamName === constructQueryParamName(f.key, f.scope)
  );

  if (extendedDataFilterConfig) {
    const { schemaType, schemaOptions = [], searchPageConfig } = extendedDataFilterConfig;
    if (['enum', 'multi-enum'].includes(schemaType)) {
      const getOptionValue = option => `${option}`.toLowerCase().replace(/\s/g, '_');
      const isSchemaTypeMultiEnum = schemaType === 'multi-enum';
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
  sortConfig
) => {
  const { address, origin, bounds, ...rest } = params || {};
  const boundsMaybe = bounds ? { bounds } : {};
  const originMaybe = isOriginInUse(config) && origin ? { origin } : {};
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

export const createSearchResultSchema = (listings, mainSearchData, intl) => {
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
    const pathToItem = createResourceLocatorString('ListingPage', routeConfiguration(), {
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
