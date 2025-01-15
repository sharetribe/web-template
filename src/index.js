/**
 * This is the main entrypoint file for the application.
 *
 * When loaded in the client side, the application is rendered in the
 * #root element.
 *
 * When the bundle created from this file is imported in the server
 * side, the exported `renderApp` function can be used for server side
 * rendering.
 *
 * Note that this file is required for the build process.
 */

// Dependency libs
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { loadableReady } from '@loadable/component';

// Import default styles before other CSS-related modules are imported
// This ensures that the styles in marketplaceDefaults.css are included
// as first ones in the final build CSS build file.
import './styles/marketplaceDefaults.css';

// Configs and store setup
import appSettings from './config/settings';
import defaultConfig from './config/configDefault';
import { LoggingAnalyticsHandler, GoogleAnalyticsHandler } from './analytics/handlers';
import configureStore from './store';

// Utils
import { createInstance, types as sdkTypes } from './util/sdkLoader';
import { mergeConfig } from './util/configHelpers';
import { matchPathname } from './util/routes';
import * as apiUtils from './util/api';
import * as log from './util/log';

// Import relevant global duck files
import { authInfo } from './ducks/auth.duck';
import { fetchAppAssets } from './ducks/hostedAssets.duck';
import { fetchCurrentUser } from './ducks/user.duck';

// Route config
import routeConfiguration from './routing/routeConfiguration';
// App it self
import { ClientApp, renderApp } from './app';

const render = (store, shouldHydrate) => {
  // If the server already loaded the auth information, render the app
  // immediately. Otherwise wait for the flag to be loaded and render
  // when auth information is present.
  const state = store.getState();
  const cdnAssetsVersion = state.hostedAssets.version;
  const authInfoLoaded = state.auth.authInfoLoaded;
  const info = authInfoLoaded ? Promise.resolve({}) : store.dispatch(authInfo());

  info
    .then(() => {
      // Ensure that Loadable Components is ready
      // and fetch hosted assets in parallel before initializing the ClientApp
      return Promise.all([
        loadableReady(),
        store.dispatch(fetchAppAssets(defaultConfig.appCdnAssets, cdnAssetsVersion)),
        store.dispatch(fetchCurrentUser()),
      ]);
    })
    .then(([_, fetchedAppAssets, cu]) => {
      const { translations: translationsRaw, ...rest } = fetchedAppAssets || {};
      // We'll handle translations as a separate data.
      // It's given to React Intl instead of pushing to config Context
      const translations = translationsRaw?.data || {};

      // Rest of the assets are considered as hosted configs
      const configEntries = Object.entries(rest);
      const hostedConfig = configEntries.reduce((collectedData, [name, content]) => {
        return { ...collectedData, [name]: content.data || {} };
      }, {});

      if (shouldHydrate) {
        const container = document.getElementById('root');

        ReactDOMClient.hydrateRoot(
          container,
          <ClientApp store={store} hostedTranslations={translations} hostedConfig={hostedConfig} />,
          { onRecoverableError: log.onRecoverableError }
        );
      } else {
        const container = document.getElementById('root');
        const root = ReactDOMClient.createRoot(container);
        root.render(
          <ClientApp store={store} hostedTranslations={translations} hostedConfig={hostedConfig} />
        );
      }
    })
    .catch(e => {
      log.error(e, 'browser-side-render-failed');
    });
};

const setupAnalyticsHandlers = googleAnalyticsId => {
  let handlers = [];

  // Log analytics page views and events in dev mode
  if (appSettings.dev) {
    handlers.push(new LoggingAnalyticsHandler());
  }

  // Add Google Analytics 4 (GA4) handler if tracker ID is found
  if (googleAnalyticsId) {
    if (googleAnalyticsId.indexOf('G-') !== 0) {
      console.warn(
        'Google Analytics 4 (GA4) should have measurement id that starts with "G-" prefix'
      );
    } else {
      handlers.push(new GoogleAnalyticsHandler());
    }
  }

  return handlers;
};

// If we're in a browser already, render the client application.
if (typeof window !== 'undefined') {
  // set up logger with Sentry DSN client key and environment
  log.setup();

  const baseUrl = appSettings.sdk.baseUrl ? { baseUrl: appSettings.sdk.baseUrl } : {};
  const assetCdnBaseUrl = appSettings.sdk.assetCdnBaseUrl
    ? { assetCdnBaseUrl: appSettings.sdk.assetCdnBaseUrl }
    : {};

  // eslint-disable-next-line no-underscore-dangle
  const preloadedState = window.__PRELOADED_STATE__ || '{}';
  const initialState = JSON.parse(preloadedState, sdkTypes.reviver);
  const sdk = createInstance({
    transitVerbose: appSettings.sdk.transitVerbose,
    clientId: appSettings.sdk.clientId,
    secure: appSettings.usingSSL,
    typeHandlers: apiUtils.typeHandlers,
    ...baseUrl,
    ...assetCdnBaseUrl,
  });

  // Note: on localhost:3000, you need to use environment variable.
  const googleAnalyticsIdFromSSR = initialState?.hostedAssets?.googleAnalyticsId;
  const googleAnalyticsId = googleAnalyticsIdFromSSR || process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
  const analyticsHandlers = setupAnalyticsHandlers(googleAnalyticsId);
  const store = configureStore(initialState, sdk, analyticsHandlers);

  require('./util/polyfills');
  render(store, !!window.__PRELOADED_STATE__);

  if (appSettings.dev) {
    // Expose stuff for the browser REPL
    window.app = {
      appSettings,
      defaultConfig,
      sdk,
      sdkTypes,
      store,
    };
  }
}

// Show warning if CSP is not enabled
const CSP = process.env.REACT_APP_CSP;
const cspEnabled = CSP === 'block' || CSP === 'report';

if (CSP === 'report' && process.env.REACT_APP_ENV === 'production') {
  console.warn(
    'Your production environment should use CSP with "block" mode. Read more from: https://www.sharetribe.com/docs/ftw-security/how-to-set-up-csp-for-ftw/'
  );
} else if (!cspEnabled) {
  console.warn(
    "CSP is currently not enabled! You should add an environment variable REACT_APP_CSP with the value 'report' or 'block'. Read more from: https://www.sharetribe.com/docs/ftw-security/how-to-set-up-csp-for-ftw/"
  );
}

// Export the function for server side rendering.
export default renderApp;

// exporting matchPathname and configureStore for server side rendering.
// matchPathname helps to figure out which route is called and if it has preloading needs
// configureStore is used for creating initial store state for Redux after preloading
export {
  matchPathname,
  configureStore,
  routeConfiguration,
  defaultConfig,
  mergeConfig,
  fetchAppAssets,
};
