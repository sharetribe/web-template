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
  },
  {
    type: 'rent-bicycles',
    label: 'Rent bicycles',
    process: 'flex-booking-default-process',
    alias: 'release-1',
    unitType: 'day',
  },
];
