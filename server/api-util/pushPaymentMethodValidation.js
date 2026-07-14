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
 * - Add Stripe push payment method type strings to `STRIPE_PUSH_PAYMENT_METHOD_TYPES`.
 *   The example list follows Sharetribe's documented examples for
 *   `:action/stripe-create-payment-intent-push`;
 *   Sharetribe supports payment methods that have immediate payment confirmation and
 *   that are supported by Stripe’s PaymentIntents API. Keep this allowlist in
 *   sync with the payment methods your marketplace enables in checkout and in Stripe.
 *
 * @see https://www.sharetribe.com/docs/references/transaction-process-actions/#actionstripe-create-payment-intent-push
 */
const STRIPE_PUSH_PAYMENT_METHOD_TYPES = new Set([
  'alipay',
  'bancontact',
  'eps',
  'giropay',
  'ideal',
  'p24',
  'mobilepay',
]);

const isDevelopment = process.env.NODE_ENV === 'development';

const throwValidationError = message => {
  const error = new Error(message);
  error.status = 400;
  error.statusText = message;
  error.data = {};
  throw error;
};

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
    const message = isDevelopment
      ? 'Invalid paymentMethodTypes. Have you forgotten to review the push payment method validation on server?'
      : 'Invalid paymentMethodTypes.';
    throwValidationError(message);
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
