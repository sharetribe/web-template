import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Import util modules
import { userDisplayNameAsString } from '../../util/data';
import { isUserAuthorized } from '../../util/userHelpers';
import {
  INQUIRY_PROCESS_NAME,
  REQUEST,
  resolveLatestProcessName,
  isNegotiationProcess,
} from '../../transactions/transaction';
import { requireListingImage } from '../../util/configHelpers';

// Import global thunk functions
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { confirmCardPayment, retrievePaymentIntent } from '../../ducks/stripe.duck';
import { savePaymentMethod } from '../../ducks/paymentMethods.duck';

// Import shared components
import { IconSpinner, NamedRedirect, Page, TopbarSimplified } from '../../components';

// Session helpers file needs to be imported before CheckoutPageWithPayment and CheckoutPageWithInquiryProcess
import { storeData, clearData, handlePageData } from './CheckoutPageSessionHelpers';

// Import modules from this directory
import {
  initiateOrder,
  setInitialValues,
  speculateTransaction,
  stripeCustomer,
  confirmPayment,
  initiateInquiryWithoutPayment,
} from './CheckoutPage.duck';

import CheckoutPageWithPayment, {
  loadInitialDataForStripePayments,
} from './CheckoutPageWithPayment';
import CheckoutPageWithInquiryProcess from './CheckoutPageWithInquiryProcess';
import CheckoutPageAccessWrapper from './CheckoutPageAccessWrapper';
import css from './CheckoutPage.module.css';

const STORAGE_KEY = 'CheckoutPage';

const onSubmitCallback = () => {
  clearData(STORAGE_KEY);
};

const getProcessName = pageData => {
  const { transaction, listing } = pageData || {};
  const processName = transaction?.id
    ? transaction?.attributes?.processName
    : listing?.id
    ? listing?.attributes?.publicData?.transactionProcessAlias?.split('/')[0]
    : null;
  return resolveLatestProcessName(processName);
};

const CheckoutPageComponent = props => {
  const [pageData, setPageData] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const {
      config,
      history,
      currentUser,
      orderData,
      listing,
      transaction,
      fetchSpeculatedTransaction,
      fetchStripeCustomer,
    } = props;
    const initialData = { orderData, listing, transaction };
    const data = handlePageData(initialData, STORAGE_KEY, history);
    setPageData(data || {});
    setIsDataLoaded(true);

    // Do not fetch extra data if user is not active (E.g. they are in pending-approval state.)
    if (isUserAuthorized(currentUser)) {
      // This is for processes using payments with Stripe integration
      if (getProcessName(data) !== INQUIRY_PROCESS_NAME) {
        // Fetch StripeCustomer and speculateTransition for transactions that include Stripe payments
        loadInitialDataForStripePayments({
          pageData: data || {},
          fetchSpeculatedTransaction,
          fetchStripeCustomer,
          config,
        });
      }
    }
  }, []);

  const {
    config,
    routeConfiguration,
    intl,
    history,
    currentUser,
    params,
    scrollingDisabled,
    speculateTransactionInProgress,
    onInquiryWithoutPayment,
    initiateOrderError,
  } = props;

  const processName = getProcessName(pageData);
  const isInquiryProcess = processName === INQUIRY_PROCESS_NAME;

  // Handle redirection to ListingPage if required data is not available
  const listing = pageData?.listing;
  const unitType = listing?.attributes?.publicData?.unitType;
  const isRequest = unitType === REQUEST;
  const isOwnListing = currentUser?.id && listing?.author?.id?.uuid === currentUser?.id?.uuid;
  const hasRequiredData = !!(listing?.id && listing?.author?.id && processName);
  const shouldRedirect = isDataLoaded && !(hasRequiredData && (!isOwnListing || isRequest));

  // Redirect back to ListingPage if data is missing.
  // Redirection must happen before any data format error is thrown (e.g. wrong currency)
  if (shouldRedirect) {
    console.error('Missing or invalid data for checkout, redirecting back to listing page.', {
      listing,
    });
    return <NamedRedirect name="ListingPage" params={params} />;
  }

  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(
    conf => conf.listingType === listing?.attributes?.publicData?.listingType
  );
  const showListingImage = requireListingImage(foundListingTypeConfig);
  const transactionFieldConfigs = foundListingTypeConfig?.transactionFields;
  // We don't show or collect transaction fields on the checkout page for
  // negotiation processes, because they are collected in earlier steps
  // of those processes
  const showTransactionFields = !isNegotiationProcess(processName);

  const listingTitle = listing?.attributes?.title;
  const authorDisplayName = userDisplayNameAsString(listing?.author, '');
  const title = processName
    ? intl.formatMessage(
        { id: `CheckoutPage.${processName}.title` },
        { listingTitle, authorDisplayName }
      )
    : 'Checkout page is loading data';

  return processName && isInquiryProcess ? (
    <CheckoutPageWithInquiryProcess
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      processName={processName}
      pageData={pageData}
      listingTitle={listingTitle}
      title={title}
      onInquiryWithoutPayment={onInquiryWithoutPayment}
      onSubmitCallback={onSubmitCallback}
      showListingImage={showListingImage}
      transactionFieldConfigs={transactionFieldConfigs}
      {...props}
    />
  ) : processName && !isInquiryProcess && !speculateTransactionInProgress ? (
    <CheckoutPageWithPayment
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      processName={processName}
      sessionStorageKey={STORAGE_KEY}
      pageData={pageData}
      setPageData={setPageData}
      listingTitle={listingTitle}
      title={title}
      onSubmitCallback={onSubmitCallback}
      showListingImage={showListingImage}
      transactionFieldConfigs={transactionFieldConfigs}
      showTransactionFields={showTransactionFields}
      {...props}
    />
  ) : (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <TopbarSimplified />
      <IconSpinner className={css.spinner} />
    </Page>
  );
};

