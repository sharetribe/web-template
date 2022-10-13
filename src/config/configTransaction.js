/////////////////////////////////////////////////////
// Configurations related to transaction processes //
/////////////////////////////////////////////////////

// A presets of supported transaction configurations
//
// Note: With first iteration of hosted configs, we are unlikely to support
//       multiple transaction types, even though this template has some
//       rudimentary support for it.
export const transactionTypes = [
  {
    type: 'product-selling',
    label: 'Sell bicycles',
    process: 'flex-product-default-process',
    alias: 'release-1',
    unitType: 'item',
    showStock: false,
  },
  {
    type: 'daily-booking',
    label: 'Daily booking',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'day',
  },
  {
    type: 'nightly-booking',
    label: 'Nightly booking',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'night',
  },
  {
    type: 'hourly-booking',
    label: 'Hourly booking',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'hour',
  },
];

// SearchPage can enforce listing query to only those listings with valid transactionType
// However, it only works if you have set 'enum' type search schema for the public data fields
//   - transactionType
//
//  Similar setup could be expanded to 2 other extended data fields:
//   - transactionProcessAlias
//   - unitType
//
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
export const enforceValidTransactionType = false;
