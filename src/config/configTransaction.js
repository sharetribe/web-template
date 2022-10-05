/////////////////////////////////////////////////////
// Configurations related to transaction processes //
/////////////////////////////////////////////////////

// A presets of supported transaction configurations
export const transactionTypes = [
  {
    type: 'sell-bicycles',
    label: 'Sell bicycles',
    process: 'flex-product-default-process',
    alias: 'release-1',
    unitType: 'item',
    showStock: false,
  },
  {
    type: 'rent-bicycles-daily',
    label: 'Rent bicycles: daily',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'day',
  },
  {
    type: 'rent-bicycles-nightly',
    label: 'Rent bicycles: nightly',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'night',
  },
  {
    type: 'rent-bicycles-hourly',
    label: 'Rent bicycles: hourly',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'hour',
  },
];

// NOTE: SearchPage enforces searching of listings with valid transactionType, process and unitType
//       However, it only works if you have set 'enum' type search schema for the public data fields
//        - transactionType
//        - transactionProcessAlias
//        - unitType
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
