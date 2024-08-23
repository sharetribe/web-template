const http = require('http');
const https = require('https');
const Decimal = require('decimal.js');
const log = require('../log');
const sharetribeSdk = require('sharetribe-flex-sdk');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';
const MAX_SOCKETS = process.env.MAX_SOCKETS;
const MAX_SOCKETS_DEFAULT = 10;

const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;
const ASSET_CDN_BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_ASSET_CDN_BASE_URL;

// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `src/util/api.js`
const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sharetribeSdk.types.BigDecimal,
    customType: Decimal,
    writer: v => new sharetribeSdk.types.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];
exports.typeHandlers = typeHandlers;

const baseUrlMaybe = BASE_URL ? { baseUrl: BASE_URL } : {};
const assetCdnBaseUrlMaybe = ASSET_CDN_BASE_URL ? { assetCdnBaseUrl: ASSET_CDN_BASE_URL } : {};

// maxSockets is Infinity by default in Node.js
// This makes it possible to alter that through environment variable.
// Note: this is only affecting http agents created here.
const maxSockets = MAX_SOCKETS ? parseInt(MAX_SOCKETS, 10) : MAX_SOCKETS_DEFAULT;

// Instantiate HTTP(S) Agents with keepAlive set to true.
// This will reduce the request time for consecutive requests by
// reusing the existing TCP connection, thus eliminating the time used
// for setting up new TCP connections.
const httpAgent = new http.Agent({ keepAlive: true, maxSockets });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets });

const memoryStore = token => {
  const store = sharetribeSdk.tokenStore.memoryStore();
  store.setToken(token);
  return store;
};

// Read the user token from the request cookie
const getUserToken = req => {
  const cookieTokenStore = sharetribeSdk.tokenStore.expressCookieStore({
    clientId: CLIENT_ID,
    req,
    secure: USING_SSL,
  });
  return cookieTokenStore.getToken();
};

exports.serialize = data => {
  return sharetribeSdk.transit.write(data, { typeHandlers, verbose: TRANSIT_VERBOSE });
};

exports.deserialize = str => {
  return sharetribeSdk.transit.read(str, { typeHandlers });
};

exports.handleError = (res, error) => {
  log.error(error, 'local-api-request-failed', error.data);

  if (error.status && error.statusText && error.data) {
    const { status, statusText, data } = error;

    // JS SDK error
    res
      .status(error.status)
      .json({
        name: 'LocalAPIError',
        message: 'Local API request failed',
        status,
        statusText,
        data,
      })
      .end();
  } else {
    res
      .status(500)
      .json({ error: error.message })
      .end();
  }
};

// The access token is read from cookie (request) and potentially saved into the cookie (response).
// This keeps session updated between server and browser even if the token is re-issued.
exports.getSdk = (req, res) => {
  return sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    httpAgent,
    httpsAgent,
    tokenStore: sharetribeSdk.tokenStore.expressCookieStore({
      clientId: CLIENT_ID,
      req,
      res,
      secure: USING_SSL,
    }),
    typeHandlers,
    ...baseUrlMaybe,
    ...assetCdnBaseUrlMaybe,
  });
};

// Trusted token is powerful, it should not be passed away from the server.
exports.getTrustedSdk = req => {
  const userToken = getUserToken(req);

  // Initiate an SDK instance for token exchange
  const sdk = sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    httpAgent,
    httpsAgent,
    tokenStore: memoryStore(userToken),
    typeHandlers,
    ...baseUrlMaybe,
  });

  // Perform a token exchange
  return sdk.exchangeToken().then(response => {
    // Setup a trusted sdk with the token we got from the exchange:
    const trustedToken = response.data;

    return sharetribeSdk.createInstance({
      transitVerbose: TRANSIT_VERBOSE,

      // We don't need CLIENT_SECRET here anymore
      clientId: CLIENT_ID,

      // Important! Do not use a cookieTokenStore here but a memoryStore
      // instead so that we don't leak the token back to browser client.
      tokenStore: memoryStore(trustedToken),

      httpAgent,
      httpsAgent,
      typeHandlers,
      ...baseUrlMaybe,
    });
  });
};

// Fetch commission asset with 'latest' alias.
exports.fetchCommission = sdk => {
  return sdk
    .assetsByAlias({ paths: ['transactions/commission.json'], alias: 'latest' })
    .then(response => {
      // Let's throw an error if we can't fetch commission for some reason
      const commissionAsset = response?.data?.data?.[0];
      if (!commissionAsset) {
        const message = 'Insufficient pricing configuration set.';
        const error = new Error(message);
        error.status = 400;
        error.statusText = message;
        error.data = {};
        throw error;
      }
      return response;
    });
};

// Fetch branding asset with 'latest' alias.
// This is needed for generating webmanifest on server-side.
exports.fetchBranding = sdk => {
  return sdk.assetsByAlias({ paths: ['design/branding.json'], alias: 'latest' }).then(response => {
    // Let's throw an error if we can't fetch branding for some reason
    const brandingAsset = response?.data?.data?.[0];
    if (!brandingAsset) {
      const message = 'Branding configuration was not available.';
      const error = new Error(message);
      error.status = 400;
      error.statusText = message;
      error.data = {};
      throw error;
    }
    return response;
  });
};

// Fetch branding asset with 'latest' alias.
// This is needed for generating webmanifest on server-side.
exports.fetchAccessControlAsset = sdk => {
  return sdk
    .assetsByAlias({ paths: ['/general/access-control.json'], alias: 'latest' })
    .then(response => {
      // Let's throw an error if we can't fetch branding for some reason
      const accessControlAsset = response?.data?.data?.[0];
      if (!accessControlAsset) {
        const message = 'access-control configuration was not available.';
        const error = new Error(message);
        error.status = 404;
        error.statusText = message;
        error.data = {};
        throw error;
      }
      return response;
    });
};
