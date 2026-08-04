import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { PAYMENT_METHOD_CARD } from '../../transactions/paymentMethods';
import { getProcess } from '../../transactions/transaction';
import { STRIPE_JS_LOADED_EVENT } from '../../util/includeScripts';
import { getStripeRedirectReturnParams } from './CheckoutPageTransactionHelpers';

// Module-level (file scope) so a given Stripe payment_intent_client_secret is only resumed once per page
// lifetime — effect re-runs (stripe ready, search changes) and React Strict Mode must not
// start a second retrieve/confirm for the same return. Incomplete cleanup deletes the secret
// so a remount can retry when resume never settled.
const handledRedirectPaymentReturns = new Set();

/** Drop Stripe redirect query params so a refresh does not re-run the resume flow. */
const clearStripeRedirectQueryParams = (history, pathname) => {
  history.replace({ pathname, search: '' });
};

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
const resumeCheckoutAfterStripeRedirect = ({
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
 * After a full-page redirect, Stripe.js may not yet be in React state. Prefer the instance from
 * StripePaymentForm; otherwise create one with the publishable key.
 *
 * @param {Object|null} stripeFromState
 * @param {string} publishableKey
 * @returns {Object|null}
 */
const resolveStripeInstance = (stripeFromState, publishableKey) => {
  if (stripeFromState) {
    return stripeFromState;
  }
  if (typeof window !== 'undefined' && window.Stripe && publishableKey) {
    return window.Stripe(publishableKey);
  }
  return null;
};

/**
 * Resume push/redirect checkout after Stripe returns to the checkout page.
 *
 * Push payment methods (e.g. iDEAL) are not shipped in the template yet; this hook is isolated so
 * the card checkout path stays free of redirect-return orchestration.
 *
 * Important: effect deps must stay referentially stable. `getProcess()` returns a new object every
 * call — using that (or whole `pageData` / `config`) as a dep re-ran this effect on every render.
 * After a failed iDEAL return that could spam privileged transitions when the customer retries.
 *
 * @param {Object} params
 * @param {Object} params.pageData
 * @param {string|null|undefined} params.processName
 * @param {Object|null} params.stripe
 * @param {Function} params.onConfirmPayment
 * @param {Function} params.onRetrievePaymentIntent
 * @param {string} params.sessionStorageKey
 * @param {Function} params.setPageData
 * @param {Function} params.dispatch
 * @param {Function} params.onSubmitCallback
 * @param {Function} params.completeCheckoutNavigation
 * @returns {string|null} redirectPaymentStatusError — from error.redirectPaymentStatus or 'failed'
 */
export const useStripeRedirectPaymentReturn = ({
  pageData,
  processName,
  stripe,
  onConfirmPayment,
  onRetrievePaymentIntent,
  sessionStorageKey,
  setPageData,
  dispatch,
  onSubmitCallback,
  completeCheckoutNavigation,
}) => {
  const history = useHistory();
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();

  const [redirectPaymentStatusError, setRedirectPaymentStatusError] = useState(null);
  // Payment form is not mounted during redirect return (spinner instead). Listen for Stripe.js
  // so resume can create an instance without onStripeInitialized from StripePaymentForm.
  const [stripeJsReady, setStripeJsReady] = useState(
    () => typeof window !== 'undefined' && typeof window.Stripe === 'function'
  );

  // Latest values for the async resume without putting unstable identities in effect deps.
  const latestRef = useRef({});
  latestRef.current = {
    pageData,
    stripe,
    config,
    onConfirmPayment,
    onRetrievePaymentIntent,
    sessionStorageKey,
    setPageData,
    routeConfiguration,
    dispatch,
    onSubmitCallback,
    completeCheckoutNavigation,
  };

  const transactionId = pageData?.transaction?.id?.uuid || null;
  const search = history.location.search;
  const pathname = history.location.pathname;
  const publishableKey = config?.stripe?.publishableKey;
  const hasStripeInstance = !!stripe;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (window.Stripe) {
      setStripeJsReady(true);
      return undefined;
    }
    const handleStripeJsLoaded = () => setStripeJsReady(true);
    window.addEventListener(STRIPE_JS_LOADED_EVENT, handleStripeJsLoaded);
    return () => window.removeEventListener(STRIPE_JS_LOADED_EVENT, handleStripeJsLoaded);
  }, []);

  useEffect(() => {
    const { redirectStatus, paymentIntentClientSecret } = getStripeRedirectReturnParams(search);
    // Normal checkout load — no Stripe return params.
    if (!redirectStatus || !paymentIntentClientSecret) {
      return;
    }

    // Stripe reported failure on return; show error and stay on checkout.
    if (redirectStatus === 'failed') {
      handledRedirectPaymentReturns.add(paymentIntentClientSecret);
      setRedirectPaymentStatusError('failed');
      clearStripeRedirectQueryParams(history, pathname);
      return;
    }

    // Return params without a hydrated transaction/process indicate a broken resume invariant.
    if (!transactionId || !processName) {
      handledRedirectPaymentReturns.add(paymentIntentClientSecret);
      setRedirectPaymentStatusError('failed');
      clearStripeRedirectQueryParams(history, pathname);
      console.error(
        new Error('Missing hydrated transaction or process when resuming Stripe redirect payment')
      );
      return;
    }

    if (handledRedirectPaymentReturns.has(paymentIntentClientSecret)) {
      return;
    }

    let process;
    try {
      process = getProcess(processName);
    } catch (e) {
      handledRedirectPaymentReturns.add(paymentIntentClientSecret);
      setRedirectPaymentStatusError('failed');
      clearStripeRedirectQueryParams(history, pathname);
      console.error(e);
      return;
    }

    const latest = latestRef.current;
    const stripeInstance = resolveStripeInstance(
      latest.stripe,
      latest.config?.stripe?.publishableKey
    );
    // Cold return: wait until publishable key can create Stripe.js (or form provided an instance).
    if (!stripeInstance) {
      return;
    }

    handledRedirectPaymentReturns.add(paymentIntentClientSecret);
    // Do not clear redirect query params here: `search` is an effect dep, so clearing
    // would re-run this effect, set isEffectCancelled, and drop navigation after a
    // successful resume. Params are cleared on success (completeCheckoutNavigation)
    // or in the failure path below.

    let isEffectCancelled = false;
    let resumeSettled = false;
    const transaction = latest.pageData?.transaction;
    const resumeCheckoutPaymentMethod =
      transaction?.attributes?.protectedData?.checkoutPaymentMethod || PAYMENT_METHOD_CARD;

    resumeCheckoutAfterStripeRedirect({
      pageData: latest.pageData,
      stripe: stripeInstance,
      process,
      onConfirmPayment: latest.onConfirmPayment,
      onRetrievePaymentIntent: latest.onRetrievePaymentIntent,
      stripePaymentIntentClientSecretFromRedirect: paymentIntentClientSecret,
      sessionStorageKey: latest.sessionStorageKey,
      setPageData: latest.setPageData,
      checkoutPaymentMethod: resumeCheckoutPaymentMethod,
    })
      .then(response => {
        resumeSettled = true;
        if (isEffectCancelled) {
          return;
        }
        setRedirectPaymentStatusError(null);
        latest.completeCheckoutNavigation({
          response,
          history,
          routeConfiguration: latest.routeConfiguration,
          dispatch: latest.dispatch,
          onSubmitCallback: latest.onSubmitCallback,
          clearRedirectQueryParams: true,
          pathname,
        });
      })
      .catch(e => {
        resumeSettled = true;
        if (isEffectCancelled) {
          return;
        }
        // Prefer status from toRedirectPaymentStatus (on the rejected error); otherwise 'failed'.
        setRedirectPaymentStatusError(e?.redirectPaymentStatus || 'failed');
        clearStripeRedirectQueryParams(history, pathname);
      });

    return () => {
      isEffectCancelled = true;
      // Allow a remount (e.g. React Strict Mode) to retry if this run did not finish.
      if (!resumeSettled) {
        handledRedirectPaymentReturns.delete(paymentIntentClientSecret);
      }
    };
  }, [search, pathname, hasStripeInstance, stripeJsReady, publishableKey, history]);

  return redirectPaymentStatusError;
};
