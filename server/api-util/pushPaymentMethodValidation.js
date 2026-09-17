/**
 * Server-side validation for Stripe push payment transition params.
 *
 * Push payments use Sharetribe's `:action/stripe-create-payment-intent-push`, which
 * requires a `paymentMethodTypes` array on the transition params. The client may send
 * those types from checkout; this module sanitizes them before privileged API endpoints
 * forward the request to the Marketplace API.
 *
 * When to use:
 * - Call `sanitizePushPaymentBodyParams` in privileged transaction endpoints
 *   (initiate-privileged, transition-privileged) before building the Marketplace API body.
 * - Validation runs only when `params.paymentMethodTypes` is present. Absent param is
 *   passed through — whether it is required depends on the transaction process action.
 *
 * How to extend:
 * - The allowlist is empty by default so push payments fail closed until you opt in.
 * - Uncomment or add Stripe push payment method type strings to
 *   `STRIPE_PUSH_PAYMENT_METHOD_TYPES`. Keep it in sync with checkout, Stripe, and your
 *   transaction process. See CheckoutPage/CheckoutPageRedirectReturn/README.md.
 * - Sharetribe supports payment methods that have immediate payment confirmation and
 *   that are supported by Stripe’s PaymentIntents API.
 *
 * @see https://www.sharetribe.com/docs/references/transaction-process-actions/#actionstripe-create-payment-intent-push
 */
const STRIPE_PUSH_PAYMENT_METHOD_TYPES = new Set([
  // 'alipay',
  // 'bancontact',
  // 'eps',
  // 'giropay',
  // 'ideal',
  // 'p24',
  // 'mobilepay',
  // etc.
]);

const PUSH_PAYMENT_ALLOWLIST_GUIDANCE =
  'Add allowed Stripe type strings to STRIPE_PUSH_PAYMENT_METHOD_TYPES in ' +
  'server/api-util/pushPaymentMethodValidation.js, and follow the push payment checklist in ' +
  'src/containers/CheckoutPage/CheckoutPageRedirectReturn/README.md.';

const throwValidationError = message => {
  const error = new Error(message);
  error.status = 400;
  error.statusText = message;
  error.data = {};
  throw error;
};

const invalidPaymentMethodTypesMessage = () =>
  process.env.NODE_ENV === 'development'
    ? `Invalid paymentMethodTypes. ${PUSH_PAYMENT_ALLOWLIST_GUIDANCE}`
    : 'Invalid paymentMethodTypes.';

const sanitizePushPaymentBodyParams = bodyParams => {
  if (!bodyParams) {
    return bodyParams;
  }

  // If paymentMethodTypes is not present, return the bodyParams as is.
  const types = bodyParams.params?.paymentMethodTypes;
  if (types === undefined) {
    return bodyParams;
  }

  if (!Array.isArray(types) || types.length === 0) {
    throwValidationError('paymentMethodTypes must be a non-empty array.');
  }

  const sanitized = [...new Set(types.filter(t => STRIPE_PUSH_PAYMENT_METHOD_TYPES.has(t)))];
  if (sanitized.length === 0) {
    throwValidationError(invalidPaymentMethodTypesMessage());
  }

  return {
    ...bodyParams,
    params: {
      ...bodyParams.params,
      paymentMethodTypes: sanitized,
    },
  };
};

module.exports = {
  sanitizePushPaymentBodyParams,
};
