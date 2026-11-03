///////////////////////////////////////////////////////////////////////////
// Search config handler: hosted listing-search + built-in defaults      //
///////////////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const MAIN_SEARCH_TYPES = ['location', 'keywords'];

const emptyCategoryConfiguration = {
  key: 'categoryLevel',
  scope: 'public',
  categoryLevelKeys: [],
  categories: [],
};

/**
 * Build sort options derived from listing fields that have showSorting enabled.
 * Primary options are inserted before the default sort options and secondary after.
 * @param {Array} listingFields
 * @returns {{ primaryOptions: Array, secondaryOptions: Array }}
 */
export const getSortOptionsFromListingFields = listingFields => {
  const primaryOptions = [];
  const secondaryOptions = [];

  if (!Array.isArray(listingFields)) {
    return { primaryOptions, secondaryOptions };
  }

  listingFields.forEach(field => {
    const { key, scope, schemaType, filterConfig } = field;
    // only add sort options for numeric fields and if showSorting is true
    if (schemaType !== 'long' || !filterConfig?.showSorting) {
      return;
    }

    const prefix = scope === 'metadata' ? 'meta_' : 'pub_';
    const sortKey = `${prefix}${key}`;
    const { label, sortingOrder = {}, sortingGroup } = filterConfig;

    const options = [];

    if (sortingOrder.asc) {
      options.push({
        key: `-${sortKey}`,
        labelTranslationKey: 'SortBy.numericSortOption',
        translationValues: { fieldLabel: label, direction: 'asc' },
      });
    }
    if (sortingOrder.desc) {
      options.push({
        key: sortKey,
        labelTranslationKey: 'SortBy.numericSortOption',
        translationValues: { fieldLabel: label, direction: 'desc' },
      });
    }

    if (sortingGroup === 'secondary') {
      secondaryOptions.push(...options);
    } else {
      primaryOptions.push(...options);
    }
  });

  return { primaryOptions, secondaryOptions };
};

//////////////////////////////
// Validate Default filters //
//////////////////////////////

const validCategoryConfig = (config, categoryConfiguration) => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  const { key, scope, categoryLevelKeys } = categoryConfiguration;
  // This ensures that flat category structure still uses categoryLevel1 key
  const isNestedEnum = true;
  const nestedParams = categoryLevelKeys;

  // Note: this adds more configurations to category filter configs
  // - The scope unifies the URL parameter handling (category is behaving like built-in, but handled through public data)
  // - isNestedEnum & nestedParams help to reason out if multiple URL search parameters are needed or not.
  return { key, schemaType: 'category', scope, isNestedEnum, nestedParams };
};

const validListingTypeSearchConfig = (config, listingTypeConfig) => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  const options = (listingTypeConfig || []).map(lt => ({
    option: lt.listingType,
    label: lt.label,
  }));

  return {
    key: 'listingType',
    schemaType: 'listingType',
    scope: 'public',
    options,
  };
};

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

const validSeatsConfig = config => {
  const { enabled = true, label = 'Seats' } = config;
  const isValidLabel = typeof label === 'string';

  if (!(enabled && isValidLabel)) {
    return null;
  }

  return { key: 'seats', schemaType: 'seats', label };
};

const isNonNegativeInteger = value => Number.isInteger(value) && value >= 0;

const validPriceConfig = (config, issues) => {
  const { enabled = true, label = 'Price', min = 0, max = 1000, step = 5 } = config;

  if (!enabled) {
    return null;
  }

  const isValidLabel = typeof label === 'string';
  const isValidMin = isNonNegativeInteger(min);
  const isValidMax = isNonNegativeInteger(max);
  const isValidStep = typeof step === 'number';

  if (!(isValidLabel && isValidMin && isValidMax && isValidStep)) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'SEARCH_PRICE_FILTER_INVALID_BOUNDS',
        message: `The price filter min and max must be whole numbers of 0 or more (got min=${min}, max=${max}). The price filter was dropped.`,
      })
    );
    return null;
  }

  const isMaxBigger = max > min;
  if (!isMaxBigger) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'SEARCH_PRICE_FILTER_INVALID_RANGE',
        message: `The price filter minimum (${min}) must be smaller than the maximum (${max}). The price filter was dropped.`,
      })
    );
    return null;
  }

  return { key: 'price', schemaType: 'price', label, min, max, step };
};

