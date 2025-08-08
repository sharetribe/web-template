/**
 * Utility functions for working with persistent payment intent data
 */

/**
 * Get persistent payment intent data from transaction metadata or protected data
 * @param {Object} transaction - The transaction object
 * @returns {Object|null} - Payment intent data or null if not found
 */
export const getPersistentPaymentIntent = (transaction) => {
  // Check metadata first
  if (transaction?.attributes?.metadata?.persistentPaymentIntent) {
    return transaction.attributes.metadata.persistentPaymentIntent;
  }
  
  // Check protected data for persistent payment intent
  if (transaction?.attributes?.protectedData?.persistentPaymentIntent) {
    return transaction.attributes.protectedData.persistentPaymentIntent;
  }
  
  return null;
};

/**
 * Get the Stripe payment intent ID from transaction (either from protected data or metadata)
 * @param {Object} transaction - The transaction object
 * @returns {string|null} - Payment intent ID or null if not found
 */
export const getPaymentIntentId = (transaction) => {
  // First check protected data (current payment)
  const stripePaymentIntents = transaction?.attributes?.protectedData?.stripePaymentIntents;
  if (stripePaymentIntents?.default?.stripePaymentIntentId) {
    return stripePaymentIntents.default.stripePaymentIntentId;
  }
  
  // Then check metadata (persistent storage)
  const persistentData = getPersistentPaymentIntent(transaction);
  if (persistentData?.stripePaymentIntentId) {
    return persistentData.stripePaymentIntentId;
  }
  
  return null;
};

/**
 * Get the Stripe payment intent client secret from transaction
 * @param {Object} transaction - The transaction object
 * @returns {string|null} - Payment intent client secret or null if not found
 */
export const getPaymentIntentClientSecret = (transaction) => {
  // First check protected data (current payment)
  const stripePaymentIntents = transaction?.attributes?.protectedData?.stripePaymentIntents;
  if (stripePaymentIntents?.default?.stripePaymentIntentClientSecret) {
    return stripePaymentIntents.default.stripePaymentIntentClientSecret;
  }
  
  // Then check metadata (persistent storage)
  const persistentData = getPersistentPaymentIntent(transaction);
  if (persistentData?.stripePaymentIntentClientSecret) {
    return persistentData.stripePaymentIntentClientSecret;
  }
  
  return null;
};

/**
 * Check if transaction has any payment intent data (either in protected data or metadata)
 * @param {Object} transaction - The transaction object
 * @returns {boolean} - True if payment intent data exists
 */
export const hasPaymentIntentData = (transaction) => {
  return !!getPaymentIntentId(transaction);
}; 