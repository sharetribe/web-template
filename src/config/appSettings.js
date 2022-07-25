import { subUnitDivisors, currencyConfiguration } from './currencySettings';

const env = process.env.REACT_APP_ENV;
const dev = process.env.REACT_APP_ENV === 'development';

// To pass environment variables to the client app in the build
// script, react-scripts (and the sharetribe-scripts fork of
// react-scripts) require using the REACT_APP_ prefix to avoid
// exposing server secrets to the client side.
const sdkClientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const sdkBaseUrl = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;
const sdkAssetCdnBaseUrl = process.env.REACT_APP_SHARETRIBE_SDK_ASSET_CDN_BASE_URL;
const sdkTransitVerbose = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';

// Marketplace currency.
// It should match one of the currencies listed in currencySettings.js
const currencyConf = process.env.REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY;
const currency = currencyConf ? currencyConf.toUpperCase() : currencyConf;

// Currency formatting options.
// See: https://github.com/yahoo/react-intl/wiki/API#formatnumber
const currencyConfig = currencyConfiguration(currency);

// Sentry DSN (Data Source Name), a client key for authenticating calls to Sentry
const sentryDsn = process.env.REACT_APP_SENTRY_DSN;

// If webapp is using SSL (i.e. it's behind 'https' protocol)
const usingSSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';

// Canonical root url is needed in social media sharing and SEO optimization purposes.
const canonicalRootURL = process.env.REACT_APP_CANONICAL_ROOT_URL;

// NOTE: only expose configuration that should be visible in the
// client side, don't add any server secrets in this file.
const config = {
  env,
  dev,
  sdk: {
    clientId: sdkClientId,
    baseUrl: sdkBaseUrl,
    assetCdnBaseUrl: sdkAssetCdnBaseUrl,
    transitVerbose: sdkTransitVerbose,
  },
  currencyConfig,
  subUnitDivisors,
  canonicalRootURL, // TODO
  sentryDsn,
  usingSSL,
};

export default config;