const validKeywordsConfig = config => {
  const { enabled = true } = config;

  if (!enabled) {
    return null;
  }

  return { key: 'keywords', schemaType: 'keywords' };
};

const validDefaultFilters = (defaultFilters, categoryConfiguration, listingTypeConfig, issues) => {
  return defaultFilters
    .map(data => {
      if (!data) {
        return null;
      }
      const schemaType = data.schemaType;
      return schemaType === 'category'
        ? validCategoryConfig(data, categoryConfiguration)
        : schemaType === 'listingType'
        ? validListingTypeSearchConfig(data, listingTypeConfig)
        : schemaType === 'dates'
        ? validDatesConfig(data)
        : schemaType === 'seats'
        ? validSeatsConfig(data)
        : schemaType === 'price'
        ? validPriceConfig(data, issues)
        : schemaType === 'keywords'
        ? validKeywordsConfig(data)
        : data;
    })
    .filter(Boolean);
};

//////////////////////////
// Validate sort config //
//////////////////////////

const validSortConfig = config => {
  const active = typeof config?.active === 'boolean' ? config.active : true;
  const queryParamName = config?.queryParamName || 'sort';
  const relevanceKey = config?.relevanceKey || 'relevance';
  const relevanceFilter = config?.relevanceFilter || 'keywords';
  const conflictingFilters = config?.conflictingFilters || [];
  const optionsRaw = config?.options || [];
  const options = optionsRaw.filter(o => !!o.key && !!(o.label || o.labelTranslationKey));
  return { active, queryParamName, relevanceKey, relevanceFilter, conflictingFilters, options };
};

/**
 * Merge hosted default-sorting toggles with built-in sort options and listing-field sorts.
 * @param {Object|null|undefined} hostedSortConfig contains hosted sorting.defaultSortingOptions
 * @param {Object} defaultSortConfig built-in sortConfig
 * @param {boolean} omitRelevance when true (location main search), drop relevance option
 * @param {Array} listingFields resolved listing fields (may contribute numeric sort options)
 * @returns {Object}
 */
export const mergeSortConfig = (
  hostedSortConfig,
  defaultSortConfig,
  omitRelevance,
  listingFields
) => {
  const sortDefaults = defaultSortConfig || {
    active: true,
    queryParamName: 'sort',
    relevanceKey: 'relevance',
    relevanceFilter: 'keywords',
    conflictingFilters: [],
    options: [],
  };

  // Drop built-in sort options whose hosted toggle is off
  const removeByKey = {
    createdAt: !hostedSortConfig?.newest,
    '-createdAt': !hostedSortConfig?.oldest,
    '-price': !hostedSortConfig?.lowestPrice,
    price: !hostedSortConfig?.highestPrice,
    relevance: !hostedSortConfig?.relevance || omitRelevance,
  };

  // In addition to the search configuration, additional sort options can be configured
  // through listing fields. getSortOptionsFromListingFields iterates through the listing fields
  // and returns primaryOptions and secondaryOptions. primaryOptions are prepended to the
  // sort options and secondaryOptions are appended.
  const { primaryOptions, secondaryOptions } = getSortOptionsFromListingFields(listingFields);
  // If hosted sorting toggles are missing, keep all built-in options
  const defaultOptions = Array.isArray(sortDefaults.options) ? sortDefaults.options : [];
  const filteredDefaults =
    hostedSortConfig == null
      ? defaultOptions
      : defaultOptions.filter(option => !removeByKey[option.key]);
  const options = [...primaryOptions, ...filteredDefaults, ...secondaryOptions];

  return {
    ...sortDefaults,
    // Disable SortBy component if there are less than 2 options
    active: options.length > 1,
    options: options,
  };
};

