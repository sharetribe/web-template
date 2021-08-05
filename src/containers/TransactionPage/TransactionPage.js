import React, { useState } from 'react';
import { array, arrayOf, bool, func, number, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import { propTypes } from '../../util/types';
import { ensureListing, ensureTransaction } from '../../util/data';
import { timeOfDayFromTimeZoneToLocal } from '../../util/dates';
import { createSlug } from '../../util/urlHelpers';
import { txIsPaymentPending } from '../../util/transaction';
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
} from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import DisputeModal from './DisputeModal/DisputeModal';
import ReviewModal from './ReviewModal/ReviewModal';
import TransactionPanel from './TransactionPanel/TransactionPanel';

import {
  dispute,
  markReceived,
  markReceivedFromPurchased,
  markDelivered,
  sendMessage,
  sendReview,
  fetchMoreMessages,
  fetchTransactionLineItems,
} from './TransactionPage.duck';
import css from './TransactionPage.module.css';

const PROVIDER = 'provider';
const CUSTOMER = 'customer';

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
    disputeInProgress,
    disputeError,
    onDispute,
    markReceivedInProgress,
    markReceivedError,
    onMarkReceived,
    markReceivedFromPurchasedInProgress,
    markReceivedFromPurchasedError,
    onMarkReceivedFromPurchased,
    markDeliveredInProgress,
    markDeliveredError,
    onMarkDelivered,
    timeSlots,
    fetchTimeSlotsError,
    processTransitions,
    callSetInitialValues,
    onInitializeCardPaymentData,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  } = props;

  const currentTransaction = ensureTransaction(transaction);
  const currentListing = ensureListing(currentTransaction.listing);
  const isProviderRole = transactionRole === PROVIDER;
  const isCustomerRole = transactionRole === CUSTOMER;

  const redirectToCheckoutPageWithInitialValues = (initialValues, listing) => {
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
    txIsPaymentPending(currentTransaction) &&
    isCustomerRole &&
    currentTransaction.attributes.lineItems
  ) {
    const currentBooking = ensureListing(currentTransaction.booking);
    const bookingDatesMaybe = currentBooking.id
      ? {
          bookingDates: {
            // In day-based booking process, booking start and end come in server's time zone.
            bookingStart: timeOfDayFromTimeZoneToLocal(
              currentBooking.attributes.start,
              apiTimeZone
            ),
            bookingEnd: timeOfDayFromTimeZoneToLocal(currentBooking.attributes.end, apiTimeZone),
          },
        }
      : {};

    const apiTimeZone = 'Etc/UTC';
    const initialValues = {
      listing: currentListing,
      // Transaction with payment pending should be passed to CheckoutPage
      transaction: currentTransaction,
      // Original orderData content is not available,
      // but it is already used since booking is created.
      // (E.g. quantity is used when booking is created.)
      orderData: {
        ...bookingDatesMaybe,
      },
    };

    redirectToCheckoutPageWithInitialValues(initialValues, currentListing);
  }

  // Customer can create a booking, if the tx is in "enquiry" state.
  const handleSubmitOrderRequest = values => {
    const { bookingDates, ...otherOrderData } = values;
    const bookingDatesMaybe = bookingDates
      ? {
          bookingDates: {
            bookingStart: bookingDates.startDate,
            bookingEnd: bookingDates.endDate,
          },
        }
      : {};

    const initialValues = {
      listing: currentListing,
      // enquired transaction should be passed to CheckoutPage
      transaction: currentTransaction,
      orderData: {
        ...bookingDatesMaybe,
        ...otherOrderData,
      },
      confirmPaymentError: null,
    };

    redirectToCheckoutPageWithInitialValues(initialValues, currentListing);
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
    onSendReview(transactionRole, currentTransaction, rating, reviewContent)
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
  // Submit dispute and close the review modal
  const onDisputeOrder = values => {
    const { disputeReason } = values;
    onDispute(currentTransaction.id, disputeReason)
      .then(r => {
        return setState(prevState => ({ ...prevState, disputeSubmitted: true }));
      })
      .catch(e => {
        // Do nothing.
      });
  };

  const deletedListingTitle = intl.formatMessage({
    id: 'TransactionPage.deletedListing',
  });
  const listingTitle = currentListing.attributes.deleted
    ? deletedListingTitle
    : currentListing.attributes.title;

  // Redirect users with someone else's direct link to their own inbox/sales or inbox/orders page.
  const isDataAvailable =
    currentUser &&
    currentTransaction.id &&
    currentTransaction.id.uuid === params.id &&
    currentTransaction.attributes.lineItems &&
    currentTransaction.customer &&
    currentTransaction.provider &&
    !fetchTransactionError;

  const isOwnSale =
    isDataAvailable &&
    isProviderRole &&
    currentUser.id.uuid === currentTransaction.provider.id.uuid;
  const isOwnOrder =
    isDataAvailable &&
    isCustomerRole &&
    currentUser.id.uuid === currentTransaction.customer.id.uuid;

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
    currentTransaction.id &&
    initialMessageFailedToTransaction.uuid === currentTransaction.id.uuid
  );

  const otherUserDisplayName = isOwnOrder ? (
    <UserDisplayName user={currentTransaction.provider} intl={intl} />
  ) : (
    <UserDisplayName user={currentTransaction.customer} intl={intl} />
  );

  // TransactionPanel is presentational component
  // that currently handles showing everything inside layout's main view area.
  const panel = isDataAvailable ? (
    <TransactionPanel
      className={detailsClassName}
      currentUser={currentUser}
      transaction={currentTransaction}
      fetchMessagesInProgress={fetchMessagesInProgress}
      totalMessagePages={totalMessagePages}
      oldestMessagePageFetched={oldestMessagePageFetched}
      messages={messages}
      initialMessageFailed={initialMessageFailed}
      savePaymentMethodFailed={savePaymentMethodFailed}
      fetchMessagesError={fetchMessagesError}
      sendMessageInProgress={sendMessageInProgress}
      sendMessageError={sendMessageError}
      onManageDisableScrolling={onManageDisableScrolling}
      onShowMoreMessages={onShowMoreMessages}
      onSendMessage={onSendMessage}
      onOpenReviewModal={onOpenReviewModal}
      transactionRole={transactionRole}
      markReceivedProps={{
        inProgress: markReceivedInProgress,
        error: markReceivedError,
        onTransition: () => onMarkReceived(currentTransaction.id),
        buttonText: intl.formatMessage({
          id: 'TransactionPage.markReceived.actionButton',
        }),
        errorText: intl.formatMessage({
          id: 'TransactionPage.markReceived.actionError',
        }),
      }}
      markReceivedFromPurchasedProps={{
        inProgress: markReceivedFromPurchasedInProgress,
        error: markReceivedFromPurchasedError,
        onTransition: () => onMarkReceivedFromPurchased(currentTransaction.id),
        buttonText: intl.formatMessage({
          id: 'TransactionPage.markReceivedFromPurchased.actionButton',
        }),
        errorText: intl.formatMessage({
          id: 'TransactionPage.markReceivedFromPurchased.actionError',
        }),
      }}
      markDeliveredProps={{
        inProgress: markDeliveredInProgress,
        error: markDeliveredError,
        onTransition: () => onMarkDelivered(currentTransaction.id),
        buttonText: intl.formatMessage({ id: 'TransactionPage.markDelivered.actionButton' }),
        errorText: intl.formatMessage({ id: 'TransactionPage.markDelivered.actionError' }),
      }}
      leaveReviewProps={{
        inProgress: sendReviewInProgress,
        error: sendReviewError,
        onTransition: onOpenReviewModal,
        buttonText: intl.formatMessage({ id: 'TransactionPage.leaveReview.actionButton' }),
        errorText: intl.formatMessage({ id: 'TransactionPage.leaveReview.actionError' }),
      }}
      nextTransitions={processTransitions}
      onSubmitOrderRequest={handleSubmitOrderRequest}
      timeSlots={timeSlots}
      fetchTimeSlotsError={fetchTimeSlotsError}
      onFetchTransactionLineItems={onFetchTransactionLineItems}
      lineItems={lineItems}
      fetchLineItemsInProgress={fetchLineItemsInProgress}
      fetchLineItemsError={fetchLineItemsError}
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
          <DisputeModal
            id="DisputeOrderModal"
            isOpen={state.isDisputeModalOpen}
            onCloseModal={() =>
              setState(prevState => ({ ...prevState, isDisputeModalOpen: false }))
            }
            onManageDisableScrolling={onManageDisableScrolling}
            onDisputeOrder={onDisputeOrder}
            disputeSubmitted={state.disputeSubmitted}
            disputeInProgress={disputeInProgress}
            disputeError={disputeError}
          />
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
  disputeError: null,
  markDeliveredError: null,
  markReceivedError: null,
  markReceivedFromPurchasedError: null,
  transaction: null,
  fetchMessagesError: null,
  initialMessageFailedToTransaction: null,
  savePaymentMethodFailed: false,
  sendMessageError: null,
  timeSlots: null,
  fetchTimeSlotsError: null,
  lineItems: null,
  fetchLineItemsError: null,
};