/**
 * The CheckoutPage "container" component.
 * This component handles props (state and dispatch actions) and passes them to the CheckoutPageAccessWrapper.
 *
 * @component
 * @param {Object} props from the router (routeConfiguration.js and Routes.js).
 * @returns {JSX.Element}
 */
const CheckoutPage = props => {
  const dispatch = useDispatch();

  const {
    listing,
    orderData,
    stripeCustomerFetched,
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    isClockInSync,
    transaction,
    initiateInquiryError,
    initiateOrderError,
    confirmPaymentError,
  } = useSelector(state => state.CheckoutPage);

  const currentUser = useSelector(state => state.user.currentUser);
  const { confirmCardPaymentError, paymentIntent, retrievePaymentIntentError } = useSelector(
    state => state.stripe
  );
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const fetchSpeculatedTransaction = useCallback(
    (params, processAlias, txId, transitionName, isPrivileged) =>
      dispatch(speculateTransaction(params, processAlias, txId, transitionName, isPrivileged)),
    [dispatch]
  );
  const fetchStripeCustomer = useCallback(() => dispatch(stripeCustomer()), [dispatch]);
  const onInquiryWithoutPayment = useCallback(
    (params, processAlias, transitionName) =>
      dispatch(initiateInquiryWithoutPayment(params, processAlias, transitionName)),
    [dispatch]
  );
  const onInitiateOrder = useCallback(
    (params, processAlias, transactionId, transitionName, isPrivileged) =>
      dispatch(initiateOrder(params, processAlias, transactionId, transitionName, isPrivileged)),
    [dispatch]
  );
  const onRetrievePaymentIntent = useCallback(params => dispatch(retrievePaymentIntent(params)), [
    dispatch,
  ]);
  const onConfirmCardPayment = useCallback(params => dispatch(confirmCardPayment(params)), [
    dispatch,
  ]);
  const onConfirmPayment = useCallback(
    (transactionId, transitionName, transitionParams) =>
      dispatch(confirmPayment(transactionId, transitionName, transitionParams)),
    [dispatch]
  );
  const onSavePaymentMethod = useCallback(
    (stripeCustomer, stripePaymentMethodId) =>
      dispatch(savePaymentMethod(stripeCustomer, stripePaymentMethodId)),
    [dispatch]
  );

  return (
    <CheckoutPageAccessWrapper
      {...props}
      PageComponent={CheckoutPageComponent}
      currentUser={currentUser}
      listing={listing}
      orderData={orderData}
      stripeCustomerFetched={stripeCustomerFetched}
      speculateTransactionInProgress={speculateTransactionInProgress}
      speculateTransactionError={speculateTransactionError}
      speculatedTransaction={speculatedTransaction}
      isClockInSync={isClockInSync}
      transaction={transaction}
      initiateInquiryError={initiateInquiryError}
      initiateOrderError={initiateOrderError}
      confirmCardPaymentError={confirmCardPaymentError}
      confirmPaymentError={confirmPaymentError}
      paymentIntent={paymentIntent}
      retrievePaymentIntentError={retrievePaymentIntentError}
      scrollingDisabled={scrollingDisabled}
      dispatch={dispatch}
      fetchSpeculatedTransaction={fetchSpeculatedTransaction}
      fetchStripeCustomer={fetchStripeCustomer}
      onInquiryWithoutPayment={onInquiryWithoutPayment}
      onInitiateOrder={onInitiateOrder}
      onRetrievePaymentIntent={onRetrievePaymentIntent}
      onConfirmCardPayment={onConfirmCardPayment}
      onConfirmPayment={onConfirmPayment}
      onSavePaymentMethod={onSavePaymentMethod}
    />
  );
};

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
