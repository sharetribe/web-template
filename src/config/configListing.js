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
      placeholderMessage: 'Choose…',
      isRequired: true,
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
      placeholderMessage: 'Choose…',
      isRequired: true,
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
      placeholderMessage: 'Choose…',
      isRequired: true,
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
      placeholderMessage: 'Choose…',
      isRequired: true,
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
      placeholderMessage: 'Blaa bla blaa',
      isRequired: true,
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
      placeholderMessage: 'Blaa bla blaa',
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
      placeholderMessage: 'The number of gears',
      isRequired: true,
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
      placeholderMessage: 'Choose yes/no',
      //requiredMessage: 'You need to tell if the bike has lights.',
    },
  },
];
