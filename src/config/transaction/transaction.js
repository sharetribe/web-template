/////////////////////////////////////////////////////////////////////////////////////////
// Transaction config handler: hosted configs (+ room for more assets)                 //
// Hosted asset path: /transactions/minimum-transaction-size.json                      //
// App-config key: `transaction` (elevated listingMinimumPriceSubUnits in mergeConfig) //
/////////////////////////////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

/**
 * Derive top-level listingMinimumPriceSubUnits from resolved `config.transaction`.
 * - If there is no value, we use the defaultConfigs.listingMinimumPriceSubUnits
 * - If the value is 0 (aka _falsy_), we use the defaultConfigs.listingMinimumPriceSubUnits
 *   TODO: The latter is mainly due to backward compatibility atm, since Marketplace Console
 *         won't allow saving 0 anymore.
 *
 * @param {Object} [transaction] resolved transaction config (`config.transaction`)
 * @param {number} defaultSubUnits built-in listingMinimumPriceSubUnits
 * @returns {number}
 */
export const getListingMinimumPriceSubUnits = (transaction, defaultSubUnits) => {
  const { listingMinimumPrice } = transaction || {};
  const amount =
    listingMinimumPrice?.type === 'subunit' && typeof listingMinimumPrice.amount === 'number'
      ? listingMinimumPrice.amount
      : 0;
  return amount || defaultSubUnits;
};

/**
 * Shape the hosted minimumTransactionSize asset only.
 *
 * @param {Object} hostedSlices values keyed by transactionConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.minimumTransactionSize;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const { listingMinimumPrice } = hostedSlice;
  return isPlainObject(listingMinimumPrice) ? { listingMinimumPrice } : {};
};

/**
 * Soft-check shape; missing/invalid listingMinimumPrice is an error (MaintenanceMode).
 *
 * @param {Object} normalized
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];
  const value = {};
  const listingMinimumPrice = normalized?.listingMinimumPrice;

  const { type, amount } = listingMinimumPrice || {};
  const hasUsableAmount =
    type === 'subunit' && typeof amount === 'number' && Number.isFinite(amount);

  if (!hasUsableAmount) {
    issues.push(
      configIssue({
        level: 'error',
        code: 'TRANSACTION_INVALID_LISTING_MINIMUM_PRICE',
        message:
          'Mandatory hosted minimumTransactionSize.listingMinimumPrice is missing or invalid. It must be { type: "subunit", amount: <number> }. The marketplace cannot start without it.',
      })
    );
    return { value, issues };
  }

  value.listingMinimumPrice = { type: 'subunit', amount };
  return { value, issues };
};

/**
 * Build `config.transaction` from the validated hosted slice.
 * More transaction assets can be merged here later (same pattern as listing/user).
 *
 * @param {Object} validated
 * @returns {Object}
 */
const resolve = validated => ({
  ...(validated?.listingMinimumPrice ? { listingMinimumPrice: validated.listingMinimumPrice } : {}),
});

/**
 * Config handler for the `transaction` app-config key.
 *
 * - id: `transaction`
 * - assetKeys: `minimumTransactionSize` (minimum-transaction-size.json); more keys later
 * - This asset is mandatory: missing/invalid listingMinimumPrice → MaintenanceMode
 *
 * Top-level `listingMinimumPriceSubUnits` is derived in mergeConfig via
 * getListingMinimumPriceSubUnits (not written by this handler).
 */
export const transactionConfig = {
  id: 'transaction',
  assetKeys: ['minimumTransactionSize'],
  normalize,
  validate,
  resolve,
};
