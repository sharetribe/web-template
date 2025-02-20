export const CATEGORIES = {
  LOCATION: 'location',
  MACHINE: 'machine',
  LOCATION_MACHINE: 'location-machine',
  ATM_LOCATION: 'atm-location',
  LOCATION_FIND: 'location-find',
  PARTS: 'parts',
  SERVICES: 'services',
};

export const LISTING_TYPE_CATEGORIES = {
  sell: {
    label: 'Sell a Location (with or without machine)',
    categories: [CATEGORIES.LOCATION, CATEGORIES.LOCATION_MACHINE, CATEGORIES.ATM_LOCATION],
  },
  'sell-machine': {
    label: 'Sell a Machine',
    categories: [CATEGORIES.MACHINE],
  },
  'sell-service': {
    label: 'Sell a Service',
    categories: [CATEGORIES.SERVICES, CATEGORIES.LOCATION_FIND],
  },
  'sell-parts': {
    label: 'Sell Parts',
    categories: [CATEGORIES.PARTS],
  },
};
