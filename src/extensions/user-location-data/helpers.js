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

export const getUserLocationData = async position => {
  try {
    const { latitude, longitude } = position.coords;
    const data = await reverseGeocoding(latitude, longitude);
    const countryName = data.features[1]?.place_name;
    return {currency: convertCountryToCurrency(countryName), region: data.features[0].text};
  } catch (error) {
    console.error('Error fetching user location data:', error);
    return null;
  }
};
