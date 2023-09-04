// Import contexts and util modules
import { findRouteByRouteName } from '../../util/routes';
import { ensureStripeCustomer, ensureTransaction } from '../../util/data';
import { minutesBetween } from '../../util/dates';
import { formatMoney } from '../../util/currency';
import { storeData } from './CheckoutPageSessionHelpers';

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
 * Check if payment is expired (PAYMENT_EXPIRED state) or if payment has passed 15 minute treshold from PAYMENT_PENDING
 *
 * @param {Object} existingTransaction
 * @param {Object} process
 * @returns true if payment has expired.
 */
export const hasPaymentExpired = (existingTransaction, process) => {
  const state = process.getState(existingTransaction);
  return state === process.states.PAYMENT_EXPIRED
    ? true
    : state === process.states.PAYMENT_PENDING
    ? minutesBetween(existingTransaction.attributes.lastTransitionedAt, new Date()) >= 15
    : false;
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
 * Create call sequence for checkout with Stripe PaymentIntents.
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
    message,
    onConfirmCardPayment,
    onConfirmPayment,
    onInitiateOrder,
    onSavePaymentMethod,
    onSendMessage,
    pageData,
    paymentIntent,
    process,
    setPageData,
    sessionStorageKey,
    stripeCustomer,
    stripePaymentMethodId,
  } = extraPaymentParams;
  const storedTx = ensureTransaction(pageData.transaction);

  const ensuredStripeCustomer = ensureStripeCustomer(stripeCustomer);
  const processAlias = pageData?.listing?.attributes?.publicData?.transactionProcessAlias;

  let createdPaymentIntent = null;

  ////////////////////////////////////////////////
  // Step 1: initiate order                     //
  // by requesting payment from Marketplace API //
  ////////////////////////////////////////////////
  const fnRequestPayment = fnParams => {
    // fnParams should be { listingId, deliveryMethod, quantity?, bookingDates?, paymentMethod?.setupPaymentMethodForSaving?, protectedData }
    const hasPaymentIntents = storedTx.attributes.protectedData?.stripePaymentIntents;

    const requestTransition =
      storedTx?.attributes?.lastTransition === process.transitions.INQUIRE
        ? process.transitions.REQUEST_PAYMENT_AFTER_INQUIRY
        : process.transitions.REQUEST_PAYMENT;
    const isPrivileged = process.isPrivileged(requestTransition);

    // If paymentIntent exists, order has been initiated previously.
    const orderPromise = hasPaymentIntents
      ? Promise.resolve(storedTx)
      : onInitiateOrder(fnParams, processAlias, storedTx.id, requestTransition, isPrivileged);

    orderPromise.then(order => {
      // Store the returned transaction (order)
      persistTransaction(order, pageData, storeData, setPageData, sessionStorageKey);
    });

    return orderPromise;
  };

  //////////////////////////////////
  // Step 2: pay using Stripe SDK //
  //////////////////////////////////
  const fnConfirmCardPayment = fnParams => {
    // fnParams should be returned transaction entity
    const order = fnParams;

    const hasPaymentIntents = order?.attributes?.protectedData?.stripePaymentIntents;
    if (!hasPaymentIntents) {
      throw new Error(
        `Missing StripePaymentIntents key in transaction's protectedData. Check that your transaction process is configured to use payment intents.`
      );
    }

    const { stripePaymentIntentClientSecret } = hasPaymentIntents
      ? order.attributes.protectedData.stripePaymentIntents.default
      : null;

    const { stripe, card, billingDetails, paymentIntent } = extraPaymentParams;
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
      ? Promise.resolve({ transactionId: order?.id, paymentIntent })
      : onConfirmCardPayment(params);
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
    const transitionName = process.transitions.CONFIRM_PAYMENT;
    const isTransitionedAlready = storedTx?.attributes?.lastTransition === transitionName;
    const orderPromise = isTransitionedAlready
      ? Promise.resolve(storedTx)
      : onConfirmPayment(transactionId, transitionName, {});

    orderPromise.then(order => {
      // Store the returned transaction (order)
      persistTransaction(order, pageData, storeData, setPageData, sessionStorageKey);
    });

    return orderPromise;
  };

  //////////////////////////////////
  // Step 4: send initial message //
  //////////////////////////////////
  const fnSendMessage = fnParams => {
    const orderId = fnParams?.id;
    return onSendMessage({ id: orderId, message });
  };

  //////////////////////////////////////////////////////////
  // Step 5: optionally save card as defaultPaymentMethod //
  //////////////////////////////////////////////////////////
  const fnSavePaymentMethod = fnParams => {
    const pi = createdPaymentIntent || paymentIntent;

    if (isPaymentFlowPayAndSaveCard) {
      return onSavePaymentMethod(ensuredStripeCustomer, pi.payment_method)
        .then(response => {
          if (response.errors) {
            return { ...fnParams, paymentMethodSaved: false };
          }
          return { ...fnParams, paymentMethodSaved: true };
        })
        .catch(e => {
          // Real error cases are catched already in paymentMethods page.
          return { ...fnParams, paymentMethodSaved: false };
        });
    } else {
      return Promise.resolve({ ...fnParams, paymentMethodSaved: true });
    }
  };

  // Here we create promise calls in sequence
  // This is pretty much the same as:
  // fnRequestPayment({...initialParams})
  //   .then(result => fnConfirmCardPayment({...result}))
  //   .then(result => fnConfirmPayment({...result}))
  const applyAsync = (acc, val) => acc.then(val);
  const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x));
  const handlePaymentIntentCreation = composeAsync(
    fnRequestPayment,
    fnConfirmCardPayment,
    fnConfirmPayment,
    fnSendMessage,
    fnSavePaymentMethod
  );

  return handlePaymentIntentCreation(orderParams);
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

  // Transaction is already created, but if the initial message
  // sending failed, we tell it to the OrderDetailsPage.
  dispatch(OrderPage.setInitialValues(initialValues));
};
