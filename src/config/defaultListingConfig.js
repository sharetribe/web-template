/*
 * Marketplace specific configuration.
 */

/**
 * Active processes.
 * Note: these should match with the process names in src/util/transaction.js
 */
export const processes = ['flex-product-default-process', 'flex-booking-default-process'];

/**
 * Configuration options for extended data fields:
 * - key:                           Unique key for the extended data field.
 * - scope (optional):              Scope of the extended data can be either 'public' or 'private'.
 *                                  Default value: 'public'.
 *                                  Note: listing doesn't support 'protected' scope atm.
 * - includeForProcessAliases:      An array of transaction process aliases, for which the extended
 *                                  data is relevant and should be added.
 * - schemaType (optional):         Schema for this extended data field.
 *                                  This is relevant when rendering components and querying listings.
 *                                  Possible values: 'enum', 'multi-enum', 'text', 'long', 'boolean'.
 * - schemaOptions (optional):      Options shown for 'enum' and 'multi-enum' extended data.
 *                                  These are used to render options for inputs and filters on
 *                                  EditListingPage, ListingPage, and SearchPage.
 * - indexForSearch (optional):     If set as true, it is assumed that the extended data key has
 *                                  search index in place. I.e. the key can be used to filter
 *                                  listing queries (then scope needs to be 'public').
 *                                  Note: Flex CLI can be used to set search index for the key:
 *                                  https://www.sharetribe.com/docs/references/extended-data/#search-schema
 *                                  Read more about filtering listings with public data keys from API Reference:
 *                                  https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
 * - searchPageConfig:              Search-specific configuration.
 *   - filterType:                    Sometimes a single schemaType can be rendered with different filter components.
 *                                    For 'enum' schema, filterType can be 'SelectSingleFilter' or 'SelectMultipleFilter'
 *   - label:                         Label for the filter, if the field can be used as query filter
 *   - searchMode (optional):         Search mode for indexed data with multi-enum schema.
 *                                    Possible values: 'has_all' or 'has_any'.
 *   - group:                         SearchPageWithMap has grouped filters. Possible values: 'primary' or 'secondary'.
 * - listingPageConfig:             Configuration for rendering listing.
 *   - label:                         Label for the saved data.
 * - editListingPageConfig:         Configuration for adding and modifying extended data fields.
 *   - label:                         Label for the input field.
 *   - placeholderMessage (optional): Default message for user input.
 *   - required (optional):           Is the field required for providers to fill
 *   - requiredMessage (optional):    Message for those fields, which are mandatory.
 */
export const listingExtendedData = [
  {
    key: 'category',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: ['Men', 'Women', 'Kids'],
    indexForSearch: true,
    searchPageConfig: {
      filterType: 'SelectSingleFilter',
      label: 'Category',
      group: 'primary',
    },
    listingPageConfig: {
      label: 'Category',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Select category',
      placeholder: 'Choose…',
      required: true,
      requiredMessage: 'You need to select a category.',
    },
  },

  {
    key: 'size',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Size (US)',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Size (US)',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Select size (US)',
      placeholder: 'Choose…',
      required: true,
      requiredMessage: 'You need to select a size.',
    },
  },
  {
    key: 'brand',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: [
      'Adidas',
      'Air Jordan',
      'Converse',
      'New Balance',
      'Nike',
      'Puma',
      'Ultraboost',
      'Vans',
      'Yeezy',
      'Other',
    ],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Brand',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Brand',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Select brand',
      placeholder: 'Choose…',
      required: true,
      requiredMessage: 'You need to select a brand.',
    },
  },
  {
    key: 'category_sauna',
    scope: 'public',
    includeForProcessAliases: ['flex-booking-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: ['Smoky', 'Electric', 'Wood', 'Other'],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Sauna type',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Sauna type',
    },
    editListingPageConfig: {
      label: 'Select Sauna type',
      placeholder: 'Choose…',
      required: true,
      requiredMessage: 'You need to select what type of sauna you have.',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    includeForProcessAliases: ['flex-booking-default-process/release-1'],
    schemaType: 'multi-enum',
    schemaOptions: ['Towels', 'Bathroom', 'Swimming pool', 'Barbeque'],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Sauna amenities',
      searchMode: 'has_all',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Amenities',
    },
    editListingPageConfig: {
      label: 'Select all the amenities you provide',
    },
  },

  {
    key: 'blaa',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'text',
    indexForSearch: true, // TODO not needed probably
    listingPageConfig: {
      label: 'Blaa',
    },
    editListingPageConfig: {
      label: 'Blaa',
      placeholder: 'Blaa bla blaa',
      required: true,
      requiredMessage: 'You need to write something.',
    },
  },
  {
    key: 'note',
    scope: 'private',
    includeForProcessAliases: ['flex-booking-default-process/release-1'],
    schemaType: 'text',
    indexForSearch: false,
    editListingPageConfig: {
      label: 'Private notes',
      placeholder: 'Blaa bla blaa',
    },
  },
  {
    key: 'gears',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'long',
    indexForSearch: true, // TODO There's no filter component available for long
    searchPageConfig: {
      label: 'Gears',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Gears',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Gears',
      placeholder: 'The number of gears',
      required: true,
      requiredMessage: 'You need to add details about gears.',
    },
  },
  {
    key: 'has_lights',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'boolean',
    indexForSearch: true, // TODO There's no filter component available for boolean
    searchPageConfig: {
      label: 'Has lights',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Has lights',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Has lights',
      placeholder: 'Choose yes/no',
      //requiredMessage: 'You need to tell if the bike has lights.',
    },
  },
];

/**
 * Configuration for default filters.
 * These are custom configs for each filter.
 * Common properties: key, schemaType, and label.
 */
export const defaultFilters = [
  // TODO: dates filter should be removed if marketplace is only product marketplace (unitType: 'item')
  {
    key: 'dates',
    schemaType: 'dates',
    label: 'Dates',
    entireRangeAvailable: true,
    // Options: day/night. This affects counting and whether single day picking is possible.
    mode: 'day',
  },
  {
    key: 'price',
    schemaType: 'price',
    label: 'Price',
    // Note: unlike most prices this is not handled in subunits
    min: 0,
    max: 1000,
    step: 5,
  },
  // {
  //   key: 'keywords',
  //   schemaType: 'text',
  //   label: 'Keyword',
  // },
];

export const sortConfig = {
  // Enable/disable the sorting control in the SearchPage
  active: true,

  // Note: queryParamName 'sort' is fixed,
  // you can't change it since Flex API expects it to be named as 'sort'
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
    { key: 'createdAt', label: 'Newest' },
    { key: '-createdAt', label: 'Oldest' },
    { key: '-price', label: 'Lowest price' },
    { key: 'price', label: 'Highest price' },

    // The relevance is only used for keyword search, but the
    // parameter isn't sent to the Marketplace API. The key is purely
    // for handling the internal state of the sorting dropdown.
    { key: 'relevance', label: 'Relevance', longLabel: 'Relevance (Keyword search)' },
  ],
};
