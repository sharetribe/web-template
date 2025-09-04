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

// Plain helper (no monkey-patching)
async function txUpdateProtectedData({ id, protectedData }) {
  const sdk = getIntegrationSdk();
  
  console.log('📝 [SHIPPO] Attempting to update protectedData for transaction:', id);
  console.log('📝 [SHIPPO] ProtectedData to update:', Object.keys(protectedData));
  
  // Add idempotency key to prevent retry collisions
  const idempotencyKey = `shipping-${id}-${Date.now()}`;
  
  try {
    // Try using transition/update which should be available in most Flex processes
    return sdk.transactions.transition({
      id,
      transition: 'transition/update',
      params: { 
        protectedData,
        // Add idempotency key if supported
        ...(idempotencyKey && { idempotencyKey })
      },
    });
  } catch (error) {
    console.error('📝 [SHIPPO] transition/update failed, trying alternative approaches:', error.message);
    
    // Fallback: try to use a generic transition if available
    try {
      return sdk.transactions.transition({
        id,
        transition: 'transition/store-shipping',
        params: { 
          protectedData,
          ...(idempotencyKey && { idempotencyKey })
        },
      });
    } catch (transitionError) {
      console.error('📝 [SHIPPO] All transition approaches failed:', transitionError.message);
      console.error('📝 [SHIPPO] This means the shipping data cannot be persisted to the database');
      console.error('📝 [SHIPPO] SMS will still work, but shipping details won\'t be saved');
      
      // Don't throw - let SMS continue working
      return { success: false, reason: 'persistence_not_available' };
    }
  }
}

module.exports = { getIntegrationSdk, txUpdateProtectedData };
