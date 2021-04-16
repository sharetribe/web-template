import React from 'react';
import { Helmet } from 'react-helmet-async';
import config from '../config';

const MAPBOX_SCRIPT_ID = 'mapbox_GL_JS';
const GOOGLE_MAPS_SCRIPT_ID = 'GoogleMapsApi';

const isGoogleMapsInUse = config.maps.mapProvider === 'GOOGLE_MAPS';
const isMapboxInUse = config.maps.mapProvider === 'MAPBOX';

/**
 * Include Map Provider scripts.
 * These scripts are relevant for whole application: location search in Topbar and maps on different pages.
 * However, if you don't need location search and maps, you can just omit this component from app.js
 * Note: another common point to add <scripts>, <links> and <meta> tags is Page.js
 */
export const IncludeMapLibraryScripts = () => {
  // Collect relevant map libraries
  let mapLibraries = [];

  if (isMapboxInUse) {
    // NOTE: remember to update mapbox-sdk.min.js to a new version regularly.
    // mapbox-sdk.min.js is included from static folder for CSP purposes.
    mapLibraries.push(
      <script
        key="mapboxSDK"
        src={`${config.canonicalRootURL}/static/scripts/mapbox/mapbox-sdk.min.js`}
      ></script>
    );
    // Add CSS for Mapbox map
    mapLibraries.push(
      <link
        key="mapbox_GL_CSS"
        href="https://api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css"
        rel="stylesheet"
      />
    );
    // Add Mapbox library
    mapLibraries.push(
      <script
        id={MAPBOX_SCRIPT_ID}
        key="mapbox_GL_JS"
        src="https://api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.js"
      ></script>
    );
  } else if (isGoogleMapsInUse) {
    // Add Google Maps library
    mapLibraries.push(
      <script
        id={GOOGLE_MAPS_SCRIPT_ID}
        key="GoogleMapsApi"
        src={`https://maps.googleapis.com/maps/api/js?key=${config.maps.googleMapsAPIKey}&libraries=places`}
      ></script>
    );
  }

  const isBrowser = typeof window !== 'undefined';
  const isMapboxLoaded = isBrowser && window.mapboxgl;

  // If Mapbox is loaded, we can set the accessToken already here.
  // This is the execution flow with the production build,
  // since SSR includes those map libraries to <head> of the app.
  if (isMapboxInUse && isMapboxLoaded && !window.mapboxgl.accessToken) {
    // Add access token for Mapbox library
    window.mapboxgl.accessToken = config.maps.mapboxAccessToken;
  }

  // If the script is added on client side as a reaction to page navigation or
  // the app is rendered on client side entirely (e.g. HMR/WebpackDevServer),
  // we need to listen when the script is loaded.
  const onMapLibLoaded = () => {
    // At this point we know that map library is loaded after it's dynamically included
    if (isMapboxInUse && !window.mapboxgl.accessToken) {
      // Add access token for Mapbox sdk.
      window.mapboxgl.accessToken = config.maps.mapboxAccessToken;
    }
  };

  // React Helmet Async doesn't support onLoad prop for scripts.
  // However, it does have onChangeClientState functionality.
  // We can use that to start listen 'load' events when the library is added on client-side.
  const onChangeClientState = (newState, addedTags) => {
    if (addedTags && addedTags.scriptTags) {
      const foundScript = addedTags.scriptTags.find(s =>
        [MAPBOX_SCRIPT_ID, GOOGLE_MAPS_SCRIPT_ID].includes(s.id)
      );
      if (foundScript) {
        foundScript.addEventListener('load', onMapLibLoaded, { once: true });
      }
    }
  };

  return <Helmet onChangeClientState={onChangeClientState}>{mapLibraries}</Helmet>;
};
