/** @typedef {'card'} CheckoutPaymentMethod */

export const PAYMENT_METHOD_CARD = 'card';

/**
 * Checkout payment method catalog and validation helpers.
 *
 * Note: Sharetribe's Marketplace API only supports adding a card as a saved
 * payment method (stripeCustomer.addPaymentMethod). If a wrong type is used,
 * the API returns 409 with error code stripe-payment-method-type-not-supported.
 * @see https://www.sharetribe.com/api-reference/marketplace.html#add-payment-method
 *
 * Push vs pull paymentDirection defaults live in this catalog (see getStripeSupportedPaymentConfig).
 * Process files spread stripePaymentMethodInfo into supportedPayments.stripe for methods the
 * matching backend process is built for. Checkout method ids match Stripe payment_method_types
 * strings (e.g. ideal → ['ideal']).
 */
const PAYMENT_METHOD_DEFINITIONS = {
  [PAYMENT_METHOD_CARD]: {
    id: PAYMENT_METHOD_CARD,
    supportsSavePaymentMethod: true,
    supportedCurrencies: null,
    stripe: { paymentMethodType: PAYMENT_METHOD_CARD, paymentDirection: 'pull' },
  },
};

/**
 * Look up catalog metadata for a checkout payment method id.
 *
 * Returns the matching definition from PAYMENT_METHOD_DEFINITIONS, or the card
 * definition when the id is unknown / missing.
 *
 * Fields:
 * - id — checkout method id (also used as Stripe payment_method_types string)
 * - supportsSavePaymentMethod — whether Sharetribe can save this as a customer payment method
 * - supportedCurrencies — method-specific currency allowlist, or null when there is no
 *   extra restriction beyond Stripe-compatible marketplace currency
 *   (see settingsCurrency.stripeSupportedCurrencies / isValidCurrencyForTransactionProcess)
 * - stripe.paymentMethodType — Stripe PaymentIntent payment_method_types value
 * - stripe.paymentDirection — 'pull' (preauth) or 'push' (redirect / charge on confirm)
 *
 * @param {string} paymentMethodId e.g. 'card', 'ideal'
 * @returns {{
 *   id: string,
 *   supportsSavePaymentMethod: boolean,
 *   supportedCurrencies: string[] | null,
 *   stripe: { paymentMethodType: string, paymentDirection: 'pull' | 'push' }
 * }}
 */
export const getPaymentMethodConfig = paymentMethodId => {
  return (
    PAYMENT_METHOD_DEFINITIONS[paymentMethodId] || PAYMENT_METHOD_DEFINITIONS[PAYMENT_METHOD_CARD]
  );
};

/**
 * Stripe config stored under process.supportedPayments.stripe[methodId].
 *
 * @param {string} paymentMethodId
 * @returns {{ paymentDirection: 'pull' | 'push' }}
 */
export const getStripeSupportedPaymentConfig = paymentMethodId => {
  const { stripe } = getPaymentMethodConfig(paymentMethodId);
  return { paymentDirection: stripe.paymentDirection };
};

/**
 * Default Stripe method entry for process.supportedPayments.stripe.
 * Returns { [methodId]: { paymentDirection } } for spreading into the stripe map.
 * Catalog defaults live in PAYMENT_METHOD_DEFINITIONS; declaring a method in the client
 * still requires a backend process that supports that payment concept.
 *
 * @param {string} paymentMethodId
 * @returns {Object<string, { paymentDirection: 'pull' | 'push' }>}
 * @example
 * stripe: {
 *   ...stripePaymentMethodInfo(PAYMENT_METHOD_CARD),
 * }
 */
export const stripePaymentMethodInfo = paymentMethodId => ({
  [paymentMethodId]: getStripeSupportedPaymentConfig(paymentMethodId),
});

/**
 * @param {string} paymentMethodId
 * @param {string} currency ISO 4217 currency code
 * @returns {boolean}
 */
export const isPaymentMethodSupportedForCurrency = (paymentMethodId, currency) => {
  const { supportedCurrencies } = getPaymentMethodConfig(paymentMethodId);
  return !supportedCurrencies || supportedCurrencies.includes(currency);
};

/**
 * Whether a payment method can be offered at checkout for the given process and currency.
 *
 * @param {Object} params
 * @param {Object} params.process from getProcess()
 * @param {string} params.paymentMethodId
 * @param {string} params.currency ISO 4217 currency code
 * @returns {boolean}
 */
export const isCheckoutPaymentMethodAvailable = ({ process, paymentMethodId, currency }) => {
  const supportedByProcess = process?.supportedPayments?.stripe?.[paymentMethodId];
  if (!supportedByProcess) {
    return false;
  }
  if (!isPaymentMethodSupportedForCurrency(paymentMethodId, currency)) {
    return false;
  }
  return true;
};

/**
 * Build checkout payment method options from the process graph (source of truth).
 *
 * Only methods declared in process.supportedPayments.stripe and allowed for the
 * listing currency are included. Card is listed first when available.
 * UI labels/hints are resolved in StripePaymentForm, not here.
 *
 * @param {Object} params
 * @param {Object} params.process from getProcess()
 * @param {string} params.currency ISO 4217 currency code
 * @returns {Array<{ value: string }>}
 */
export const getCheckoutPaymentOptions = ({ process, currency }) => {
  const stripeMethods = process?.supportedPayments?.stripe || {};
  const methodIds = Object.keys(stripeMethods);
  const orderedMethodIds = [
    ...(methodIds.includes(PAYMENT_METHOD_CARD) ? [PAYMENT_METHOD_CARD] : []),
    ...methodIds.filter(id => id !== PAYMENT_METHOD_CARD),
  ];

  return orderedMethodIds
    .filter(paymentMethodId =>
      isCheckoutPaymentMethodAvailable({
        process,
        paymentMethodId,
        currency,
      })
    )
    .map(paymentMethodId => ({ value: paymentMethodId }));
};
