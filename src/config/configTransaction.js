/////////////////////////////////////////////////////
// Configurations related to transaction processes //
/////////////////////////////////////////////////////

// A presets of supported transaction configurations
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

// SearchPage can enforce searching of listings with valid transactionType, process and unitType
// However, it only works if you have set 'enum' type search schema for the public data fields
//   - transactionType
//   - transactionProcessAlias
//   - unitType
//
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
export const enforceValidTransactionType = false;