/**
 * Merge hosted search config with built-in search defaults, categoryConfiguration, and listing.
 *
 * @param {Object} hostedSearchConfig data from the search hosted asset (normalized)
 * @param {Object} defaultSearchConfig built-in defaults from defaultSearch.js
 * @param {Object} categoryConfiguration resolved categoryConfiguration
 * @param {Array} listingTypeConfig resolved listing.listingTypes
 * @param {Array} listingFieldsConfig resolved listing.listingFields
 * @param {Array} [issues] optional array to push warn issues into
 * @returns {Object} app-config search object
 */
export const mergeSearchConfig = (
  hostedSearchConfig,
  defaultSearchConfig,
  categoryConfiguration,
  listingTypeConfig,
  listingFieldsConfig,
  issues = []
) => {
  const listingFields = Array.isArray(listingFieldsConfig) ? listingFieldsConfig : [];
  const listingTypes = Array.isArray(listingTypeConfig) ? listingTypeConfig : [];
  const categoriesConfig = categoryConfiguration || emptyCategoryConfiguration;

  // mainSearch is required on a complete hosted search asset; its presence means hosted search exists.
  // If absent, still merge sort options from listing fields (numeric showSorting).
  const searchConfig = hostedSearchConfig?.mainSearch
    ? {
        // Built-in listingType/category filters may be overwritten by hostedSearchConfig
        listingTypeFilter: defaultSearchConfig.listingTypeFilter,
        categoryFilter: defaultSearchConfig.categoryFilter,
        ...hostedSearchConfig,
        // Hosted asset does not include sortConfig; keep merged options last.
        sortConfig: mergeSortConfig(
          hostedSearchConfig?.sorting?.defaultSortingOptions,
          defaultSearchConfig.sortConfig,
          hostedSearchConfig?.mainSearch?.searchType === 'location',
          listingFields
        ),
      }
    : {
        ...defaultSearchConfig,
        // Fixed arity + sortConfig last so listing-field options are not overwritten by defaults.
        sortConfig: mergeSortConfig(null, defaultSearchConfig.sortConfig, false, listingFields),
      };

  const {
    mainSearch,
    categoryFilter,
    listingTypeFilter,
    dateRangeFilter,
    seatsFilter,
    priceFilter,
    keywordsFilter,
    sortConfig,
    ...rest
  } = searchConfig || {};
  const searchType = MAIN_SEARCH_TYPES.includes(mainSearch?.searchType)
    ? mainSearch?.searchType
    : 'keywords';

  // keywordsFilter is only available with location main search (forced off for keywords).
  const keywordsFilterEnabled = keywordsFilter?.enabled === true;
  if (searchType === 'keywords' && keywordsFilterEnabled) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'SEARCH_KEYWORDS_FILTER_DISABLED_FOR_KEYWORDS_SEARCH',
        message:
          'The keywords filter cannot be used when the main search is already keyword-based. It was turned off.',
      })
    );
  }

  // seatsFilter is only available when the date range filter is enabled.
  const isDateRangeEnabled = !!dateRangeFilter && dateRangeFilter.enabled !== false;
  const seatsFilterEnabled = seatsFilter?.enabled === true;
  if (!isDateRangeEnabled && seatsFilterEnabled) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'SEARCH_SEATS_FILTER_DISABLED_WITHOUT_DATES',
        message:
          'The seats filter only works when the date range filter is enabled. It was turned off.',
      })
    );
  }

  const categoryFilterMaybe =
    categoryFilter && categoriesConfig.categories?.length > 0 ? [categoryFilter] : [];
  const keywordsFilterMaybe =
    searchType === 'keywords'
      ? []
      : keywordsFilterEnabled
      ? [{ key: 'keywords', schemaType: 'keywords' }]
      : defaultSearchConfig.keywordsFilter
      ? [defaultSearchConfig.keywordsFilter]
      : [];

  const seatsFilterMaybe =
    isDateRangeEnabled && typeof seatsFilter?.enabled === 'boolean' ? [seatsFilter] : [];

  const listingTypeFilterMaybe =
    typeof listingTypeFilter?.enabled === 'boolean' ? [listingTypeFilter] : [];

  // This will define the order of default filters
  // The reason: These default filters come from config assets and
  // there they'll be their own separate entities and not wrapped in an array.
  // Note: The category filter might affect the visibility of custom filters (listing fields).
  //       It might be somewhat strange experience if a primary filter is among those filters
  //       that are affected by category selection.
  const defaultFilters = [
    ...listingTypeFilterMaybe,
    ...categoryFilterMaybe,
    dateRangeFilter,
    ...seatsFilterMaybe,
    priceFilter,
    ...keywordsFilterMaybe,
  ];

  return {
    mainSearch: { searchType },
    defaultFilters: validDefaultFilters(defaultFilters, categoriesConfig, listingTypes, issues),
    sortConfig: validSortConfig(sortConfig),
    ...rest,
  };
};

