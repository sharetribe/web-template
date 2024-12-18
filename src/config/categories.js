export const CATEGORIES = {
    'location': {
      id: 'location',
      label: 'Vending Location'
    },
    'machine': {
      id: 'machine',
      label: 'Vending Machine'
    },
    'location-machine': {
      id: 'location-machine',
      label: 'Location with Machine(s)'
    },
    'atm-location': {
      id: 'atm-location',
      label: 'ATM at Location'
    }
  };
  
  export const getCategoryLabel = categoryId => {
    return CATEGORIES[categoryId]?.label || categoryId;
  };