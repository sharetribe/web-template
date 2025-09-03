// server/api-util/integrationSdk.js
const { createInstance } = require('sharetribe-flex-integration-sdk');

let cachedISdk = null;

function getIntegrationSdk() {
  const cid = process.env.INTEGRATION_CLIENT_ID;
  const secret = process.env.INTEGRATION_CLIENT_SECRET;
  if (!cid || !secret) throw new Error('Missing Integration API credentials');
  if (!cachedISdk) {
    const sdk = createInstance({ clientId: cid, clientSecret: secret });

    // Explicit helper to update protectedData via a privileged transition.
    sdk.transactions.update = async ({ id, protectedData }) => {
      console.log('📝 [SHIPPO] Persisting protectedData via transition/store-shipping-urls', { id });
      return sdk.transactions.transition({
        id,
        transition: 'transition/store-shipping-urls',
        params: { protectedData },
      });
    };
    sdk.transactions.updateProtectedData = sdk.transactions.update; // alias for existing call sites

    cachedISdk = sdk;
  }
  return cachedISdk;
}

module.exports = { getIntegrationSdk };
