export const CATEGORIES = {
  LOCATION: 'location',
  MACHINE: 'machine',
  LOCATION_MACHINE: 'location-machine',
  ATM_LOCATION: 'atm-location',
  LOCATION_FIND: 'location-find',
  PARTS: 'parts',
  SERVICES: 'services',
};

export const LISTING_TYPES = {
  SELL: 'sell',
  SELL_MACHINE: 'sell-machine',
  SELL_SERVICE: 'sell-service',
  SELL_PARTS: 'sell-parts',
};

export const LISTING_TYPE_CATEGORIES = {
  [LISTING_TYPES.SELL]: {
    label: 'Sell a Location (with or without machine)',
    categories: [CATEGORIES.LOCATION, CATEGORIES.LOCATION_MACHINE, CATEGORIES.ATM_LOCATION],
  },
  [LISTING_TYPES.SELL_MACHINE]: {
    label: 'Sell a Machine',
    categories: [CATEGORIES.MACHINE],
  },
  [LISTING_TYPES.SELL_SERVICE]: {
    label: 'Sell a Service',
    categories: [CATEGORIES.SERVICES, CATEGORIES.LOCATION_FIND],
  },
  [LISTING_TYPES.SELL_PARTS]: {
    label: 'Sell Parts',
    categories: [CATEGORIES.PARTS],
  },
};
