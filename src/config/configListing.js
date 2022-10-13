/////////////////////////////////////////////////////////
// Configurations related to listing.                  //
// Main configuration here is the extended data config //
/////////////////////////////////////////////////////////

// NOTE: if you want to change the structure of the data,
// you should also check src/util/configHelpers.js
// some validation is added there.

/**
 * Configuration options for extended data fields:
 * - key:                           Unique key for the extended data field.
 * - scope (optional):              Scope of the extended data can be either 'public' or 'private'.
 *                                  Default value: 'public'.
 *                                  Note: listing doesn't support 'protected' scope atm.
 * - includeForTransactionTypes:    An array of transaction types, for which the extended
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
 *                                  Default value: false,
 * - searchPageConfig:              Search-specific configuration.
 *   - filterType:                    Sometimes a single schemaType can be rendered with different filter components.
 *                                    For 'enum' schema, filterType can be 'SelectSingleFilter' or 'SelectMultipleFilter'
 *   - label:                         Label for the filter, if the field can be used as query filter
 *   - searchMode (optional):         Search mode for indexed data with multi-enum schema.
 *                                    Possible values: 'has_all' or 'has_any'.
 *   - group:                         SearchPageWithMap has grouped filters. Possible values: 'primary' or 'secondary'.
 * - listingPageConfig:             Configuration for rendering listing.
 *   - label:                         Label for the saved data.
 *   - isDetail                       Can be used to hide detail row (of type enum, boolean, or long) from listing page.
 *                                    Default value: true,
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
    includeForTransactionTypes: [
      'product-selling',
      'daily-booking',
      'nightly-booking',
      'hourly-booking',
    ],
    schemaType: 'enum',
    schemaOptions: [
      { option: 'city-bikes', label: 'City bikes' },
      { option: 'e-bikes', label: 'E-bikes' },
      { option: 'mtb', label: 'MTB' },
      { option: 'kids-bikes', label: 'Kids bikes' },
    ],
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
      placeholderMessage: 'Choose…',
      isRequired: true,
      requiredMessage: 'You need to select a category.',
    },
  },

  {
    key: 'tire-size',
    scope: 'public',
    includeForTransactionTypes: [
      'product-selling',
      'daily-booking',
      'nightly-booking',
      'hourly-booking',
    ],
    schemaType: 'enum',
    schemaOptions: [
      { option: 29, label: '29' },
      { option: 28, label: '28' },
      { option: 27, label: '27' },
      { option: 26, label: '26' },
      { option: 24, label: '24' },
      { option: 20, label: '20' },
      { option: 18, label: '18' },
    ],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Tire size',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Tire size',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Tire size',
      placeholderMessage: 'Choose…',
      isRequired: true,
      requiredMessage: 'You need to select a tire size.',
    },
  },
  {
    key: 'brand',
    scope: 'public',
    includeForTransactionTypes: [
      'product-selling',
      'daily-booking',
      'nightly-booking',
      'hourly-booking',
    ],
    schemaType: 'enum',
    schemaOptions: [
      { option: 'cube', label: 'Cube' },
      { option: 'diamant', label: 'Diamant' },
      { option: 'ghost', label: 'GHOST' },
      { option: 'giant', label: 'Giant' },
      { option: 'kalkhoff', label: 'Kalkhoff' },
      { option: 'kona', label: 'Kona' },
      { option: 'otler', label: 'Otler' },
      { option: 'vermont', label: 'Vermont' },
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
      label: 'Brand',
      placeholderMessage: 'Choose…',
      isRequired: true,
      requiredMessage: 'You need to select a brand.',
    },
  },
  {
    key: 'equipped-with',
    scope: 'public',
    includeForTransactionTypes: [
      'product-selling',
      'daily-booking',
      'nightly-booking',
      'hourly-booking',
    ],
    schemaType: 'multi-enum',
    schemaOptions: [
      { option: 'bell', label: 'Bell' },
      { option: 'lights', label: 'Lights' },
      { option: 'lock', label: 'Lock' },
      { option: 'mudguard', label: 'Mudguard' },
    ],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Equipped with',
      searchMode: 'has_all',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Equipped with',
    },
    editListingPageConfig: {
      label: 'Equipped with',
      placeholderMessage: 'Choose…',
      isRequired: false,
    },
  },

  {
    key: 'extra-note',
    scope: 'public',
    includeForTransactionTypes: ['product-selling'],
    schemaType: 'text',
    listingPageConfig: {
      label: 'Extra notes',
    },
    editListingPageConfig: {
      label: 'Extra notes',
      placeholderMessage: 'Some public extra note about this bike...',
    },
  },
  {
    key: 'private-note',
    scope: 'private',
    includeForTransactionTypes: ['daily-booking'],
    schemaType: 'text',
    editListingPageConfig: {
      label: 'Private notes',
      placeholderMessage: 'Some private note about this bike...',
    },
  },
];
