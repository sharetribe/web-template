import { types as sdkTypes } from '../util/sdkLoader';

const { LatLng: SDKLatLng, LatLngBounds: SDKLatLngBounds } = sdkTypes;

const isDev = process.env.NODE_ENV === 'development';

/**
 * Extracts the geographic location (origin) from a Google Maps Place object
 * using the new Google Places API structure, and converts it into an SDKLatLng object.
 *
 * @param {google.maps.places.Place} place - An instance of the Google Maps Place class.
 * @returns {SDKLatLng|null} An SDKLatLng object representing the latitude and longitude
 *                           of the place's location.
 *                           Returns null if the place or its location is invalid.
 */
const placeOrigin = place => {
  if (place && place.location) {
    return new SDKLatLng(place.location.lat(), place.location.lng());
  }
  return null;
};

/**
 * Extracts the viewport bounds from a Google Maps Place object using the new Places API,
 * and converts them into an SDKLatLngBounds object.
 *
 * @param {google.maps.places.Place} place - An instance of the Google Maps Place class.
 * @returns {SDKLatLngBounds|null} An SDKLatLngBounds object representing the northeast and
 *                                 southwest corners of the place's viewport.
 *                                 Returns null if the place or its viewport is invalid.
 */
const placeBounds = place => {
  if (place && place.viewport) {
    const ne = place.viewport.getNorthEast();
    const sw = place.viewport.getSouthWest();
    return new SDKLatLngBounds(
      new SDKLatLng(ne.lat(), ne.lng()),
      new SDKLatLng(sw.lat(), sw.lng())
    );
  }
  return null;
};

/**
 * Fetches detailed information about a specific place using the new Google Maps Places API.
 *
 * @param {string} placeId - ID for a place received from the
 * autocomplete service
 * @returns {Promise<Object|undefined>} A promise that resolves to an object containing:
 *   - `adress` (string): The formatted address of the place.
 *   - `origin` (object): The geographic origin of the place (calculated using `placeOrigin`).
 *   - `bounds` (object): The viewport bounds of the place (calculated using `placeBounds`).
 */
export const getPlaceDetails = async placeId => {
  try {
    const place = await new window.google.maps.places.Place({ id: placeId });
    const fields = ['addressComponents', 'formattedAddress', 'viewport', 'id', 'location'];

    await place.fetchFields({ fields: fields });

    return {
      address: place.formattedAddress,
      origin: placeOrigin(place),
      bounds: placeBounds(place),
    };
  } catch (error) {
    if (isDev) {
      console.error(`Could not get details for place id "${placeId}": `, error);
    }
    return error;
  }
};

/**
 * Fetches autocomplete predictions using the new Google Places API.
 *
 * @param {string} search - Place name or address to search
 * @param {object} sessionToken - Token to tie different autocomplete character searches together
 * with getPlaceDetails call
 * @param {object} searchConfigurations - Defines the search configurations that can be used with
 * the autocomplete service. Used to restrict search to specific region (or regions).
 *
 * @returns {Promise<object>} - An object containing the original search query and predictions array:
 *   - `search` (string): The search query.
 *   - `predictions` (array): An array of prediction objects returned from the Google Places API.
 */
export const getPlacePredictions = async (search, sessionToken, searchConfigurations) => {
  try {
    const sessionTokenMaybe = sessionToken ? { sessionToken } : {};
    const request = {
      input: search,
      ...searchConfigurations,
      ...sessionTokenMaybe,
    };

    const {
      suggestions,
    } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

    return {
      search,
      predictions: suggestions || [],
    };
  } catch (error) {
    if (isDev) {
      console.error(
        `Could not get autocomplete suggestions using search query "${search}": `,
        error
      );
    }
    return error;
  }
};

/**
 * Deprecation: use function from src/util/maps.js
 * Cut some precision from bounds coordinates to tackle subtle map movements
 * when map is moved manually
 *
 * @param {LatLngBounds} sdkBounds - bounds to be changed to fixed precision
 * @param {Number} fixedPrecision - integer to be used on tofixed() change.
 *
 * @return {SDKLatLngBounds} - bounds cut to given fixed precision
 */
export const sdkBoundsToFixedCoordinates = (sdkBounds, fixedPrecision) => {
  const fixed = n => Number.parseFloat(n.toFixed(fixedPrecision));
  const ne = new SDKLatLng(fixed(sdkBounds.ne.lat), fixed(sdkBounds.ne.lng));
  const sw = new SDKLatLng(fixed(sdkBounds.sw.lat), fixed(sdkBounds.sw.lng));

  return new SDKLatLngBounds(ne, sw);
};

/**
 * Deprecation: use function from src/util/maps.js
 * Check if given bounds object have the same coordinates
 *
 * @param {LatLngBounds} sdkBounds1 - bounds #1 to be compared
 * @param {LatLngBounds} sdkBounds2 - bounds #2 to be compared
 *
 * @return {boolean} - true if bounds are the same
 */
