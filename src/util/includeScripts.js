import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { useRouteConfiguration } from '../context/routeConfigurationContext';
import { matchPathname } from '../util/routes';

const MAPBOX_SCRIPT_ID = 'mapbox_GL_JS';
const GOOGLE_MAPS_SCRIPT_ID = 'GoogleMapsApi';
const STRIPE_SCRIPT_ID = 'stripe_js_v3';

/** Dispatched on `window` when Stripe.js has loaded (`window.Stripe` is available). */
export const STRIPE_JS_LOADED_EVENT = 'stripe-js-loaded';

const dispatchStripeJsLoadedEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STRIPE_JS_LOADED_EVENT));
  }
};

/**
 * Map library is shown on some of the pages, but ReusableMapContainer is used app wide.
 * However, we can defer the map library loading on pages that don't show the map immediately.
 * Note: this currently only affects Mapbox library.
 * Google Maps library is always loaded immediately. (It seems to be more fragile when loaded asynchronously.)
 *
 * @param {string} initialPathname - The initial pathname at the time of the full page load.
 * @param {array} routeConfiguration - The route configuration.
 * @returns {boolean} - True if the map library can be deferred, false otherwise.
 */
const canDeferMapLibrary = (initialPathname, routeConfiguration) => {
  if (!initialPathname) {
    return false;
  }
  const matchedRoutes = matchPathname(initialPathname, routeConfiguration);
  const currentRouteConfig = matchedRoutes.length > 0 ? matchedRoutes[0]?.route : null;
  return currentRouteConfig?.prioritizeLibraryLoading?.map !== true;
};
const canDeferStripeLibrary = (initialPathname, routeConfiguration) => {
  if (!initialPathname) {
    return false;
  }
  const matchedRoutes = matchPathname(initialPathname, routeConfiguration);
  const currentRouteConfig = matchedRoutes.length > 0 ? matchedRoutes[0]?.route : null;
  return currentRouteConfig?.prioritizeLibraryLoading?.stripe !== true;
};

/**
 * Include scripts (like Map Provider).
 * These scripts are relevant for whole application: location search in Topbar and maps on different pages.
 * However, if you don't need location search and maps, you can just omit this component from app.js
 * Note: another common point to add <scripts>, <links> and <meta> tags is Page.js.
 *       Stripe.js is injected here when `stripe.publishableKey` is set; consumers can
 *       wait for {@link STRIPE_JS_LOADED_EVENT} on `window` if the script may still be loading.
 *
 * Note 2: When adding new external scripts/styles/fonts/etc.,
 *         if a Content Security Policy (CSP) is turned on, the new URLs
 *         should be whitelisted in the policy. Check: server/csp.js
 */
