import { ensureTransaction } from '../../../util/data';
import { PAYMENT_METHOD_CARD } from '../../../transactions/paymentMethods';
import { storeData } from '../CheckoutPageSessionHelpers';
import {
  getCheckoutTransitions,
  getCompletedPaymentIntentOrReject,
  persistTransaction,
} from '../CheckoutPageTransactionHelpers';

/**
 * Resume push/redirect checkout after the customer returns from Stripe.
 *
 * This path is confirm-only: retrieve the PaymentIntent, validate that customer actions are done,
 * and then run the Marketplace confirm-payment transition. It must never initiate a new order.
 *
 * @param {Object} params
 * @param {Object} params.pageData
 * @param {Object} params.stripe
 * @param {Object} params.process
 * @param {Function} params.onConfirmPayment
 * @param {Function} params.onRetrievePaymentIntent
 * @param {string} params.stripePaymentIntentClientSecretFromRedirect
 * @param {string} params.sessionStorageKey
 * @param {Function} params.setPageData
 * @param {string} [params.checkoutPaymentMethod]
 * @returns {Promise<Object>} confirmed order
 */
export const resumeCheckoutAfterStripeRedirect = ({
  pageData,
  stripe,
  process,
  onConfirmPayment,
  onRetrievePaymentIntent,
  stripePaymentIntentClientSecretFromRedirect,
  sessionStorageKey,
  setPageData,
  checkoutPaymentMethod = PAYMENT_METHOD_CARD,
}) => {
  const storedTx = ensureTransaction(pageData.transaction);
  const transactionId = storedTx?.id;

  if (!transactionId) {
    throw new Error('Missing transaction when resuming Stripe redirect payment');
  }

  const { confirmPaymentTransition } = getCheckoutTransitions(
    process,
    storedTx,
    checkoutPaymentMethod
  );
  const clientSecret =
    stripePaymentIntentClientSecretFromRedirect ||
    storedTx?.attributes?.protectedData?.stripePaymentIntents?.default
      ?.stripePaymentIntentClientSecret;

  if (!clientSecret || !onRetrievePaymentIntent) {
    const error = new Error('Missing Stripe PaymentIntent client secret on redirect return');
    error.redirectPaymentStatus = 'failed';
    throw error;
  }

  return onRetrievePaymentIntent({
    stripe,
    stripePaymentIntentClientSecret: clientSecret,
  })
    .then(retrieveResponse => {
      const paymentIntent = getCompletedPaymentIntentOrReject(retrieveResponse?.paymentIntent);
      return { paymentIntent, transactionId };
    })
    .then(({ transactionId: currentTransactionId }) => {
      const isTransitionedAlready =
        storedTx?.attributes?.lastTransition === confirmPaymentTransition;
      const orderPromise = isTransitionedAlready
        ? Promise.resolve(storedTx)
        : onConfirmPayment(currentTransactionId, confirmPaymentTransition, {});

      orderPromise.then(order => {
        persistTransaction(order, pageData, storeData, setPageData, sessionStorageKey);
      });

      return orderPromise;
    });
};

/**
 * After a full-page redirect, Stripe.js may not yet be in React state. Create an instance with
 * the publishable key when needed.
 *
 * @param {string} publishableKey
 * @returns {Object|null}
 */
export const resolveStripeInstance = publishableKey => {
  if (typeof window !== 'undefined' && window.Stripe && publishableKey) {
    return window.Stripe(publishableKey);
  }
  return null;
};