export const hasSameSDKBounds = (sdkBounds1, sdkBounds2) => {
  if (!(sdkBounds1 instanceof SDKLatLngBounds) || !(sdkBounds2 instanceof SDKLatLngBounds)) {
    return false;
  }
  return (
    sdkBounds1.ne.lat === sdkBounds2.ne.lat &&
    sdkBounds1.ne.lng === sdkBounds2.ne.lng &&
    sdkBounds1.sw.lat === sdkBounds2.sw.lat &&
    sdkBounds1.sw.lng === sdkBounds2.sw.lng
  );
};

/**
 * Calculate a bounding box in the given location
 *
 * @param {latlng} center - center of the bounding box
 * @param {distance} distance - distance in meters from the center to
 * the sides of the bounding box
 *
 * @return {LatLngBounds} bounding box around the given location
 *
 */
export const locationBounds = (latlng, distance) => {
  const bounds = new window.google.maps.Circle({
    center: new window.google.maps.LatLng(latlng.lat, latlng.lng),
    radius: distance,
  }).getBounds();

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return new SDKLatLngBounds(new SDKLatLng(ne.lat(), ne.lng()), new SDKLatLng(sw.lat(), sw.lng()));
};

/**
 * Helper functions for handling Google OverlayView.
 * Based on https://github.com/tomchentw/react-google-maps/blob/v9.4.5/src/utils/OverlayViewHelper.js
 *
 * @param {element} containerElement - map container
 * @param {object} props - map props
 * @return position offset to allow custom position for the OverlayView
 */
export const getOffsetOverride = (containerElement, props) => {
  const { getPixelPositionOffset } = props;
  //
  // Allows the component to control the visual position of the OverlayView
  // relative to the LatLng pixel position.
  //
  if (typeof getPixelPositionOffset === 'function') {
    return getPixelPositionOffset(containerElement.offsetWidth, containerElement.offsetHeight);
  } else {
    return {};
  }
};

/**
 * Helper functions for handling Google OverlayView
 * Based on https://github.com/tomchentw/react-google-maps/blob/v9.4.5/src/utils/OverlayViewHelper.js
 *
 * @param {MapCanvasProjection} mapCanvasProjection - map projection.
 * @param {object} offset - position offset on map canvas.
 * @param {LatLngBounds} bounds - map bounds.
 *
 * @return styles to render the overlay within the projection.
 */
const getLayoutStylesByBounds = (mapCanvasProjection, offset, bounds) => {
  const ne = mapCanvasProjection.fromLatLngToDivPixel(bounds.getNorthEast());
  const sw = mapCanvasProjection.fromLatLngToDivPixel(bounds.getSouthWest());
  if (ne && sw) {
    return {
      left: `${sw.x + offset.x}px`,
      top: `${ne.y + offset.y}px`,
      width: `${ne.x - sw.x - offset.x}px`,
      height: `${sw.y - ne.y - offset.y}px`,
    };
  }
  return {
    left: `-9999px`,
    top: `-9999px`,
  };
};

/**
 * Helper functions for handling Google OverlayView
 * Based on https://github.com/tomchentw/react-google-maps/blob/v9.4.5/src/utils/OverlayViewHelper.js
 *
 * @param {MapCanvasProjection} mapCanvasProjection - map projection.
 * @param {object} offset - position offset on map canvas.
 * @param {LatLng} position - map position/location.
 *
 * @return  styles to render single coordinate pair within the projection.
 */
const getLayoutStylesByPosition = (mapCanvasProjection, offset, position) => {
  const point = mapCanvasProjection.fromLatLngToDivPixel(position);
  if (point) {
    const { x, y } = point;
    return {
      left: `${x + offset.x}px`,
      top: `${y + offset.y}px`,
    };
  }
  return {
    left: `-9999px`,
    top: `-9999px`,
  };
};

/**
 * Helper functions for handling Google OverlayView
 * Based on https://github.com/tomchentw/react-google-maps/blob/v9.4.5/src/utils/OverlayViewHelper.js
 *
 * @param {MapCanvasProjection} mapCanvasProjection - map projection.
 * @param {object} offset - position offset on map canvas.
 * @param {object} props - map props.
 *
 * @return styles to render an area or a single coordinate pair within the projection.
 */
export const getLayoutStyles = (mapCanvasProjection, offset, props) => {
  const createLatLng = (inst, Type) => {
    return new Type(inst.lat, inst.lng);
  };

  const createLatLngBounds = (inst, Type) => {
    return new Type(
      new window.google.maps.LatLng(inst.ne.lat, inst.ne.lng),
      new window.google.maps.LatLng(inst.sw.lat, inst.sw.lng)
    );
  };

  const ensureOfType = (inst, type, factory) => {
    if (inst instanceof type) {
      return inst;
    } else {
      return factory(inst, type);
    }
  };

  if (props.bounds) {
    const bounds = ensureOfType(props.bounds, window.google.maps.LatLngBounds, createLatLngBounds);
    return getLayoutStylesByBounds(mapCanvasProjection, offset, bounds);
  } else {
    const position = ensureOfType(props.position, window.google.maps.LatLng, createLatLng);
    return getLayoutStylesByPosition(mapCanvasProjection, offset, position);
  }
};