export const IncludeScripts = props => {
  const { marketplaceRootURL: rootURL, maps, analytics, stripe } = props?.config || {};
  const { googleAnalyticsId, plausibleDomains } = analytics;

  const routeConfiguration = useRouteConfiguration();
  // Note: Affects Mapbox only. Google Maps initialization is not yet ready to support asynchronous loading.
  const deferMapLibrary = canDeferMapLibrary(props?.initialPathname, routeConfiguration)
    ? { defer: '' }
    : {};

  const { mapProvider, googleMapsAPIKey, mapboxAccessToken } = maps || {};
  const isGoogleMapsInUse = mapProvider === 'googleMaps';
  const isMapboxInUse = mapProvider === 'mapbox';

  // Add Google Analytics script if correct id exists (it should start with 'G-' prefix)
  // See: https://developers.google.com/analytics/devguides/collection/gtagjs
  const hasGoogleAnalyticsv4Id = googleAnalyticsId?.indexOf('G-') === 0;

  // Collect relevant map libraries
  let stripeLibrary = [];
  let mapLibraries = [];
  let analyticsLibraries = [];

  if (stripe?.publishableKey) {
    const deferStripeLibrary = canDeferStripeLibrary(props?.initialPathname, routeConfiguration)
      ? { defer: '' }
      : {};

    // Stripe script should be on every page, not just the pages that use the API:
    // https://docs.stripe.com/js/including
    stripeLibrary.push(
      <script
        id={STRIPE_SCRIPT_ID}
        key="stripe_js_v3"
        src="https://js.stripe.com/v3/"
        crossOrigin="anonymous"
        {...deferStripeLibrary}
      ></script>
    );
  }

  if (isMapboxInUse) {
    // NOTE: remember to update mapbox-sdk.min.js to a new version regularly.
    // mapbox-sdk.min.js is included from static folder for CSP purposes.
    mapLibraries.push(
      <script
        key="mapboxSDK"
        src={`${rootURL}/static/scripts/mapbox/mapbox-sdk@0.16.2/mapbox-sdk.min.js`}
        async
      ></script>
    );
    // License information for v3.7.0 of the mapbox-gl-js library:
    // https://github.com/mapbox/mapbox-gl-js/blob/v3.7.0/LICENSE.txt

    // Add CSS for Mapbox map
    mapLibraries.push(
      <link
        key="mapbox_GL_CSS"
        href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css"
        rel="stylesheet"
        crossOrigin="anonymous"
      />
    );
    // Add Mapbox library
    mapLibraries.push(
      <script
        id={MAPBOX_SCRIPT_ID}
        key="mapbox_GL_JS"
        src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"
        crossOrigin="anonymous"
        {...deferMapLibrary}
      ></script>
    );
  } else if (isGoogleMapsInUse) {
    // Add Google Maps library
    mapLibraries.push(
      <script
        id={GOOGLE_MAPS_SCRIPT_ID}
        key="GoogleMapsApi"
        src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsAPIKey}&libraries=places`}
        crossOrigin="anonymous"
      ></script>
    );
  }

  if (googleAnalyticsId && hasGoogleAnalyticsv4Id) {
    // Google Analytics: gtag.js
    // NOTE: This template is a single-page application (SPA).
    //       gtag.js sends initial page_view event after page load.
    //       but we need to handle subsequent events for in-app navigation.
    //       This is done in src/analytics/handlers.js
    analyticsLibraries.push(
      <script
        key="gtag.js"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        crossOrigin="anonymous"
      ></script>
    );

    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      // Ensure that gtag function is found from window scope
      window.gtag = function gtag() {
        dataLayer.push(arguments);
      };
      gtag('js', new Date());
      gtag('config', googleAnalyticsId, {
        cookie_flags: 'SameSite=None;Secure',
      });
    }
  }

  if (plausibleDomains) {
    // If plausibleDomains is not an empty string, include their script too.
    analyticsLibraries.push(
      <script
        key="plausible"
        defer
        src="https://plausible.io/js/script.js"
        data-domain={plausibleDomains}
        crossOrigin="anonymous"
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
    window.mapboxgl.accessToken = mapboxAccessToken;
  }

  // If the script is added on client side as a reaction to page navigation or
  // the app is rendered on client side entirely (e.g. HMR/WebpackDevServer),
  // we need to listen when the script is loaded.
  const onMapLibLoaded = () => {
    // At this point we know that map library is loaded after it's dynamically included
    if (isMapboxInUse && !window.mapboxgl.accessToken) {
      // Add access token for Mapbox sdk.
      window.mapboxgl.accessToken = mapboxAccessToken;
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
      const stripeScript = addedTags.scriptTags.find(s => s.id === STRIPE_SCRIPT_ID);
      if (stripeScript) {
        stripeScript.addEventListener('load', dispatchStripeJsLoadedEvent, { once: true });
      }
    }
  };

  // After Helmet writes the Stripe script into the document, either dispatch immediately
  // (Stripe already ran, e.g. cached) or wait for `load` so listeners (e.g. payment forms)
  // can rely on STRIPE_JS_LOADED_EVENT. Complements onChangeClientState for injected tags.
  useEffect(() => {
    if (!stripe?.publishableKey || typeof document === 'undefined') {
      return undefined;
    }
    const script = document.getElementById(STRIPE_SCRIPT_ID);
    if (!script) {
      return undefined;
    }

    if (window.Stripe) {
      dispatchStripeJsLoadedEvent();
      return undefined;
    }

    script.addEventListener('load', dispatchStripeJsLoadedEvent, { once: true });
    return () => {
      script.removeEventListener('load', dispatchStripeJsLoadedEvent);
    };
  }, [stripe?.publishableKey]);

  const allScripts = [...stripeLibrary, ...analyticsLibraries, ...mapLibraries];
  return <Helmet onChangeClientState={onChangeClientState}>{allScripts}</Helmet>;
};
