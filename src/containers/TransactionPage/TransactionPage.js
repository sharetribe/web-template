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
import { getProcess } from '../../util/transaction';
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
  makeTransition,
  sendMessage,
  sendReview,
  fetchMoreMessages,
  fetchTransactionLineItems,
} from './TransactionPage.duck';
import css from './TransactionPage.module.css';

const PROVIDER = 'provider';
const CUSTOMER = 'customer';

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

// Transitions are following process.edn format: "transition/my-transtion-name"
// This extracts the 'my-transtion-name' string if namespace exists
const getTransitionKey = transitionName => {
  const [nameSpace, transitionKey] = transitionName.split('/');
  return transitionKey || transitionName;
};

// Find hyphen followed by any character.
// Then capitalize it and replace the hyphen+character with the capitalised character.
const camelize = s => s.replace(/-./g, x => x[1].toUpperCase());

// Action button prop for the TransactionPanel
const getActionButtonPropsMaybe = (params, onlyForRole = 'both') => {
  const {
    processName,
    transitionName,
    inProgress,
    transitionError,
    onAction,
    transactionRole,
    actionButtonTranslationId,
    actionButtonTranslationErrorId,
    intl,
  } = params;
  const transitionKey = getTransitionKey(transitionName);
  const transitionPropsKey = `${camelize(transitionKey)}Props`;

  const actionButtonTrId =
    actionButtonTranslationId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionButton`;
  const actionButtonTrErrorId =
    actionButtonTranslationErrorId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionError`;

  return onlyForRole === 'both' || onlyForRole === transactionRole
    ? {
        [transitionPropsKey]: {
          inProgress,
          error: transitionError,
          onAction,
          buttonText: intl.formatMessage({ id: actionButtonTrId }),
          errorText: intl.formatMessage({ id: actionButtonTrErrorId }),
        },
      }
    : {};
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

  const processName = currentTransaction?.attributes?.processName;
  const process = processName ? getProcess(processName) : null;

  const isTxOnPaymentPending = tx => {
    return process ? process.getState(tx) === process.states.PAYMENT_PENDING : null;
  };

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
    currentTransaction?.id &&
    isTxOnPaymentPending(currentTransaction) &&
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
    const { bookingDates, quantity: quantityRaw, ...otherOrderData } = values;
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
        quantity: Number.parseInt(quantityRaw, 10),
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

  const isShippable =
    isDataAvailable && currentTransaction.attributes?.protectedData?.deliveryMethod === 'shipping';

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

  const commonActionButtonParams = { processName, transactionRole, intl };
  // Action buttons that make transition directly without modal popup.
  const plainActionButtonProps = (transitionName, forRole, extra = {}) => {
    return getActionButtonPropsMaybe(
      {
        ...commonActionButtonParams,
        transitionName,
        inProgress: transitionInProgress === transitionName,
        transitionError,
        onAction: () => onTransition(currentTransaction.id, transitionName, {}),
        ...extra,
      },
      forRole
    );
  };

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
      onOpenDisputeModal={onOpenDisputeModal}
      transactionRole={transactionRole}
      {...plainActionButtonProps(process.transitions.MARK_RECEIVED, CUSTOMER)}
      {...plainActionButtonProps(process.transitions.MARK_RECEIVED_FROM_PURCHASED, CUSTOMER)}
      {...plainActionButtonProps(process.transitions.MARK_DELIVERED, PROVIDER, {
        actionButtonTranslationId: isShippable
          ? `TransactionPage.${processName}.provider.transition-mark-delivered.actionButton`
          : `TransactionPage.${processName}.provider.transition-mark-delivered.actionButtonShipped`,
      })}
      {...getActionButtonPropsMaybe({
        ...commonActionButtonParams,
        transitionName: 'leaveReview',
        inProgress: sendReviewInProgress,
        transitionError: sendReviewError,
        onAction: onOpenReviewModal,
        actionButtonTranslationId: 'TransactionPage.leaveReview.actionButton',
        actionButtonTranslationErrorId: 'TransactionPage.leaveReview.actionError',
      })}
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
          {process && process.transitions.DISPUTE ? (
            <DisputeModal
              id="DisputeOrderModal"
              isOpen={state.isDisputeModalOpen}
              onCloseModal={() =>
                setState(prevState => ({ ...prevState, isDisputeModalOpen: false }))
              }
              onManageDisableScrolling={onManageDisableScrolling}
              onDisputeOrder={onDisputeOrder(
                currentTransaction?.id,
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
    onTransition: (transactionId, transitionName, params) =>
      dispatch(makeTransition(transactionId, transitionName, params)),
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
