/////////////////////////////////////////////////////////
// Configurations related to listing.                  //
// Main configuration here is the extended data config //
/////////////////////////////////////////////////////////

// Note: The listingFields come from listingFields asset nowadays by default.
//       To use this built-in configuration, you need to change the overwrite from configHelper.js
//       (E.g. use mergeDefaultTypesAndFieldsForDebugging func)

/**
 * Configuration options for listing fields (custom extended data fields):
 * - key:                           Unique key for the extended data field.
 * - scope (optional):              Scope of the extended data can be either 'public' or 'private'.
 *                                  Default value: 'public'.
 *                                  Note: listing doesn't support 'protected' scope atm.
 * - schemaType (optional):         Schema for this extended data field.
 *                                  This is relevant when rendering components and querying listings.
 *                                  Possible values: 'enum', 'multi-enum', 'text', 'long', 'boolean'.
 * - enumOptions (optional):        Options shown for 'enum' and 'multi-enum' extended data.
 *                                  These are used to render options for inputs and filters on
 *                                  EditListingPage, ListingPage, and SearchPage.
 * - listingTypeConfig (optional):  Relationship configuration against listing types.
 *   - limitToListingTypeIds:         Indicator whether this listing field is relevant to a limited set of listing types.
 *   - listingTypeIds:                An array of listing types, for which this custom listing field is
 *                                    relevant and should be added. This is mandatory if limitToListingTypeIds is true.
 * - categoryConfig (optional):     Relationship configuration against categories.
 *   - limitToCategoryIds:            Indicator whether this listing field is relevant to a limited set of categories.
 *   - categoryIds:                   An array of categories, for which this custom listing field is
 *                                    relevant and should be added. This is mandatory if limitToCategoryIds is true.
 * - filterConfig:                  Filter configuration for listings query.
 *    - indexForSearch (optional):    If set as true, it is assumed that the extended data key has
 *                                    search index in place. I.e. the key can be used to filter
 *                                    listing queries (then scope needs to be 'public').
 *                                    Note: Flex CLI can be used to set search index for the key:
 *                                    https://www.sharetribe.com/docs/references/extended-data/#search-schema
 *                                    Read more about filtering listings with public data keys from API Reference:
 *                                    https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
 *                                    Default value: false,
 *   - filterType:                    Sometimes a single schemaType can be rendered with different filter components.
 *                                    For 'enum' schema, filterType can be 'SelectSingleFilter' or 'SelectMultipleFilter'
 *   - label:                         Label for the filter, if the field can be used as query filter
 *   - searchMode (optional):         Search mode for indexed data with multi-enum schema.
 *                                    Possible values: 'has_all' or 'has_any'.
 *   - group:                         SearchPageWithMap has grouped filters. Possible values: 'primary' or 'secondary'.
 * - showConfig:                    Configuration for rendering listing. (How the field should be shown.)
 *   - label:                         Label for the saved data.
 *   - isDetail                       Can be used to hide detail row (of type enum, boolean, or long) from listing page.
 *                                    Default value: true,
 * - saveConfig:                    Configuration for adding and modifying extended data fields.
 *   - label:                         Label for the input field.
 *   - placeholderMessage (optional): Default message for user input.
 *   - isRequired (optional):         Is the field required for providers to fill
 *   - requiredMessage (optional):    Message for those fields, which are mandatory.
 */
