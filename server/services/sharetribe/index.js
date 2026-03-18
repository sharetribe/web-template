const { getIntegrationSdk } = require('../../api-util/sdk');

/**
 * Fetches a Sharetribe transaction by ID using the Integration SDK.
 * Use this for server-side orchestration where no user session is available.
 * @param {string} transactionId - The Sharetribe transaction ID
 * @param {Object} [options] - Optional query params (e.g. { include: ['listing', 'customer'] })
 * @returns {Promise<Object>} The raw SDK response
 */
const getTransaction = async (transactionId, options = {}) => {
  const iSdk = getIntegrationSdk();
  return iSdk.transactions.show({ id: transactionId, ...options });
};

/**
 * Updates metadata on a Sharetribe transaction using the Integration SDK.
 * @param {string} transactionId - The Sharetribe transaction ID
 * @param {Object} metadata - Metadata key-value pairs to merge into the transaction
 * @returns {Promise<Object>} The raw SDK response
 */
const updateTransactionMetadata = async (transactionId, metadata) => {
  const iSdk = getIntegrationSdk();
  return iSdk.transactions.updateMetadata({ id: transactionId, metadata });
};

module.exports = {
  getTransaction,
  updateTransactionMetadata,
};
