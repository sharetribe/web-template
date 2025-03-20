import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import {
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  LISTING_UNIT_TYPES,
  LINE_ITEM_HOUR,
  LINE_ITEM_ITEM,
  propTypes,
} from '../../util/types';
import { timestampToDate } from '../../util/dates';
import { createSlug } from '../../util/urlHelpers';
import {
  INQUIRY_PROCESS_NAME,
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  resolveLatestProcessName,
  getProcess,
  isBookingProcess,
} from '../../transactions/transaction';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

import {
  H4,
  IconSpinner,
  NamedLink,
  NamedRedirect,
  Page,
  UserDisplayName,
  OrderBreakdown,
  OrderPanel,
  LayoutSingleColumn,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

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
import { hasPermissionToViewData } from '../../util/userHelpers.js';

// Submit dispute and close the review modal
const onDisputeOrder = (
  currentTransactionId,
  transitionName,
  onTransition,
  setDisputeSubmitted
) => values => {
  const { disputeReason } = values;
  const params = disputeReason ? { protectedData: { disputeReason } } : {};
  onTransition(currentTransactionId, transitionName, params)
    .then(r => {
      return setDisputeSubmitted(true);
    })
    .catch(e => {
      // Do nothing.
    });
};

/**
 * TransactionPage handles data loading for Sale and Order views to transaction pages in Inbox.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.params - The path params
 * @param {string} props.params.id - The transaction id
 * @param {PROVIDER|CUSTOMER} props.transactionRole - The transaction role
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {Object} props.history - The history object
 * @param {Function} props.history.push - The push function
 * @param {Object} props.location - The location object
 * @param {string} props.location.search - The search string
 * @param {propTypes.transaction} props.transaction - The transaction
 * @param {propTypes.error} props.fetchTransactionError - The fetch transaction error
 * @param {Array<propTypes.message>} props.messages - The messages
 * @param {boolean} props.fetchMessagesInProgress - Whether the fetch messages is in progress
 * @param {propTypes.error} props.fetchMessagesError - The fetch messages error
 * @param {number} props.totalMessagePages - The total message pages
 * @param {number} props.oldestMessagePageFetched - The oldest message page fetched
 * @param {propTypes.uuid} props.initialMessageFailedToTransaction - The initial message failed to be send to transaction
 * @param {boolean} props.sendMessageInProgress - Whether the send message is in progress
 * @param {propTypes.error} props.sendMessageError - The send message error
 * @param {boolean} props.savePaymentMethodFailed - Whether the payment method is saved
 * @param {string} props.transitionInProgress - The transition in progress
 * @param {propTypes.error} props.transitionError - The transition error
 * @param {Object<string, Object>} props.monthlyTimeSlots - The monthly time slots: { '2019-11': { timeSlots: [], fetchTimeSlotsInProgress: false, fetchTimeSlotsError: null } }
 * @param {propTypes.error} props.fetchTimeSlotsError - The fetch time slots error
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items
 * @param {propTypes.error} props.fetchLineItemsError - The fetch line items error
 * @param {boolean} props.fetchLineItemsInProgress - Whether the fetch line items is in progress
 * @param {boolean} props.sendReviewInProgress - Whether the send review is in progress
 * @param {boolean} props.sendReviewError - The send review error
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {Function} props.callSetInitialValues - The call set initial values function
 * @param {Function} props.onInitializeCardPaymentData - The on initialize card payment data function
 * @param {Function} props.onFetchTransactionLineItems - The on fetch transaction line items function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onSendMessage - The on send message function
 * @param {Function} props.onSendReview - The on send review function
 * @param {Function} props.onShowMoreMessages - The on show more messages function
 * @param {Function} props.onTransition - The on transition function
 * @param {Function} props.onFetchTimeSlots - The on fetch time slots function
 * @param {Array<propTypes.transition>} props.nextTransitions - The next transitions
 * @returns {JSX.Element}
 */
export const TransactionPageComponent = props => {
  const [isDisputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const {
    currentUser,
    initialMessageFailedToTransaction,
    savePaymentMethodFailed = false,
    fetchMessagesError,
    fetchMessagesInProgress,
    totalMessagePages,
    oldestMessagePageFetched,
    fetchTransactionError,
    history,
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

  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  let process = null;
  try {
    process = processName ? getProcess(processName) : null;
  } catch (error) {
    // Process was not recognized!
  }

  const isTxOnPaymentPending = tx => {
    return process ? process.getState(tx) === process.states.PENDING_PAYMENT : null;
  };

  const redirectToCheckoutPageWithInitialValues = (initialValues, currentListing) => {
    // Customize checkout page state with current listing and selected bookingDates
    const { setInitialValues } = findRouteByRouteName('CheckoutPage', routeConfiguration);
    callSetInitialValues(setInitialValues, initialValues);

    // Clear previous Stripe errors from store if there is any
    onInitializeCardPaymentData();

    // Redirect to CheckoutPage
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routeConfiguration,
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
    // Note: we don't need to pass orderData since those are already saved to transaction.
    //       However, we could do that by extracting the values from transaction entity.
    //
    // const bookingMaybe = booking?.id ? { bookingDates: { bookingStart: booking?.attributes?.start, bookingEnd: booking?.attributes?.end } } : {};
    // const purchaseLineItem = transaction.attributes.lineItems.find(item => item.code === LINE_ITEM_ITEM);
    // const quantity = purchaseLineItem?.quantity?.toNumber();
    // const quantityMaybe = quantity ? { quantity } : {};

    const initialValues = {
      listing,
      // Transaction with payment pending should be passed to CheckoutPage
      transaction,
      // Original orderData content is not available,
      // but it is already saved since tx is in state: payment-pending.
      orderData: {},
    };

    redirectToCheckoutPageWithInitialValues(initialValues, listing);
  }

  // Customer can create a booking, if the tx is in "inquiry" state.
  const handleSubmitOrderRequest = values => {
    const {
      bookingDates,
      bookingStartTime,
      bookingEndTime,
      quantity: quantityRaw,
      seats: seatsRaw,
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

    const quantity = Number.parseInt(quantityRaw, 10);
    const quantityMaybe = Number.isInteger(quantity) ? { quantity } : {};
    const seats = Number.parseInt(seatsRaw, 10);
    const seatsMaybe = Number.isInteger(seats) ? { seats } : {};
    const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};

    const initialValues = {
      listing,
      // inquired transaction should be passed to CheckoutPage
      transaction,
      orderData: {
        ...bookingMaybe,
        ...quantityMaybe,
        ...seatsMaybe,
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
    setReviewModalOpen(true);
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

    onSendReview(transaction, transitionOptions, params, config)
      .then(r => {
        setReviewModalOpen(false);
        setReviewSubmitted(true);
      })
      .catch(e => {
        // Do nothing.
      });
  };

  // Open dispute modal
  const onOpenDisputeModal = () => {
    setDisputeModalOpen(true);
  };

  const deletedListingTitle = intl.formatMessage({
    id: 'TransactionPage.deletedListing',
  });
  const listingDeleted = listing?.attributes?.deleted;
  const listingTitle = listingDeleted ? deletedListingTitle : listing?.attributes?.title;

  // Redirect users with someone else's direct link to their own inbox/sales or inbox/orders page.
  const isDataAvailable =
    process &&
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
  ) : transaction && !process ? (
    <div className={css.error}>
      <FormattedMessage id="TransactionPage.unknownTransactionProcess" />
    </div>
  ) : (
    <div className={css.loading}>
      <FormattedMessage id={`${loadingMessage}`} />
      <IconSpinner />
    </div>
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

  const formatLineItemUnitType = (transaction, listing) => {
    // unitType should always be saved to transaction's protected data
    const unitTypeInProtectedData = transaction?.attributes?.protectedData?.unitType;
    // If unitType is not found (old or mutated data), we check listing's publicData
    // Note: this might have changed over time
    const unitTypeInListingPublicData = listing?.attributes?.publicData?.unitType;
    return `line-item/${unitTypeInProtectedData || unitTypeInListingPublicData}`;
  };

  const lineItemUnitType = unitLineItem
    ? unitLineItem.code
    : isDataAvailable
    ? formatLineItemUnitType(transaction, listing)
    : null;

  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const dateType = lineItemUnitType === LINE_ITEM_HOUR ? DATE_TYPE_DATETIME : DATE_TYPE_DATE;

  const hasViewingRights = currentUser && hasPermissionToViewData(currentUser);

  const txBookingMaybe = booking?.id ? { booking, dateType, timeZone } : {};
  const orderBreakdownMaybe = hasLineItems
    ? {
        orderBreakdown: (
          <OrderBreakdown
            className={css.breakdown}
            userRole={transactionRole}
            transaction={transaction}
            {...txBookingMaybe}
            currency={config.currency}
            marketplaceName={config.marketplaceName}
          />
        ),
      }
    : {};

  // The location of the booking can be shown if fuzzy location
  const showBookingLocation =
    isBookingProcess(stateData.processName) &&
    process?.hasPassedState(process?.states?.ACCEPTED, transaction);

  // TransactionPanel is presentational component
  // that currently handles showing everything inside layout's main view area.
  const panel = isDataAvailable ? (
    <TransactionPanel
      className={detailsClassName}
      currentUser={currentUser}
      transactionId={transaction?.id}
      listing={listing}
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
      showBookingLocation={showBookingLocation}
      hasViewingRights={hasViewingRights}
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
          onShowOlderMessages={() => onShowMoreMessages(transaction.id, config)}
          fetchMessagesInProgress={fetchMessagesInProgress}
        />
      }
      isInquiryProcess={processName === INQUIRY_PROCESS_NAME}
      config={config}
      {...orderBreakdownMaybe}
      orderPanel={
        <OrderPanel
          className={css.orderPanel}
          titleClassName={css.orderTitle}
          listing={listing}
          isOwnListing={isOwnSale}
          lineItemUnitType={lineItemUnitType}
          title={listingTitle}
          titleDesktop={
            <H4 as="h2" className={css.orderPanelTitle}>
              {listingDeleted ? (
                listingTitle
              ) : (
                <NamedLink
                  name="ListingPage"
                  params={{ id: listing.id?.uuid, slug: createSlug(listingTitle) }}
                >
                  {listingTitle}
                </NamedLink>
              )}
            </H4>
          }
          author={provider}
          onSubmit={handleSubmitOrderRequest}
          onManageDisableScrolling={onManageDisableScrolling}
          onFetchTimeSlots={onFetchTimeSlots}
          monthlyTimeSlots={monthlyTimeSlots}
          onFetchTransactionLineItems={onFetchTransactionLineItems}
          lineItems={lineItems}
          fetchLineItemsInProgress={fetchLineItemsInProgress}
          fetchLineItemsError={fetchLineItemsError}
          validListingTypes={config.listing.listingTypes}
          marketplaceCurrency={config.currency}
          dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
          marketplaceName={config.marketplaceName}
        />
      }
    />
  ) : (
    loadingOrFailedFetching
  );

  return (
    <Page
      title={intl.formatMessage({ id: 'TransactionPage.schemaTitle' }, { title: listingTitle })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>{panel}</div>
        <ReviewModal
          id="ReviewOrderModal"
          isOpen={isReviewModalOpen}
          onCloseModal={() => setReviewModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          onSubmitReview={onSubmitReview}
          revieweeName={otherUserDisplayName}
          reviewSent={reviewSubmitted}
          sendReviewInProgress={sendReviewInProgress}
          sendReviewError={sendReviewError}
          marketplaceName={config.marketplaceName}
        />
        {process?.transitions?.DISPUTE ? (
          <DisputeModal
            id="DisputeOrderModal"
            isOpen={isDisputeModalOpen}
            onCloseModal={() => setDisputeModalOpen(false)}
            onManageDisableScrolling={onManageDisableScrolling}
            onDisputeOrder={onDisputeOrder(
              transaction?.id,
              process.transitions.DISPUTE,
              onTransition,
              setDisputeSubmitted
            )}
            disputeSubmitted={disputeSubmitted}
            disputeInProgress={transitionInProgress === process.transitions.DISPUTE}
            disputeError={transitionError}
          />
        ) : null}
      </LayoutSingleColumn>
    </Page>
  );
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
    onShowMoreMessages: (txId, config) => dispatch(fetchMoreMessages(txId, config)),
    onSendMessage: (txId, message, config) => dispatch(sendMessage(txId, message, config)),
    onManageDisableScrolling: (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    onSendReview: (tx, transitionOptions, params, config) =>
      dispatch(sendReview(tx, transitionOptions, params, config)),
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
  )
)(TransactionPageComponent);

export default TransactionPage;
