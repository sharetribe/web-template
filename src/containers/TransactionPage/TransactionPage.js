import React, { useState } from 'react';
import { array, arrayOf, bool, func, number, object, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import {
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  LISTING_UNIT_TYPES,
  LINE_ITEM_HOUR,
  propTypes,
} from '../../util/types';
import { timestampToDate, timeOfDayFromTimeZoneToLocal } from '../../util/dates';
import { createSlug } from '../../util/urlHelpers';
import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  getProcess,
} from '../../util/transaction';
import routeConfiguration from '../../routing/routeConfiguration';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

import {
  NamedRedirect,
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  UserDisplayName,
  OrderBreakdown,
  OrderPanel,
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import { getStateData } from './TransactionPage.stateData';
import ActivityFeed from './ActivityFeed/ActivityFeed';
import DisputeModal from './DisputeModal/DisputeModal';
import ReviewModal from './ReviewModal/ReviewModal';
import TransactionPanel from './TransactionPanel/TransactionPanel';

import {
  makeTransition,
  sendMessage,
  sendReview,
  fetchMoreMessages,
  fetchTimeSlots,
  fetchTransactionLineItems,
} from './TransactionPage.duck';
import css from './TransactionPage.module.css';

// Submit dispute and close the review modal
const onDisputeOrder = (currentTransactionId, transitionName, onTransition) => values => {
  const { disputeReason } = values;
  const params = disputeReason ? { protectedData: { disputeReason } } : {};
  onTransition(currentTransactionId, transitionName, params)
    .then(r => {
      return setState(prevState => ({ ...prevState, disputeSubmitted: true }));
    })
    .catch(e => {
      // Do nothing.
    });
};

// TransactionPage handles data loading for Sale and Order views to transaction pages in Inbox.
export const TransactionPageComponent = props => {
  const [state, setState] = useState({
    isDisputeModalOpen: false,
    disputeSubmitted: false,
    isReviewModalOpen: false,
    reviewSubmitted: false,
  });
  const {
    currentUser,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed,
    fetchMessagesError,
    fetchMessagesInProgress,
    totalMessagePages,
    oldestMessagePageFetched,
    fetchTransactionError,
    history,
    intl,
    messages,
    onManageDisableScrolling,
    onSendMessage,
    onSendReview,
    onShowMoreMessages,
    params,
    scrollingDisabled,
    sendMessageError,
    sendMessageInProgress,
    sendReviewError,
    sendReviewInProgress,
    transaction,
    transactionRole,
    transitionInProgress,
    transitionError,
    onTransition,
    monthlyTimeSlots,
    onFetchTimeSlots,
    nextTransitions,
    callSetInitialValues,
    onInitializeCardPaymentData,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  } = props;

  const { listing, provider, customer, booking } = transaction || {};
  const txTransitions = transaction?.attributes?.transitions || [];
  const isProviderRole = transactionRole === PROVIDER;
  const isCustomerRole = transactionRole === CUSTOMER;

  const processName = transaction?.attributes?.processName;
  const process = processName ? getProcess(processName) : null;

  const isTxOnPaymentPending = tx => {
    return process ? process.getState(tx) === process.states.PAYMENT_PENDING : null;
  };

  const redirectToCheckoutPageWithInitialValues = (initialValues, currentListing) => {
    const routes = routeConfiguration();
    // Customize checkout page state with current listing and selected bookingDates
    const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);
    callSetInitialValues(setInitialValues, initialValues);

    // Clear previous Stripe errors from store if there is any
    onInitializeCardPaymentData();

    // Redirect to CheckoutPage
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routes,
        { id: currentListing.id.uuid, slug: createSlug(currentListing.attributes.title) },
        {}
      )
    );
  };

  // If payment is pending, redirect to CheckoutPage
  if (
    transaction?.id &&
    isTxOnPaymentPending(transaction) &&
    isCustomerRole &&
    transaction.attributes.lineItems
  ) {
    const bookingDatesMaybe = booking.id
      ? {
          bookingDates: {
            // In day-based booking process, booking start and end come in server's time zone.
            bookingStart: timeOfDayFromTimeZoneToLocal(booking?.attributes?.start, apiTimeZone),
            bookingEnd: timeOfDayFromTimeZoneToLocal(booking?.attributes?.end, apiTimeZone),
          },
        }
      : {};

    const apiTimeZone = 'Etc/UTC';
    const initialValues = {
      listing,
      // Transaction with payment pending should be passed to CheckoutPage
      transaction,
      // Original orderData content is not available,
      // but it is already used since booking is created.
      // (E.g. quantity is used when booking is created.)
      orderData: {
        ...bookingDatesMaybe,
      },
    };

    redirectToCheckoutPageWithInitialValues(initialValues, listing);
  }

  // Customer can create a booking, if the tx is in "enquiry" state.
  const handleSubmitOrderRequest = values => {
    const {
      bookingDates,
      bookingStartTime,
      bookingEndTime,
      quantity: quantityRaw,
      deliveryMethod,
      ...otherOrderData
    } = values;

    const bookingMaybe = bookingDates
      ? {
          bookingDates: {
            bookingStart: bookingDates.startDate,
            bookingEnd: bookingDates.endDate,
          },
        }
      : bookingStartTime && bookingEndTime
      ? {
          bookingDates: {
            bookingStart: timestampToDate(bookingStartTime),
            bookingEnd: timestampToDate(bookingEndTime),
          },
        }
      : {};

    const quantityMaybe = Number.isInteger(quantityRaw)
      ? { quantity: Number.parseInt(quantityRaw, 10) }
      : {};
    const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};

    const initialValues = {
      listing,
      // enquired transaction should be passed to CheckoutPage
      transaction,
      orderData: {
        ...bookingMaybe,
        ...quantityMaybe,
        ...deliveryMethodMaybe,
        ...otherOrderData,
      },
      confirmPaymentError: null,
    };

    redirectToCheckoutPageWithInitialValues(initialValues, listing);
  };

  // Open review modal
  // This is called from ActivityFeed and from action buttons
  const onOpenReviewModal = () => {
    setState(prevState => ({ ...prevState, isReviewModalOpen: true }));
  };

  // Submit review and close the review modal
  const onSubmitReview = values => {
    const { reviewRating, reviewContent } = values;
    const rating = Number.parseInt(reviewRating, 10);
    const { states, transitions } = process;
    const transitionOptions =
      transactionRole === CUSTOMER
        ? {
            reviewAsFirst: transitions.REVIEW_1_BY_CUSTOMER,
            reviewAsSecond: transitions.REVIEW_2_BY_CUSTOMER,
            hasOtherPartyReviewedFirst: process
              .getTransitionsToStates([states.REVIEWED_BY_PROVIDER])
              .includes(transaction.attributes.lastTransition),
          }
        : {
            reviewAsFirst: transitions.REVIEW_1_BY_PROVIDER,
            reviewAsSecond: transitions.REVIEW_2_BY_PROVIDER,
            hasOtherPartyReviewedFirst: process
              .getTransitionsToStates([states.REVIEWED_BY_CUSTOMER])
              .includes(transaction.attributes.lastTransition),
          };
    const params = { reviewRating: rating, reviewContent };

    onSendReview(transaction, transitionOptions, params)
      .then(r =>
        setState(prevState => ({ ...prevState, isReviewModalOpen: false, reviewSubmitted: true }))
      )
      .catch(e => {
        // Do nothing.
      });
  };

  // Open dispute modal
  const onOpenDisputeModal = () => {
    setState(prevState => ({ ...prevState, isDisputeModalOpen: true }));
  };

  const deletedListingTitle = intl.formatMessage({
    id: 'TransactionPage.deletedListing',
  });
  const listingTitle = listing?.attributes?.deleted
    ? deletedListingTitle
    : listing?.attributes?.title;

  // Redirect users with someone else's direct link to their own inbox/sales or inbox/orders page.
  const isDataAvailable =
    currentUser &&
    transaction?.id &&
    transaction?.id?.uuid === params.id &&
    transaction?.attributes?.lineItems &&
    transaction.customer &&
    transaction.provider &&
    !fetchTransactionError;

  const isOwnSale = isDataAvailable && isProviderRole && currentUser.id.uuid === provider?.id?.uuid;
  const isOwnOrder =
    isDataAvailable && isCustomerRole && currentUser.id.uuid === customer?.id?.uuid;

  if (isDataAvailable && isProviderRole && !isOwnSale) {
    // eslint-disable-next-line no-console
    console.error('Tried to access a sale that was not owned by the current user');
    return <NamedRedirect name="InboxPage" params={{ tab: 'sales' }} />;
  } else if (isDataAvailable && isCustomerRole && !isOwnOrder) {
    // eslint-disable-next-line no-console
    console.error('Tried to access an order that was not owned by the current user');
    return <NamedRedirect name="InboxPage" params={{ tab: 'orders' }} />;
  }

  const detailsClassName = classNames(css.tabContent, css.tabContentVisible);

  const fetchErrorMessage = isCustomerRole
    ? 'TransactionPage.fetchOrderFailed'
    : 'TransactionPage.fetchSaleFailed';
  const loadingMessage = isCustomerRole
    ? 'TransactionPage.loadingOrderData'
    : 'TransactionPage.loadingSaleData';

  const loadingOrFailedFetching = fetchTransactionError ? (
    <p className={css.error}>
      <FormattedMessage id={`${fetchErrorMessage}`} />
    </p>
  ) : (
    <p className={css.loading}>
      <FormattedMessage id={`${loadingMessage}`} />
    </p>
  );

  const initialMessageFailed = !!(
    initialMessageFailedToTransaction &&
    initialMessageFailedToTransaction.uuid === transaction?.id?.uuid
  );

  const otherUserDisplayName = isOwnOrder ? (
    <UserDisplayName user={provider} intl={intl} />
  ) : (
    <UserDisplayName user={customer} intl={intl} />
  );

  const stateData = isDataAvailable
    ? getStateData(
        {
          transaction,
          transactionRole,
          nextTransitions,
          transitionInProgress,
          transitionError,
          sendReviewInProgress,
          sendReviewError,
          onTransition,
          onOpenReviewModal,
          intl,
        },
        process
      )
    : {};

  const hasLineItems = transaction?.attributes?.lineItems?.length > 0;
  const unitLineItem = hasLineItems
    ? transaction.attributes?.lineItems?.find(
        item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
      )
    : null;

  const lineItemUnitType = unitLineItem
    ? unitLineItem.code
    : isDataAvailable
    ? `line-item/${listing?.attributes?.publicData?.unitType}`
    : null;

  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const dateType = lineItemUnitType === LINE_ITEM_HOUR ? DATE_TYPE_DATETIME : DATE_TYPE_DATE;

  const txBookingMaybe = booking?.id ? { booking, dateType, timeZone } : {};
  const orderBreakdownMaybe = hasLineItems
    ? {
        orderBreakdown: (
          <OrderBreakdown
            className={css.breakdown}
            userRole={transactionRole}
            transaction={transaction}
            {...txBookingMaybe}
          />
        ),
      }
    : {};

  // TransactionPanel is presentational component
  // that currently handles showing everything inside layout's main view area.
  const panel = isDataAvailable ? (
    <TransactionPanel
      className={detailsClassName}
      currentUser={currentUser}
      transactionId={transaction?.id}
      listing={listing}
      lineItemUnitType={lineItemUnitType}
      customer={customer}
      provider={provider}
      hasTransitions={txTransitions.length > 0}
      protectedData={transaction?.attributes?.protectedData}
      messages={messages}
      initialMessageFailed={initialMessageFailed}
      savePaymentMethodFailed={savePaymentMethodFailed}
      fetchMessagesError={fetchMessagesError}
      sendMessageInProgress={sendMessageInProgress}
      sendMessageError={sendMessageError}
      onSendMessage={onSendMessage}
      onOpenDisputeModal={onOpenDisputeModal}
      stateData={stateData}
      transactionRole={transactionRole}
      activityFeed={
        <ActivityFeed
          messages={messages}
          transaction={transaction}
          stateData={stateData}
          intl={intl}
          currentUser={currentUser}
          hasOlderMessages={
            totalMessagePages > oldestMessagePageFetched && !fetchMessagesInProgress
          }
          onOpenReviewModal={onOpenReviewModal}
          onShowOlderMessages={() => onShowMoreMessages(transaction.id)}
          fetchMessagesInProgress={fetchMessagesInProgress}
        />
      }
      {...orderBreakdownMaybe}
      orderPanel={
        <OrderPanel
          className={css.orderPanel}
          titleClassName={css.orderTitle}
          listing={listing}
          isOwnListing={isOwnSale}
          lineItemUnitType={lineItemUnitType}
          title={listingTitle}
          author={provider}
          onSubmit={handleSubmitOrderRequest}
          onManageDisableScrolling={onManageDisableScrolling}
          onFetchTimeSlots={onFetchTimeSlots}
          monthlyTimeSlots={monthlyTimeSlots}
          onFetchTransactionLineItems={onFetchTransactionLineItems}
          lineItems={lineItems}
          fetchLineItemsInProgress={fetchLineItemsInProgress}
          fetchLineItemsError={fetchLineItemsError}
        />
      }
    />
  ) : (
    loadingOrFailedFetching
  );

  return (
    <Page
      title={intl.formatMessage({ id: 'TransactionPage.title' }, { title: listingTitle })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.root}>{panel}</div>
          <ReviewModal
            id="ReviewOrderModal"
            isOpen={state.isReviewModalOpen}
            onCloseModal={() => setState(prevState => ({ ...prevState, isReviewModalOpen: false }))}
            onManageDisableScrolling={onManageDisableScrolling}
            onSubmitReview={onSubmitReview}
            revieweeName={otherUserDisplayName}
            reviewSent={state.reviewSubmitted}
            sendReviewInProgress={sendReviewInProgress}
            sendReviewError={sendReviewError}
          />
          {process?.transitions?.DISPUTE ? (
            <DisputeModal
              id="DisputeOrderModal"
              isOpen={state.isDisputeModalOpen}
              onCloseModal={() =>
                setState(prevState => ({ ...prevState, isDisputeModalOpen: false }))
              }
              onManageDisableScrolling={onManageDisableScrolling}
              onDisputeOrder={onDisputeOrder(
                transaction?.id,
                process.transitions.DISPUTE,
                onTransition
              )}
              disputeSubmitted={state.disputeSubmitted}
              disputeInProgress={transitionInProgress === process.transitions.DISPUTE}
              disputeError={transitionError}
            />
          ) : null}
        </LayoutWrapperMain>
        <LayoutWrapperFooter className={css.footer}>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

TransactionPageComponent.defaultProps = {
  currentUser: null,
  fetchTransactionError: null,
  transitionInProgress: null,
  transitionError: null,
  transaction: null,
  fetchMessagesError: null,
  initialMessageFailedToTransaction: null,
  savePaymentMethodFailed: false,
  sendMessageError: null,
  monthlyTimeSlots: null,
  fetchTimeSlotsError: null,
  lineItems: null,
  fetchLineItemsError: null,
};

TransactionPageComponent.propTypes = {
  params: shape({ id: string }).isRequired,
  transactionRole: oneOf([PROVIDER, CUSTOMER]).isRequired,
  currentUser: propTypes.currentUser,
  fetchTransactionError: propTypes.error,
  transitionInProgress: string,
  transitionError: propTypes.error,
  onTransition: func.isRequired,
  scrollingDisabled: bool.isRequired,
  transaction: propTypes.transaction,
  fetchMessagesError: propTypes.error,
  totalMessagePages: number.isRequired,
  oldestMessagePageFetched: number.isRequired,
  messages: arrayOf(propTypes.message).isRequired,
  initialMessageFailedToTransaction: propTypes.uuid,
  savePaymentMethodFailed: bool,
  sendMessageInProgress: bool.isRequired,
  sendMessageError: propTypes.error,
  onShowMoreMessages: func.isRequired,
  onSendMessage: func.isRequired,
  onFetchTimeSlots: func.isRequired,
  monthlyTimeSlots: object,
  // monthlyTimeSlots could be something like:
  // monthlyTimeSlots: {
  //   '2019-11': {
  //     timeSlots: [],
  //     fetchTimeSlotsInProgress: false,
  //     fetchTimeSlotsError: null,
  //   }
  // }
  callSetInitialValues: func.isRequired,
  onInitializeCardPaymentData: func.isRequired,
  onFetchTransactionLineItems: func.isRequired,

  // line items
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    fetchTransactionError,
    transitionInProgress,
    transitionError,
    transactionRef,
    fetchMessagesInProgress,
    fetchMessagesError,
    totalMessagePages,
    oldestMessagePageFetched,
    messages,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed,
    sendMessageInProgress,
    sendMessageError,
    sendReviewInProgress,
    sendReviewError,
    monthlyTimeSlots,
    processTransitions,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  } = state.TransactionPage;
  const { currentUser } = state.user;

  const transactions = getMarketplaceEntities(state, transactionRef ? [transactionRef] : []);
  const transaction = transactions.length > 0 ? transactions[0] : null;

  return {
    currentUser,
    fetchTransactionError,
    transitionInProgress,
    transitionError,
    scrollingDisabled: isScrollingDisabled(state),
    transaction,
    fetchMessagesInProgress,
    fetchMessagesError,
    totalMessagePages,
    oldestMessagePageFetched,
    messages,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed,
    sendMessageInProgress,
    sendMessageError,
    sendReviewInProgress,
    sendReviewError,
    monthlyTimeSlots,
    nextTransitions: processTransitions,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onTransition: (txId, transitionName, params) =>
      dispatch(makeTransition(txId, transitionName, params)),
    onShowMoreMessages: txId => dispatch(fetchMoreMessages(txId)),
    onSendMessage: (txId, message) => dispatch(sendMessage(txId, message)),
    onManageDisableScrolling: (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    onSendReview: (tx, transitionOptions, params) =>
      dispatch(sendReview(tx, transitionOptions, params)),
    callSetInitialValues: (setInitialValues, values) => dispatch(setInitialValues(values)),
    onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
    onFetchTransactionLineItems: (orderData, listingId, isOwnListing) =>
      dispatch(fetchTransactionLineItems(orderData, listingId, isOwnListing)),
    onFetchTimeSlots: (listingId, start, end, timeZone) =>
      dispatch(fetchTimeSlots(listingId, start, end, timeZone)),
  };
};

const TransactionPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(TransactionPageComponent);

export default TransactionPage;