/**
 * Shape the hosted search asset only (not built-in defaults).
 * @param {Object} hostedSlices values keyed by searchConfig.assetKeys (`search`)
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.search;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }
  return { ...hostedSlice };
};

/**
 * Soft-check the normalized hosted search slice only — does not read or merge built-ins.
 * Drops invalid mainSearch.searchType (resolve falls back). Filter incompatibilities
 * (keywords/seats/price) are warned from mergeSearchConfig via ctx.issues in resolve.
 *
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }} sanitized hosted slice + configIssues
 */
const validate = normalized => {
  const issues = [];
  const value = isPlainObject(normalized) ? { ...normalized } : {};

  const hostedSearchType = value.mainSearch?.searchType;
  const hasInvalidSearchType =
    value.mainSearch &&
    typeof value.mainSearch === 'object' &&
    hostedSearchType != null &&
    !MAIN_SEARCH_TYPES.includes(hostedSearchType);

  if (hasInvalidSearchType) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'SEARCH_INVALID_MAIN_SEARCH_TYPE',
        message: `Main search type "${hostedSearchType}" is not supported. Use "location" or "keywords". Falling back to the built-in default.`,
      })
    );
    value.mainSearch = { ...value.mainSearch };
    delete value.mainSearch.searchType;
  }

  return { value, issues };
};

/**
 * Build final `config.search`: merge validated hosted slice with built-in defaults and
 * earlier handler output. Pushes merge-time warns onto `ctx.issues` when present
 * (applyConfigHandlers collects them into configIssues).
 *
 * `ctx` is required because search depends on:
 * - `ctx.resolved.categoryConfiguration` — whether to include the category filter and its
 *   nested `categoryLevel*` keys
 * - `ctx.resolved.listing.listingTypes` — options for the listing-type filter
 * - `ctx.resolved.listing.listingFields` — numeric fields with `showSorting` become extra
 *   sort options
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.search`)
 * @param {Object} ctx builder context (`resolved…`, optional `issues`)
 * @returns {Object} app-config search object
 */
const resolve = (validated, defaults, ctx = {}) =>
  mergeSearchConfig(
    validated,
    defaults?.search || {},
    ctx?.resolved?.categoryConfiguration || emptyCategoryConfiguration,
    ctx?.resolved?.listing?.listingTypes || [],
    ctx?.resolved?.listing?.listingFields || [],
    Array.isArray(ctx?.issues) ? ctx.issues : []
  );

/**
 * Config handler for the `search` app-config key.
 *
 * - id: `search`
 * - assetKeys: `search`
 * - Depends on `ctx.resolved.categoryConfiguration` and `ctx.resolved.listing`
 * - Pipeline: normalize → validate (hosted only) → resolve (mergeSearchConfig)
 */
export const searchConfig = {
  id: 'search',
  assetKeys: ['search'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