export const listingFields = [
  // {
  //   "scope": "public",
  //   "label": "Gears",
  //   "key": "gears",
  //   "schemaType": "long",
  //   "numberConfig": {
  //     "minimum": 1,
  //     "maximum": 24
  //   },
  //   "filterConfig": {
  //     "indexForSearch": true,
  //     "group": "primary",
  //     "label": "Gears"
  //   }
  // }
  // {
  //   key: 'bikeType',
  //   scope: 'public',
  //   schemaType: 'enum',
  //   enumOptions: [
  //     { option: 'city-bikes', label: 'City bikes' },
  //     { option: 'electric-bikes', label: 'Electric bikes' },
  //     { option: 'mountain-bikes', label: 'Mountain bikes' },
  //     { option: 'childrens-bikes', label: "Children's bikes" },
  //   ],
  //   categoryConfig: {
  //     limitToCategoryIds: true,
  //     categoryIds: ['cats'],
  //   },
  //   filterConfig: {
  //     indexForSearch: true,
  //     filterType: 'SelectMultipleFilter', //'SelectSingleFilter',
  //     label: 'Bike type',
  //     group: 'primary',
  //   },
  //   showConfig: {
  //     label: 'Bike type',
  //     isDetail: true,
  //   },
  //   saveConfig: {
  //     label: 'Bike type',
  //     placeholderMessage: 'Select an option…',
  //     isRequired: true,
  //     requiredMessage: 'You need to select a bike type.',
  //   },
  // },
  // {
  //   key: 'tire',
  //   scope: 'public',
  //   schemaType: 'enum',
  //   enumOptions: [
  //     { option: '29', label: '29' },
  //     { option: '28', label: '28' },
  //     { option: '27', label: '27' },
  //     { option: '26', label: '26' },
  //     { option: '24', label: '24' },
  //     { option: '20', label: '20' },
  //     { option: '18', label: '18' },
  //   ],
  //   filterConfig: {
  //     indexForSearch: true,
  //     label: 'Tire size',
  //     group: 'secondary',
  //   },
  //   showConfig: {
  //     label: 'Tire size',
  //     isDetail: true,
  //   },
  //   saveConfig: {
  //     label: 'Tire size',
  //     placeholderMessage: 'Select an option…',
  //     isRequired: true,
  //     requiredMessage: 'You need to select a tire size.',
  //   },
  // },
  // {
  //   key: 'brand',
  //   scope: 'public',
  //   schemaType: 'enum',
  //   enumOptions: [
  //     { option: 'cube', label: 'Cube' },
  //     { option: 'diamant', label: 'Diamant' },
  //     { option: 'ghost', label: 'GHOST' },
  //     { option: 'giant', label: 'Giant' },
  //     { option: 'kalkhoff', label: 'Kalkhoff' },
  //     { option: 'kona', label: 'Kona' },
  //     { option: 'otler', label: 'Otler' },
  //     { option: 'vermont', label: 'Vermont' },
  //   ],
  //   filterConfig: {
  //     indexForSearch: true,
  //     label: 'Brand',
  //     group: 'secondary',
  //   },
  //   showConfig: {
  //     label: 'Brand',
  //     isDetail: true,
  //   },
  //   saveConfig: {
  //     label: 'Brand',
  //     placeholderMessage: 'Select an option…',
  //     isRequired: true,
  //     requiredMessage: 'You need to select a brand.',
  //   },
  // },
  // {
  //   key: 'accessories',
  //   scope: 'public',
  //   schemaType: 'multi-enum',
  //   enumOptions: [
  //     { option: 'bell', label: 'Bell' },
  //     { option: 'lights', label: 'Lights' },
  //     { option: 'lock', label: 'Lock' },
  //     { option: 'mudguard', label: 'Mudguard' },
  //   ],
  //   filterConfig: {
  //     indexForSearch: true,
  //     label: 'Accessories',
  //     searchMode: 'has_all',
  //     group: 'secondary',
  //   },
  //   showConfig: {
  //     label: 'Accessories',
  //   },
  //   saveConfig: {
  //     label: 'Accessories',
  //     placeholderMessage: 'Select an option…',
  //     isRequired: false,
  //   },
  // },
  // // An example of how to use transaction type specific custom fields and private data.
  // {
  //   key: 'note',
  //   scope: 'public',
  //   schemaType: 'text',
  //   listingTypeConfig: {
  //     limitToListingTypeIds: true,
  //     listingTypeIds: ['product-selling'],
  //   },
  //   showConfig: {
  //     label: 'Extra notes',
  //   },
  //   saveConfig: {
  //     label: 'Extra notes',
  //     placeholderMessage: 'Some public extra note about this bike...',
  //   },
  // },
  // {
  //   key: 'privatenote',
  //   scope: 'private',
  //   schemaType: 'text',
  //   listingTypeConfig: {
  //     limitToListingTypeIds: true,
  //     listingTypeIds: ['daily-booking'],
  //   },
  //   saveConfig: {
  //     label: 'Private notes',
  //     placeholderMessage: 'Some private note about this bike...',
  //   },
  // },
];

///////////////////////////////////////////////////////////////////////
// Configurations related to listing types and transaction processes //
///////////////////////////////////////////////////////////////////////

// A presets of supported listing configurations
//
// Note 1: The listingTypes come from listingTypes asset nowadays by default.
//         To use this built-in configuration, you need to change the overwrite from configHelper.js
//         (E.g. use mergeDefaultTypesAndFieldsForDebugging func)
// Note 2: transaction type is part of listing type. It defines what transaction process and units
//         are used when transaction is created against a specific listing.

