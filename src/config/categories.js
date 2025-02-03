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
      label: 'Location with machine(s)'
    },
    'atm-location': {
      id: 'atm-location',
      label: 'ATM at location'
    }
  };
  
  export const getCategoryLabel = categoryId => {
    return CATEGORIES[categoryId]?.label || categoryId;
  };