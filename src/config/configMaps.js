import defaultLocationSearches from './configDefaultLocationSearches';

//////////////////////////////////////////////////////
// Configurations related to maps and map providers //
//////////////////////////////////////////////////////

// Note: The mapboxAccessToken & googleMapsAPIKey come from map asset nowadays by default.
//       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeMapConfig func)
export const mapboxAccessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
export const googleMapsAPIKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Choose map provider: 'mapbox', 'googleMaps'
// Note: The mapProvider comes from map asset nowadays by default.
//       To use this built-in configuration, you need to remove the overwrite from configHelper.js (mergeMapConfig func)
export const mapProvider = 'mapbox';

// The location search input can be configured to show default
// searches when the user focuses on the input and hasn't yet typed
// anything. This reduces typing and avoids too many Geolocation API
// calls for common searches.
export const search = {
  // When enabled, the first suggestion is "Current location" that
  // uses the browser Geolocation API to query the user's current
  // location.
  suggestCurrentLocation: true,

  // Distance in meters for calculating the bounding box around the
  // current location.
  currentLocationBoundsDistance: 1000,

  // This affects location search.
  // These "default locations" can be edited in the
  // `configDefaultLocationSearches.js` file.
  // NOTE: these are highly recommended, since they
  //       1) help customers to find relevant locations, and
  //       2) reduce the cost of using map providers geocoding API
  defaults: defaultLocationSearches || [],

  // Should search results be ordered by distance to origin.
  // NOTE 1: This doesn't affect if the main search type is 'keywords'
  // NOTE 2: If this is set to true add parameter 'origin' to every location in configDefaultLocationSearches.js
  //         Without the 'origin' parameter, search will not work correctly
  // NOTE 3: Keyword search and ordering search results by distance can't be used at the same time.
  //         You should check that keyword filter is not used in configSearch.js
  sortSearchByDistance: false,

  // Limit location autocomplete to a one or more countries
  // using ISO 3166 alpha 2 country codes separated by commas.
  // If you want to limit the autocomplete, uncomment this value:
  // countryLimit: ['AU'],
};

// When fuzzy locations are enabled, coordinates on maps are
// obfuscated randomly around the actual location.
//
// NOTE: This only hides the locations in the UI level, the actual
// coordinates are still accessible in the HTTP requests and the
// Redux store.
export const fuzzy = {
  enabled: false,

  // Amount of maximum offset in meters that is applied to obfuscate
  // the original coordinates. The actual value is random, but the
  // obfuscated coordinates are withing a circle that has the same
  // radius as the offset.
  offset: 500,

  // Default zoom level when showing a single circle on a Map. Should
  // be small enough so the whole circle fits in.
  defaultZoomLevel: 13,

  // Color of the circle on the Map component.
  circleColor: '#c0392b',
};
