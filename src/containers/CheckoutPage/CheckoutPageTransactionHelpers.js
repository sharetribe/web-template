// Import contexts and util modules
import { findRouteByRouteName } from '../../util/routes';
import { ensureStripeCustomer, ensureTransaction } from '../../util/data';
import { formatMoney } from '../../util/currency';
import { PAYMENT_METHOD_CARD } from '../../transactions/paymentMethods';
import { isStripePushPaymentMethod } from '../../transactions/transaction';
import { storeData } from './CheckoutPageSessionHelpers';

// Stripe PaymentIntent statuses where customer actions are already completed
// https://stripe.com/docs/payments/payment-intents/status
export const STRIPE_PI_USER_ACTIONS_DONE_STATUSES = ['processing', 'requires_capture', 'succeeded'];

const getCheckoutTransitions = (process, tx, checkoutPaymentMethod) =>
  process.getCheckoutPaymentTransitions(tx, {
    paymentProcessor: 'stripe',
    paymentMethod: checkoutPaymentMethod,
  });

/**
 * Extract relevant transaction type data from listing type
 * Note: this is saved to protectedData of the transaction entity
 *       therefore, we don't need the process name (nor alias)
 *
 * @param {Object} listingType
 * @param {String} unitTypeInPublicData
 * @param {Object} config
 * @returns object containing unitType etc. - or an empty object.
 */
export const getTransactionTypeData = (listingType, unitTypeInPublicData, config) => {
  const listingTypeConfig = config.listing.listingTypes.find(lt => lt.listingType === listingType);
  const { process, alias, unitType, ...rest } = listingTypeConfig?.transactionType || {};
  // Note: we want to rely on unitType written in public data of the listing entity.
  //       The listingType configuration might have changed on the fly.
  return unitTypeInPublicData ? { unitType: unitTypeInPublicData, ...rest } : {};
};

/**
 * This just makes it easier to transfrom bookingDates object if needed
 * (or manibulate bookingStart and bookingEnd)
 *
 * @param {Object} bookingDates
 * @returns object containing bookingDates or an empty object.
 */
export const bookingDatesMaybe = bookingDates => {
  return bookingDates ? { bookingDates } : {};
};

/**
 * Construct billing details (JSON-like object) for the Stripe API
 *
 * @param {Object} formValues object containing name, addressLine1, addressLine2, postal, city, state, country
 * @param {Object} currentUser
 * @returns Object that contains name, email and potentially address data for the Stripe API
 */
export const getBillingDetails = (formValues, currentUser) => {
  const { name, addressLine1, addressLine2, postal, city, state, country } = formValues;

  // Billing address is recommended.
  // However, let's not assume that <StripePaymentAddress> data is among formValues.
  // Read more about this from Stripe's docs
  // https://stripe.com/docs/stripe-js/reference#stripe-handle-card-payment-no-element
  const addressMaybe =
    addressLine1 && postal
      ? {
          address: {
            city: city,
            country: country,
            line1: addressLine1,
            line2: addressLine2,
            postal_code: postal,
            state: state,
          },
        }
      : {};
  return {
    name,
    email: currentUser?.attributes?.email,
    ...addressMaybe,
  };
};

/**
 * Get formatted total price (payinTotal)
 *
 * @param {Object} transaction
 * @param {Object} intl
 * @returns formatted money as a string.
 */
export const getFormattedTotalPrice = (transaction, intl) => {
  const totalPrice = transaction.attributes.payinTotal;
  return formatMoney(intl, totalPrice);
};

/**
 * Construct shipping details (JSON-like object)
 *
 * @param {Object} formValues object containing saveAfterOnetimePayment, recipientName,
 * recipientPhoneNumber, recipientAddressLine1, recipientAddressLine2, recipientPostal,
 * recipientCity, recipientState, and recipientCountry.
 * @returns shippingDetails object containing name, phoneNumber and address
 */
export const getShippingDetailsMaybe = formValues => {
  const {
    saveAfterOnetimePayment: saveAfterOnetimePaymentRaw,
    recipientName,
    recipientPhoneNumber,
    recipientAddressLine1,
    recipientAddressLine2,
    recipientPostal,
    recipientCity,
    recipientState,
    recipientCountry,
  } = formValues;

  return recipientName && recipientAddressLine1 && recipientPostal
    ? {
        shippingDetails: {
          name: recipientName,
          phoneNumber: recipientPhoneNumber,
          address: {
            city: recipientCity,
            country: recipientCountry,
            line1: recipientAddressLine1,
            line2: recipientAddressLine2,
            postalCode: recipientPostal,
            state: recipientState,
          },
        },
      }
    : {};
};

/**
 * Check if the default payment method exists for the currentUser
 * @param {Boolean} stripeCustomerFetched
 * @param {Object} currentUser
 * @returns true if default payment method has been set
 */
