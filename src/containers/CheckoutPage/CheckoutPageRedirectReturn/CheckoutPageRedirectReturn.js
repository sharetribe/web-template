import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { pathByRouteName } from '../../../util/routes';
import { PAYMENT_METHOD_CARD } from '../../../transactions/paymentMethods';
import { getProcess } from '../../../transactions/transaction';
import { STRIPE_JS_LOADED_EVENT } from '../../../util/includeScripts';
import { IconSpinner, Page, PrimaryButton, TopbarSimplified } from '../../../components';

import { clearData } from '../CheckoutPageSessionHelpers';
import {
  completeCheckoutNavigation,
  getStripeRedirectReturnParams,
} from '../CheckoutPageTransactionHelpers';
import {
  resolveStripeInstance,
  resumeCheckoutAfterStripeRedirect,
} from './CheckoutPageRedirectReturn.helpers';

import css from './CheckoutPageRedirectReturn.module.css';

const STORAGE_KEY = 'CheckoutPage';

// Customer can pay again on CheckoutPage for these Stripe / redirect outcomes.
const RECOVERABLE_REDIRECT_PAYMENT_STATUSES = ['canceled', 'requires_payment_method', 'failed'];

// Module-level so a given Stripe payment_intent_client_secret is only resumed once per page
// lifetime — effect re-runs (stripe ready, search changes) and React Strict Mode must not
// start a second retrieve/confirm for the same return. Incomplete cleanup deletes the secret
// so a remount can retry when resume never settled.
const handledRedirectPaymentReturns = new Set();

const isRecoverableRedirectPaymentStatus = status =>
  RECOVERABLE_REDIRECT_PAYMENT_STATUSES.includes(status);

const redirectToCheckoutWithError = ({
  history,
  routeConfiguration,
  pathParams,
  redirectPaymentStatusError,
}) => {
  const checkoutPath = pathByRouteName('CheckoutPage', routeConfiguration, {
    id: pathParams.id,
    slug: pathParams.slug,
  });
  history.replace({
    pathname: checkoutPath,
    state: { redirectPaymentStatusError },
  });
};

/**
 * Shown after the customer returns from a bank or wallet redirect (e.g. iDEAL).
 *
 * Mounted by CheckoutPage when route mode is `return-after-redirect`. Shows a spinner, finishes
 * Marketplace confirm-payment using checkout session data, then goes to OrderDetailsPage on
 * success. If the payment was canceled or needs another attempt, sends the customer back to
 * CheckoutPage; other confirm failures stay here with a retry button.
 *
 * @component
 * @param {Object} props from CheckoutPage / AccessWrapper
 * @returns {JSX.Element}
 */