TransactionPageComponent.propTypes = {
  params: shape({ id: string }).isRequired,
  transactionRole: oneOf([PROVIDER, CUSTOMER]).isRequired,
  currentUser: propTypes.currentUser,
  fetchTransactionError: propTypes.error,
  markReceivedInProgress: bool.isRequired,
  markReceivedError: propTypes.error,
  onMarkReceived: func.isRequired,
  markReceivedFromPurchasedInProgress: bool.isRequired,
  markReceivedFromPurchasedError: propTypes.error,
  onMarkReceivedFromPurchased: func.isRequired,
  markDeliveredInProgress: bool.isRequired,
  markDeliveredError: propTypes.error,
  onMarkDelivered: func.isRequired,
  disputeInProgress: bool.isRequired,
  disputeError: propTypes.error,
  onDispute: func.isRequired,
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
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
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
    disputeInProgress,
    disputeError,
    markReceivedInProgress,
    markReceivedError,
    markReceivedFromPurchasedInProgress,
    markReceivedFromPurchasedError,
    markDeliveredInProgress,
    markDeliveredError,
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
    timeSlots,
    fetchTimeSlotsError,
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
    disputeInProgress,
    disputeError,
    markReceivedInProgress,
    markReceivedError,
    markReceivedFromPurchasedInProgress,
    markReceivedFromPurchasedError,
    markDeliveredInProgress,
    markDeliveredError,
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
    timeSlots,
    fetchTimeSlotsError,
    processTransitions,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onDispute: (transactionId, disputeReason) => dispatch(dispute(transactionId, disputeReason)),
    onMarkReceived: transactionId => dispatch(markReceived(transactionId)),
    onMarkReceivedFromPurchased: transactionId =>
      dispatch(markReceivedFromPurchased(transactionId)),
    onMarkDelivered: transactionId => dispatch(markDelivered(transactionId)),
    onShowMoreMessages: txId => dispatch(fetchMoreMessages(txId)),
    onSendMessage: (txId, message) => dispatch(sendMessage(txId, message)),
    onManageDisableScrolling: (componentId, disableScrolling) =>
      dispatch(manageDisableScrolling(componentId, disableScrolling)),
    onSendReview: (role, tx, reviewRating, reviewContent) =>
      dispatch(sendReview(role, tx, reviewRating, reviewContent)),
    callSetInitialValues: (setInitialValues, values) => dispatch(setInitialValues(values)),
    onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
    onFetchTransactionLineItems: (orderData, listingId, isOwnListing) =>
      dispatch(fetchTransactionLineItems(orderData, listingId, isOwnListing)),
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
