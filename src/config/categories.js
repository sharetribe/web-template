export const CATEGORIES = {
    'location': {
      id: 'location',
      label: 'Vending location'
    },
    'machine': {
      id: 'machine',
      label: 'Vending machine'
    },
    'location-machine': {
      id: 'location-machine',
      label: 'Location with machine'
    },
    'atm-location': {
      id: 'atm-location',
      label: 'ATM at location'
    },
    'location-find': {
      id: 'location-find',
      label: 'Location finding service'
    },
    'location-bid': {
      id: 'location-bid',
      label: 'Location request bid'
    }
  };
  
  export const getCategoryLabel = categoryId => {
    return CATEGORIES[categoryId]?.label || categoryId;
  };