const CheckoutPageRedirectReturn = props => {
  const {
    params: pathParams,
    pageData,
    setPageData,
    isDataLoaded,
    processName,
    onConfirmPayment,
    onRetrievePaymentIntent,
    scrollingDisabled,
  } = props;

  const dispatch = useDispatch();
  const history = useHistory();
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  const [resumeInProgress, setResumeInProgress] = useState(true);
  const [resumeError, setResumeError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stripeJsReady, setStripeJsReady] = useState(
    () => typeof window !== 'undefined' && typeof window.Stripe === 'function'
  );

  const transactionId = pageData?.transaction?.id?.uuid || null;
  const search = history.location.search;
  const publishableKey = config?.stripe?.publishableKey;

  const latestRef = useRef({});
  latestRef.current = {
    pageData,
    config,
    onConfirmPayment,
    onRetrievePaymentIntent,
    routeConfiguration,
    dispatch,
    pathParams,
  };

  // Wait until Stripe.js is available (already loaded, or STRIPE_JS_LOADED_EVENT).
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

  // After session data is ready, resume retrieve + Marketplace confirm (or send back to checkout).
  useEffect(() => {
    if (!isDataLoaded) {
      return undefined;
    }

    const { redirectStatus, paymentIntentClientSecret } = getStripeRedirectReturnParams(search);
    const latest = latestRef.current;

    const failToCheckout = status => {
      setResumeInProgress(false);
      redirectToCheckoutWithError({
        history,
        routeConfiguration: latest.routeConfiguration,
        pathParams: latest.pathParams,
        redirectPaymentStatusError: status,
      });
    };

    const failWithRetry = status => {
      setResumeInProgress(false);
      setResumeError(status || 'failed');
      if (paymentIntentClientSecret) {
        handledRedirectPaymentReturns.delete(paymentIntentClientSecret);
      }
    };

    if (!redirectStatus || !paymentIntentClientSecret) {
      failToCheckout('failed');
      return undefined;
    }

    // Stripe reported a failed/canceled payment — customer must pay again on CheckoutPage.
    if (isRecoverableRedirectPaymentStatus(redirectStatus)) {
      handledRedirectPaymentReturns.add(paymentIntentClientSecret);
      failToCheckout(redirectStatus);
      return undefined;
    }

    if (!transactionId || !processName) {
      handledRedirectPaymentReturns.add(paymentIntentClientSecret);
      failToCheckout('failed');
      console.error(
        new Error('Missing hydrated transaction or process when resuming Stripe redirect payment')
      );
      return undefined;
    }

    if (handledRedirectPaymentReturns.has(paymentIntentClientSecret)) {
      return undefined;
    }

    let process;
    try {
      process = getProcess(processName);
    } catch (e) {
      handledRedirectPaymentReturns.add(paymentIntentClientSecret);
      failToCheckout('failed');
      console.error(e);
      return undefined;
    }

    const stripeInstance = resolveStripeInstance(latest.config?.stripe?.publishableKey);
    if (!stripeInstance) {
      return undefined;
    }

    handledRedirectPaymentReturns.add(paymentIntentClientSecret);
    setResumeInProgress(true);
    setResumeError(null);

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
      sessionStorageKey: STORAGE_KEY,
      setPageData,
      checkoutPaymentMethod: resumeCheckoutPaymentMethod,
    })
      .then(response => {
        resumeSettled = true;
        if (isEffectCancelled) {
          return;
        }
        completeCheckoutNavigation({
          response,
          history,
          routeConfiguration: latest.routeConfiguration,
          dispatch: latest.dispatch,
          onSubmitCallback: () => clearData(STORAGE_KEY),
        });
      })
      .catch(e => {
        resumeSettled = true;
        if (isEffectCancelled) {
          return;
        }
        const status = e?.redirectPaymentStatus || 'failed';
        if (isRecoverableRedirectPaymentStatus(status)) {
          failToCheckout(status);
          return;
        }
        // Stripe payment likely succeeded; Marketplace confirm (or retrieve) failed — retry here.
        failWithRetry(status);
      });

    return () => {
      isEffectCancelled = true;
      if (!resumeSettled) {
        handledRedirectPaymentReturns.delete(paymentIntentClientSecret);
      }
    };
  }, [
    isDataLoaded,
    search,
    stripeJsReady,
    publishableKey,
    history,
    transactionId,
    processName,
    retryCount,
    setPageData,
  ]);

  const title = intl.formatMessage({ id: 'CheckoutPage.redirectReturn.title' });

  const handleRetry = () => {
    setResumeError(null);
    setResumeInProgress(true);
    setRetryCount(count => count + 1);
  };

  return (
    // no-referrer: payment_intent_client_secret may still be in the URL until stripped elsewhere.
    <Page title={title} scrollingDisabled={scrollingDisabled} referrer="no-referrer">
      <TopbarSimplified />
      {resumeError && !resumeInProgress ? (
        <div className={css.content}>
          <p className={css.orderError}>
            <FormattedMessage id="CheckoutPage.redirectReturn.resumeFailed" />
          </p>
          <PrimaryButton className={css.retry} onClick={handleRetry} type="button">
            <FormattedMessage id="CheckoutPage.redirectReturn.retry" />
          </PrimaryButton>
        </div>
      ) : (
        <IconSpinner className={css.spinner} />
      )}
    </Page>
  );
};

export default CheckoutPageRedirectReturn;