export const hasDefaultPaymentMethod = (stripeCustomerFetched, currentUser) =>
  !!(
    stripeCustomerFetched &&
    currentUser?.stripeCustomer?.attributes?.stripeCustomerId &&
    currentUser?.stripeCustomer?.defaultPaymentMethod?.id
  );

/**
 * Check if payment is expired (PAYMENT_EXPIRED state).
 *
 * @param {Object} existingTransaction
 * @param {Object} process
 * @returns true if payment has expired.
 */
export const hasPaymentExpired = (existingTransaction, process) => {
  return process.getState(existingTransaction) === process.states.PAYMENT_EXPIRED;
};

/**
 * Check if the transaction has passed PENDING_PAYMENT state (assumes that process has that state)
 * @param {Object} tx
 * @param {Object} process
 * @returns true if the transaction has passed that state
 */
export const hasTransactionPassedPendingPayment = (tx, process) => {
  return process.hasPassedState(process.states.PENDING_PAYMENT, tx);
};

const persistTransaction = (order, pageData, storeData, setPageData, sessionStorageKey) => {
  // Store the returned transaction (order)
  if (order?.id) {
    // Store order.
    const { orderData, listing } = pageData;
    storeData(orderData, listing, order, sessionStorageKey);
    setPageData({ ...pageData, transaction: order });
  }
};

/**
 * Stripe appends these query params when the customer returns from a bank/wallet redirect
 * (e.g. iDEAL). Absent params mean this is a normal checkout page load.
 *
 * @param {string} search - `location.search`
 * @returns {{ redirectStatus: string|null, paymentIntentClientSecret: string|null }}
 */
export const getStripeRedirectReturnParams = search => {
  const searchParams = new URLSearchParams(search);
  return {
    redirectStatus: searchParams.get('redirect_status'),
    paymentIntentClientSecret: searchParams.get('payment_intent_client_secret'),
  };
};

/**
 * Map an unexpected PaymentIntent status to a redirect payment status for checkout UI.
 * `requires_payment_method` / `canceled` are recoverable (customer can retry).
 * Other incomplete statuses surface as `pending`.
 *
 * @param {string|undefined} paymentIntentStatus
 * @returns {string} redirect payment status (`requires_payment_method` | `canceled` | `pending`)
 */
const toRedirectPaymentStatus = paymentIntentStatus => {
  const isRecoverableFailure = ['requires_payment_method', 'canceled'].includes(
    paymentIntentStatus
  );
  return isRecoverableFailure ? paymentIntentStatus : 'pending';
};

const getCompletedPaymentIntentOrReject = (paymentIntent, fallbackStatus) => {
  if (paymentIntent && STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(paymentIntent.status)) {
    return paymentIntent;
  }

  const error = new Error(
    `Unexpected PaymentIntent status after redirect return: ${paymentIntent?.status ||
      fallbackStatus}`
  );
  // Attached for the redirect-return hook → checkout error UI (via redirectPaymentStatusError).
  error.redirectPaymentStatus = toRedirectPaymentStatus(paymentIntent?.status || fallbackStatus);
  throw error;
};

/**
 * Create call sequence for checkout with Stripe PaymentIntents.
 *
 * Submit path for checkout with Stripe PaymentIntents.
 *
 * @param {Object} orderParams contains params for the initial order itself
 * @param {Object} extraPaymentParams contains extra params needed by one of the following calls in the checkout sequence
 * @returns Promise that goes through each step in the checkout sequence.
 */
