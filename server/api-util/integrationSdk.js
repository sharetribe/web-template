// server/api-util/integrationSdk.js
const { createInstance } = require('sharetribe-flex-integration-sdk');

let cached;
function getIntegrationSdk() {
  if (!cached) {
    cached = createInstance({
      clientId: process.env.INTEGRATION_CLIENT_ID,
      clientSecret: process.env.INTEGRATION_CLIENT_SECRET,
    });
  }
  return cached;
}

// Plain helper (no monkey-patching)
async function txUpdateProtectedData({ id, protectedData }) {
  const sdk = getIntegrationSdk();
  return sdk.transactions.transition({
    id,
    transition: 'transition/store-shipping-urls',
    params: { protectedData },
  });
}

module.exports = { getIntegrationSdk, txUpdateProtectedData };
