const { calculateTotalForCustomer } = require('./lineItemHelpers');

const PAYIN_TOTAL_CHANGED = 'Payin total has changed';

/**
 * @returns {Error} local API conflict error
 */
const createPayinTotalChangedError = () => {
  const error = new Error(PAYIN_TOTAL_CHANGED);
  error.status = 409;
  error.statusText = PAYIN_TOTAL_CHANGED;
  error.data = { message: PAYIN_TOTAL_CHANGED };
  return error;
};

/**
 * When the client sends expectedPayinTotal (checkout payment flows), ensure it
 * still matches the customer total from freshly calculated line items.
 * No-op when omitted so other privileged flows (e.g. negotiation offers) are unaffected.
 *
 * @param {Array} lineItems
 * @param {{ amount: number, currency: string }|null|undefined} expectedPayinTotal
 */
const assertExpectedPayinTotal = (lineItems, expectedPayinTotal) => {
  if (expectedPayinTotal == null) {
    return;
  }

  const expectedAmount = expectedPayinTotal.amount;
  const expectedCurrency = expectedPayinTotal.currency;

  if (typeof expectedAmount !== 'number' || !expectedCurrency) {
    throw createPayinTotalChangedError();
  }

  const actual = calculateTotalForCustomer(lineItems);
  if (actual.amount !== expectedAmount || actual.currency !== expectedCurrency) {
    throw createPayinTotalChangedError();
  }
};

module.exports = {
  PAYIN_TOTAL_CHANGED,
  assertExpectedPayinTotal,
};
