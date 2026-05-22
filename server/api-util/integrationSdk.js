/**
 * Server-only Sharetribe Integration API client.
 *
 * The Integration API provides operator-level (cross-user) access that the browser Marketplace
 * API cannot — e.g. looking up a team user by its team code, or aggregating gear activity across
 * a team's members for the Team Admin dashboard.
 *
 * Credentials are read from server-only env vars (never REACT_APP_*):
 *   SHARETRIBE_INTEGRATION_CLIENT_ID, SHARETRIBE_INTEGRATION_CLIENT_SECRET
 */
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');

const CLIENT_ID = process.env.SHARETRIBE_INTEGRATION_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;
const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;

let cachedSdk = null;

// Whether Integration API credentials are present. Lets endpoints degrade gracefully.
const integrationSdkConfigured = () => !!(CLIENT_ID && CLIENT_SECRET);

// Lazily create (and reuse) a single Integration SDK instance.
const getIntegrationSdk = () => {
  if (!integrationSdkConfigured()) {
    throw new Error(
      'Integration API credentials are not configured. Set SHARETRIBE_INTEGRATION_CLIENT_ID and SHARETRIBE_INTEGRATION_CLIENT_SECRET.'
    );
  }
  if (!cachedSdk) {
    cachedSdk = flexIntegrationSdk.createInstance({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      ...(BASE_URL ? { baseUrl: BASE_URL } : {}),
    });
  }
  return cachedSdk;
};

module.exports = { getIntegrationSdk, integrationSdkConfigured };
