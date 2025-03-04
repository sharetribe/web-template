import config from '../../config/configDefault';

const MAPBOX_API_BASE_URL = 'https://api.mapbox.com';

const get = async (path, query) => {
  if (typeof window === 'undefined') {
    return {};
  }

  const queryString = !query ? '' : `?${new URLSearchParams(query).toString()}`;
  const url = `${MAPBOX_API_BASE_URL}${path}${queryString}`;
  const options = {
    method: 'GET',
    referrer: 'origin',
  };

  try {
    const response = await window.fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('fetch-mapbox-failed', error);
    return {};
  }
};

export const reverseGeocoding = (latitude, longitude) => {
  return get(`/geocoding/v5/mapbox.places/${longitude},${latitude}.json`, {
    types: 'region,country',
    access_token: config.maps.mapboxAccessToken,
  });
};