/**
 * Configuration options for listing experience:
 * - listingType:         Unique string. This will be saved to listing's public data on
 *                        EditListingWizard.
 * - label                Label for the listing type. Used as microcopy for options to select
 *                        listing type in EditListingWizard.
 * - transactionType      Set of configurations how this listing type will behave when transaction is
 *                        created.
 *   - process              Transaction process.
 *                          The process must match one of the processes that this client app can handle
 *                          (check src/util/transactions/transaction.js) and the process must also exists in correct
 *                          marketplace environment.
 *   - alias                Valid alias for the aforementioned process. This will be saved to listing's
 *                          public data as transctionProcessAlias and transaction is initiated with this.
 *   - unitType             Unit type is mainly used as pricing unit. This will be saved to
 *                          transaction's protected data.
 *                          Recommendation: don't use same unit types in completely different processes
 *                          ('item' sold should not be priced the same as 'item' booked).
 * - stockType            This is relevant only to listings using default-purchase process.
 *                        If set to 'oneItem', stock management is not showed and the listing is
 *                        considered unique (stock = 1).
 *                        Possible values: 'oneItem', 'multipleItems', 'infiniteOneItem', and 'infiniteMultipleItems'.
 *                        Default: 'multipleItems'.
 * - availabilityType     This is relevant only to listings using default-booking process.
 *                        If set to 'oneSeat', seat management is not showed and the listing is
 *                        considered per person (seat = 1).
 *                        Possible values: 'oneSeat' and 'multipleSeats'.
 *                        Default: 'oneSeat'.
 * - defaultListingFields These are tied to transaction processes. Different processes have different flags.
 *                        E.g. default-inquiry can toggle price and location to true/false value to indicate,
 *                        whether price (or location) tab should be shown. If defaultListingFields.price is not
 *                        explicitly set to _false_, price will be shown.
 *                        If the location or pickup is not used, listing won't be returned with location search.
 *                        Use keyword search as main search type if location is not enforced.
 *                        The payoutDetails flag allows provider to bypass setting of payout details.
 *                        Note: customers can't order listings, if provider has not set payout details! Monitor
 *                        providers who have not set payout details and contact them to ensure that they add the details.
 */

export const listingTypes = [
  {
    listingType: 'daily-booking',
    label: 'Daily booking',
    transactionType: {
      process: 'default-booking',
      alias: 'default-booking/release-1',
      unitType: 'day',
    },
    availabilityType: 'oneSeat',
    defaultListingFields: {
      location: true,
      payoutDetails: true,
    },
  },
  // // Here are some examples for other listingTypes
  // // TODO: SearchPage does not work well if both booking and product selling are used at the same time
  // {
  //   listingType: 'nightly-booking',
  //   label: 'Nightly booking',
  //   transactionType: {
  //     process: 'default-booking',
  //     alias: 'default-booking/release-1',
  //     unitType: 'night',
  //   },
  // },
  // {
  //   listingType: 'hourly-booking',
  //   label: 'Hourly booking',
  //   transactionType: {
  //     process: 'default-booking',
  //     alias: 'default-booking/release-1',
  //     unitType: 'hour',
  //   },
  // },
  // {
  //   listingType: 'product-selling',
  //   label: 'Sell bicycles',
  //   transactionType: {
  //     process: 'default-purchase',
  //     alias: 'default-purchase/release-1',
  //     unitType: 'item',
  //   },
  //   stockType: 'multipleItems',
  //   defaultListingFields: {
  //     shipping: true,
  //     pickup: true,
  //     payoutDetails: true,
  //   },
  // },
  // {
  //   listingType: 'inquiry',
  //   label: 'Inquiry',
  //   transactionType: {
  //     process: 'default-inquiry',
  //     alias: 'default-inquiry/release-1',
  //     unitType: 'inquiry',
  //   },
  //   defaultListingFields: {
  //     price: false,
  //     location: true,
  //   },
  // },
];

// SearchPage can enforce listing query to only those listings with valid listingType
// However, it only works if you have set 'enum' type search schema for the public data fields
//   - listingType
//
//  Similar setup could be expanded to 2 other extended data fields:
//   - transactionProcessAlias
//   - unitType
//
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
export const enforceValidListingType = false;
