import { reverseGeocoding } from './mapbox';

const convertCountryToCurrency = countryName => {
  switch (countryName) {
    case 'United States':
    case 'United States Minor Outlying Islands':
      return 'USD';
    case 'Canada':
      return 'CAD';
    default:
      return null;
  }
};

export const getUserCurrency = async position => {
  try {
    const { latitude, longitude } = position.coords;
    const data = await reverseGeocoding(latitude, longitude);
    const countryName = data.features[0]?.place_name;
    return convertCountryToCurrency(countryName);
  } catch (error) {
    console.error('Error fetching user currency:', error);
    return null;
  }
};