export const processCheckoutWithPayment = (orderParams, extraPaymentParams) => {
  const {
    hasPaymentIntentUserActionsDone,
    isPaymentFlowUseSavedCard,
    isPaymentFlowPayAndSaveCard,
    onConfirmCardPayment,
    onConfirmRedirectPayment,
    onConfirmPayment,
    onInitiateOrder,
    onRetrievePaymentIntent,
    onSavePaymentMethod,
    pageData,
    paymentIntent,
    process,
    setPageData,
    sessionStorageKey,
    stripeCustomer,
    stripePaymentMethodId,
    checkoutPaymentMethod = PAYMENT_METHOD_CARD,
    checkoutPageReturnUrl,
    stripePaymentIntentClientSecretFromRedirect,
  } = extraPaymentParams;
  const isStripePushPayment = isStripePushPaymentMethod(process, checkoutPaymentMethod);
  const storedTx = ensureTransaction(pageData.transaction);
  const { requestPaymentTransition, confirmPaymentTransition } = getCheckoutTransitions(
    process,
    storedTx,
    checkoutPaymentMethod
  );

  const ensuredStripeCustomer = ensureStripeCustomer(stripeCustomer);
  const processAlias = pageData?.listing?.attributes?.publicData?.transactionProcessAlias;

  let createdPaymentIntent = null;

  const getStripePaymentIntentClientSecret = order => {
    const hasPaymentIntents = order?.attributes?.protectedData?.stripePaymentIntents;
    if (!hasPaymentIntents) {
      throw new Error(
        `Missing StripePaymentIntents key in transaction's protectedData. Check that your transaction process is configured to use payment intents.`
      );
    }
    return order.attributes.protectedData.stripePaymentIntents.default
      .stripePaymentIntentClientSecret;
  };

  ////////////////////////////////////////////////
  // Step 1: initiate order                     //
  // by requesting payment from Marketplace API //
  ////////////////////////////////////////////////
  const fnRequestPayment = fnParams => {
    // fnParams should be { listingId, deliveryMethod?, quantity?, bookingDates?, paymentMethod?.setupPaymentMethodForSaving?, protectedData }
    const hasPaymentIntents = storedTx.attributes.protectedData?.stripePaymentIntents;

    const isPrivileged = process.isPrivileged(requestPaymentTransition);

    // If paymentIntent exists, order has been initiated previously.
    const orderPromise = hasPaymentIntents
      ? Promise.resolve(storedTx)
      : onInitiateOrder(
          fnParams,
          processAlias,
          storedTx.id,
          requestPaymentTransition,
          isPrivileged
        );

    return orderPromise.then(order => {
      // Store the returned transaction (order)
      persistTransaction(order, pageData, storeData, setPageData, sessionStorageKey);
      return order;
    });
  };

  ////////////////////////////////////////////////////////
  // Step 2 (card): confirm card payment via Stripe SDK //
  ////////////////////////////////////////////////////////
  const fnConfirmCardPayment = fnParams => {
    // fnParams should be returned transaction entity
    const order = fnParams;
    const stripePaymentIntentClientSecret = getStripePaymentIntentClientSecret(order);
    const { stripe, card, billingDetails, paymentIntent: paymentIntentState } = extraPaymentParams;

    const stripeElementMaybe = !isPaymentFlowUseSavedCard ? { card } : {};

    // Note: For basic USE_SAVED_CARD scenario, we have set it already on API side, when PaymentIntent was created.
    // However, the payment_method is save here for USE_SAVED_CARD flow if customer first attempted onetime payment
    const paymentParams = !isPaymentFlowUseSavedCard
      ? {
          payment_method: {
            billing_details: billingDetails,
            card: card,
          },
        }
      : { payment_method: stripePaymentMethodId };

    const params = {
      stripePaymentIntentClientSecret,
      orderId: order?.id,
      stripe,
      ...stripeElementMaybe,
      paymentParams,
    };

    return hasPaymentIntentUserActionsDone
      ? Promise.resolve({ transactionId: order?.id, paymentIntent: paymentIntentState })
      : onConfirmCardPayment(params);
  };

  ///////////////////////////////////////////////////////////////////
  // Step 2 (push): confirm redirect payment method via Stripe SDK //
  ///////////////////////////////////////////////////////////////////
  const fnConfirmRedirectPayment = fnParams => {
    // fnParams should be returned transaction entity
    const order = fnParams;
    const { stripe, billingDetails, paymentIntent: paymentIntentState } = extraPaymentParams;

    // Skip Stripe confirm when PI user actions are already done.
    if (hasPaymentIntentUserActionsDone) {
      return Promise.resolve({
        transactionId: order?.id,
        paymentIntent: paymentIntentState || null,
      });
    }

    if (!checkoutPageReturnUrl) {
      throw new Error('Return URL is required for redirect payment methods');
    }

    const stripePaymentIntentClientSecret = getStripePaymentIntentClientSecret(order);
    const params = {
      stripe,
      stripePaymentIntentClientSecret,
      orderId: order?.id,
      billingDetails,
      returnUrl: checkoutPageReturnUrl,
      checkoutPaymentMethod,
    };

    return onConfirmRedirectPayment(params);
  };

  //////////////////////////////////////////////////////////////////////////////
  // Step 2.5 (push): retrieve PaymentIntent after redirect / confirm         //
  // Pass-through when confirm already returned a ready PaymentIntent.        //
  //////////////////////////////////////////////////////////////////////////////
  const fnRetrievePaymentIntentAfterRedirect = fnParams => {
    // fnParams should contain { paymentIntent, transactionId } from step 2
    const { transactionId, paymentIntent: paymentIntentFromConfirm } = fnParams;
    const { stripe, paymentIntent: paymentIntentState } = extraPaymentParams;
    const existingPaymentIntent = paymentIntentFromConfirm || paymentIntentState;

    if (
      existingPaymentIntent &&
      STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(existingPaymentIntent.status)
    ) {
      return Promise.resolve({ transactionId, paymentIntent: existingPaymentIntent });
    }

    const clientSecret =
      stripePaymentIntentClientSecretFromRedirect ||
      storedTx?.attributes?.protectedData?.stripePaymentIntents?.default
        ?.stripePaymentIntentClientSecret;

    if (!clientSecret || !onRetrievePaymentIntent) {
      return Promise.reject(getCompletedPaymentIntentOrReject(null, existingPaymentIntent?.status));
    }

    return onRetrievePaymentIntent({
      stripe,
      stripePaymentIntentClientSecret: clientSecret,
    }).then(retrieveResponse => {
      const retrievedPaymentIntent = getCompletedPaymentIntentOrReject(
        retrieveResponse?.paymentIntent
      );
      return { transactionId, paymentIntent: retrievedPaymentIntent };
    });
  };

  ///////////////////////////////////////////////////
  // Step 3: complete order                        //
  // by confirming payment against Marketplace API //
  ///////////////////////////////////////////////////
  const fnConfirmPayment = fnParams => {
    // fnParams should contain { paymentIntent, transactionId } returned in step 2
    // Remember the created PaymentIntent for step 5
    createdPaymentIntent = fnParams.paymentIntent;
    const transactionId = fnParams.transactionId;
    const isTransitionedAlready = storedTx?.attributes?.lastTransition === confirmPaymentTransition;
    const orderPromise = isTransitionedAlready
      ? Promise.resolve(storedTx)
      : onConfirmPayment(transactionId, confirmPaymentTransition, {});

    return orderPromise.then(order => {
      // Store the returned transaction (order)
      persistTransaction(order, pageData, storeData, setPageData, sessionStorageKey);
      return order;
    });
  };

  //////////////////////////////////////////////////////////
  // Step 4: optionally save card as defaultPaymentMethod //
  //////////////////////////////////////////////////////////
  const fnSavePaymentMethod = fnParams => {
    const pi = createdPaymentIntent || paymentIntent;
    const orderId = fnParams?.id;

    if (isPaymentFlowPayAndSaveCard) {
      return onSavePaymentMethod(ensuredStripeCustomer, pi.payment_method)
        .then(response => {
          if (response.errors) {
            return { orderId, paymentMethodSaved: false };
          }
          return { orderId, paymentMethodSaved: true };
        })
        .catch(e => {
          // Real error cases are catched already in paymentMethods page.
          return { orderId, paymentMethodSaved: false };
        });
    } else {
      return Promise.resolve({ orderId, paymentMethodSaved: true });
    }
  };

  // Here we create promise calls in sequence
  // This is pretty much the same as:
  // fnRequestPayment({...initialParams})
  //   .then(result => fnConfirmCardPayment({...result}))
  //   .then(result => fnConfirmPayment({...result}))
  const applyAsync = (acc, val) => acc.then(val);
  const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x));

  // Card flow may optionally save the payment method; push/redirect methods cannot.
  const handlePaymentIntentCreationWithCard = composeAsync(
    fnRequestPayment,
    fnConfirmCardPayment,
    fnConfirmPayment,
    fnSavePaymentMethod
  );

  // TODO: this is not in use by template.
  // Test carefully before taking it into use!
  //
  // Normal push/redirect path: fnConfirmRedirectPayment calls stripe.confirmPayment with
  // return_url and the browser navigates away, so the steps below never run in that session.
  // After return, useStripeRedirectPaymentReturn → resumeCheckoutAfterStripeRedirect does
  // retrieve + confirm-payment instead.
  //
  // These two steps still matter for a narrow retry edge case: Stripe already finished
  // (PI in processing/succeeded) but Marketplace confirm-payment failed (or resume never
  // completed). On re-submit, step 2 skips Stripe / does not redirect, then
  // fnRetrievePaymentIntentAfterRedirect + fnConfirmPayment finish the order in-page.
  const handlePaymentIntentCreationWithPushPayment = composeAsync(
    fnRequestPayment,
    fnConfirmRedirectPayment,
    fnRetrievePaymentIntentAfterRedirect,
    fnConfirmPayment
  );

  return isStripePushPayment
    ? handlePaymentIntentCreationWithPushPayment(orderParams)
    : handlePaymentIntentCreationWithCard(orderParams);
};

/**
 * Initialize OrderDetailsPage with given initialValues.
 *
 * @param {Object} initialValues
 * @param {Object} routes
 * @param {Function} dispatch
 */
export const setOrderPageInitialValues = (initialValues, routes, dispatch) => {
  const OrderPage = findRouteByRouteName('OrderDetailsPage', routes);

  // Transaction is already created
  dispatch(OrderPage.setInitialValues(initialValues));
};
