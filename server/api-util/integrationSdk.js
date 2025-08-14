// Integration SDK helper (server-only)
const { createInstance } = require('sharetribe-flex-integration-sdk');

let cachedISdk = null;

function getIntegrationSdk() {
  const cid = process.env.INTEGRATION_CLIENT_ID;
  const secret = process.env.INTEGRATION_CLIENT_SECRET;

  if (!cid || !secret) {
    // Fail fast with a very clear message
    throw new Error('Missing Integration API credentials: set INTEGRATION_CLIENT_ID and INTEGRATION_CLIENT_SECRET');
  }
  if (!cachedISdk) {
    cachedISdk = createInstance({
      clientId: cid,
      clientSecret: secret,
    });
  }
  return cachedISdk;
}

module.exports = { getIntegrationSdk };
