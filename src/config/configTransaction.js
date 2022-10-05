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
    type: 'rent-bicycles',
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
