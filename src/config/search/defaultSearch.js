//////////////////////////////////////////////////////////////////////
// Configurations related to search                                 //
// Note: some search experience is also on defaultMapsConfig        //
// and defaultListingConfig.js is responsible public data filtering //
//////////////////////////////////////////////////////////////////////

// NOTE: if you want to change the structure of the data,
// you should also check src/util/configHelpers.js
// some validation is added there.

// Main search used in Topbar.
// This can be either 'keywords' or 'location'.
// Note: The mainSearch comes from the listing-search asset nowadays by default.
//       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeSearchConfig func)
export const mainSearch = {
  searchType: 'location',
};

/**
 * Configuration for default filters.
 * These are custom configs for each filter.
 * Common properties: key, schemaType, and label.
 * Note: the order of default filters is defined in util/configHelpers.js
 * To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeSearchConfig func)
 */

export const listingTypeFilter = {
  enabled: false,
  schemaType: 'listingType',
  // schemaType, key, and other built-in config values are completely filled in configHelper.js
};

export const categoryFilter = {
  enabled: false,
  schemaType: 'category',
  // schemaType, key, and other built-in config values are completely filled in configHelper.js
};

export const dateRangeFilter = {
  schemaType: 'dates',
  // Should the entire date range be available, or just part of it
  // Note: Since we don't enforce location search for dates filtering,
  //       we don't use API's 'time-full' in actual queries. It would require time zone info.
  availability: 'time-full', // time-partial
  // Options: day/night. This affects counting and whether single day picking is possible.
  dateRangeMode: 'day',
};

/**
 * Note: the order of default filters is defined in util/configHelpers.js
 * To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeSearchConfig func)
 */
export const priceFilter = {
  schemaType: 'price',
  // Note: unlike most prices this is not handled in subunits
  min: 0,
  max: 1000,
  step: 5,
};
// // This is not in use by default.
// export const keywordsFilter = {
//   key: 'keywords',
//   schemaType: 'keywords',
// }

export const sortConfig = {
  // Enable/disable the sorting control in the SearchPage
  active: true,

  // Note: queryParamName 'sort' is fixed,
  // you can't change it since Marketplace API expects it to be named as 'sort'
  queryParamName: 'sort',

  // Internal key for the relevance option, see notes below.
  relevanceKey: 'relevance',

  // Relevance key is used with keywords filter.
  // Keywords filter also sorts results according to relevance.
  relevanceFilter: 'keywords',

  // Keyword filter is sorting the results by relevance.
  // If keyword filter is active, one might want to disable other sorting options
  // by adding 'keywords' to this list.
  conflictingFilters: [],

  options: [
    // These are default sort options
    { key: 'createdAt', labelTranslationKey: 'SortBy.newest' },
    { key: '-createdAt', labelTranslationKey: 'SortBy.oldest' },
    { key: '-price', labelTranslationKey: 'SortBy.lowestPrice' },
    { key: 'price', labelTranslationKey: 'SortBy.highestPrice' },
    // If you add own sort options, you can also use label key: { key: 'meta_rating', label: 'Highest rated' },

    // The relevance is only used for keyword search, but the
    // parameter isn't sent to the Marketplace API. The key is purely
    // for handling the internal state of the sorting dropdown.
    {
      key: 'relevance',
      labelTranslationKey: 'SortBy.relevance',
      labelTranslationKeyLong: 'SortBy.relevanceLong',
    },
  ],
};
