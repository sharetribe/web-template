import React, { Component } from 'react';
import { array, arrayOf, bool, func, number, shape, string } from 'prop-types';
import classNames from 'classnames';

import config from '../../../config';
import { getProcess } from '../../../util/transaction';
import { states as productProcessStates } from '../../../util/transactionProcessProduct';
import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY, propTypes } from '../../../util/types';
import {
  ensureListing,
  ensureTransaction,
  ensureUser,
  userDisplayNameAsString,
} from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { formatMoney } from '../../../util/currency';
import { AvatarLarge, OrderPanel, NamedLink, UserDisplayName } from '../../../components';

import SendMessageForm from '../SendMessageForm/SendMessageForm';

// These are internal components that make this file more readable.
import BreakdownMaybe from './BreakdownMaybe';
import DetailCardHeadingsMaybe from './DetailCardHeadingsMaybe';
import DetailCardImage from './DetailCardImage';
import DeliveryInfoMaybe from './DeliveryInfoMaybe';
import FeedSection from './FeedSection';
import ActionButtonsMaybe from './ActionButtonsMaybe';
import DiminishedActionButtonMaybe from './DiminishedActionButtonMaybe';
import PanelHeading, {
  HEADING_ENQUIRED,
  HEADING_PAYMENT_PENDING,
  HEADING_PAYMENT_EXPIRED,
  HEADING_CANCELED,
  HEADING_PURCHASED,
  HEADING_DELIVERED,
  HEADING_DISPUTED,
  HEADING_RECEIVED,
} from './PanelHeading';

import css from './TransactionPanel.module.css';

const productHeadingStates = {
  // [productProcessStates.INITIAL]: HEADING_ENQUIRED,
  [productProcessStates.ENQUIRY]: HEADING_ENQUIRED,
  [productProcessStates.PENDING_PAYMENT]: HEADING_PAYMENT_PENDING,
  [productProcessStates.PAYMENT_EXPIRED]: HEADING_PAYMENT_EXPIRED,
  [productProcessStates.PURCHASED]: HEADING_PURCHASED,
  [productProcessStates.DELIVERED]: HEADING_DELIVERED,
  [productProcessStates.RECEIVED]: HEADING_RECEIVED,
  [productProcessStates.DISPUTED]: HEADING_DISPUTED,
  [productProcessStates.CANCELED]: HEADING_CANCELED,
  [productProcessStates.COMPLETED]: HEADING_RECEIVED,
  [productProcessStates.REVIEWED]: HEADING_RECEIVED,
  [productProcessStates.REVIEWED_BY_CUSTOMER]: HEADING_RECEIVED,
  [productProcessStates.REVIEWED_BY_PROVIDER]: HEADING_RECEIVED,
};

// Helper function to get display names for different roles
const displayNames = (currentUser, currentProvider, currentCustomer, intl) => {
  const authorDisplayName = <UserDisplayName user={currentProvider} intl={intl} />;
  const customerDisplayName = <UserDisplayName user={currentCustomer} intl={intl} />;

  let otherUserDisplayName = '';
  let otherUserDisplayNameString = '';
  const currentUserIsCustomer =
    currentUser.id && currentCustomer.id && currentUser.id.uuid === currentCustomer.id.uuid;
  const currentUserIsProvider =
    currentUser.id && currentProvider.id && currentUser.id.uuid === currentProvider.id.uuid;

  if (currentUserIsCustomer) {
    otherUserDisplayName = authorDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(currentProvider, '');
  } else if (currentUserIsProvider) {
    otherUserDisplayName = customerDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(currentCustomer, '');
  }

  return {
    authorDisplayName,
    customerDisplayName,
    otherUserDisplayName,
    otherUserDisplayNameString,
  };
};

export class TransactionPanelComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sendMessageFormFocused: false,
    };
    this.isMobSaf = false;
    this.sendMessageFormName = 'TransactionPanel.SendMessageForm';

    this.onSendMessageFormFocus = this.onSendMessageFormFocus.bind(this);
    this.onSendMessageFormBlur = this.onSendMessageFormBlur.bind(this);
    this.onMessageSubmit = this.onMessageSubmit.bind(this);
    this.scrollToMessage = this.scrollToMessage.bind(this);
  }

  componentDidMount() {
    this.isMobSaf = isMobileSafari();
  }

  onSendMessageFormFocus() {
    this.setState({ sendMessageFormFocused: true });
    if (this.isMobSaf) {
      // Scroll to bottom
      window.scroll({ top: document.body.scrollHeight, left: 0, behavior: 'smooth' });
    }
  }

  onSendMessageFormBlur() {
    this.setState({ sendMessageFormFocused: false });
  }

  onMessageSubmit(values, form) {
    const message = values.message ? values.message.trim() : null;
    const { transaction, onSendMessage } = this.props;
    const ensuredTransaction = ensureTransaction(transaction);

    if (!message) {
      return;
    }
    onSendMessage(ensuredTransaction.id, message)
      .then(messageId => {
        form.reset();
        this.scrollToMessage(messageId);
      })
      .catch(e => {
        // Ignore, Redux handles the error
      });
  }

  scrollToMessage(messageId) {
    const selector = `#msg-${messageId.uuid}`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }

  render() {
    const {
      rootClassName,
      className,
      currentUser,
      transaction,
      totalMessagePages,
      oldestMessagePageFetched,
      messages,
      initialMessageFailed,
      savePaymentMethodFailed,
      fetchMessagesInProgress,
      fetchMessagesError,
      sendMessageInProgress,
      sendMessageError,
      onManageDisableScrolling,
      onOpenDisputeModal,
      onOpenReviewModal,
      onShowMoreMessages,
      transactionRole,
      intl,
      markReceivedProps,
      markReceivedFromPurchasedProps,
      markDeliveredProps,
      leaveReviewProps,
      onSubmitOrderRequest,
      timeSlots,
      fetchTimeSlotsError,
      nextTransitions,
      onFetchTransactionLineItems,
      lineItems,
      fetchLineItemsInProgress,
      fetchLineItemsError,
    } = this.props;

    const currentTransaction = ensureTransaction(transaction);
    const currentListing = ensureListing(currentTransaction.listing);
    const currentProvider = ensureUser(currentTransaction.provider);
    const currentCustomer = ensureUser(currentTransaction.customer);
    const isCustomer = transactionRole === 'customer';
    const isProvider = transactionRole === 'provider';

    const listingLoaded = !!currentListing.id;
    const listingDeleted = listingLoaded && currentListing.attributes.deleted;
    const iscustomerLoaded = !!currentCustomer.id;
    const isCustomerBanned = iscustomerLoaded && currentCustomer.attributes.banned;
    const isCustomerDeleted = iscustomerLoaded && currentCustomer.attributes.deleted;
    const isProviderLoaded = !!currentProvider.id;
    const isProviderBanned = isProviderLoaded && currentProvider.attributes.banned;
    const isProviderDeleted = isProviderLoaded && currentProvider.attributes.deleted;

    const stateDataFn = tx => {
      const processName = tx?.attributes?.processName;
      const process = getProcess(processName);
      const REQUEST_PAYMENT_AFTER_ENQUIRY = process.transitions.REQUEST_PAYMENT_AFTER_ENQUIRY;
      const state = process.getState(tx);
      const txHasBeenReceived = tx =>
        process ? process.hasPassedState(process.states.RECEIVED, tx) : false;

      const productHeadingState = productHeadingStates[state];
      const headingState = productHeadingState || 'unknown';

      if (state === process.states.ENQUIRY) {
        const transitions = Array.isArray(nextTransitions)
          ? nextTransitions.map(transition => {
              return transition.attributes.name;
            })
          : [];
        const hasCorrectNextTransition =
          transitions.length > 0 && transitions.includes(REQUEST_PAYMENT_AFTER_ENQUIRY);
        return {
          headingState,
          processName,
          processState: state,
          showOrderPanel: isCustomer && !isProviderBanned && hasCorrectNextTransition,
        };
      } else if (state === process.states.PAYMENT_PENDING) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
        };
      } else if (state === process.states.PAYMENT_EXPIRED) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
        };
      } else if (state === process.states.PURCHASED) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
          showActionButtons: true,
          primaryButtonProps: isCustomer ? markReceivedFromPurchasedProps : markDeliveredProps,
        };
      } else if (state === process.states.CANCELED) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
        };
      } else if (state === process.states.DELIVERED) {
        const primaryButtonPropsMaybe = isCustomer ? { primaryButtonProps: markReceivedProps } : {};
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
          showActionButtons: isCustomer,
          ...primaryButtonPropsMaybe,
          showDispute: isCustomer,
        };
      } else if (state === process.states.DISPUTED) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
        };
      } else if (
        state === process.states.RECEIVED ||
        state === process.states.COMPLETED ||
        (isCustomer && state === process.states.REVIEWED_BY_PROVIDER) ||
        (isProvider && state === process.states.REVIEWED_BY_CUSTOMER)
      ) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
          showActionButtons: true,
          primaryButtonProps: leaveReviewProps,
        };
      } else if (txHasBeenReceived(tx)) {
        return {
          headingState,
          processName,
          processState: state,
          showDetailCardHeadings: isCustomer,
        };
      } else {
        return {
          headingState,
          processName,
          processState: state,
        };
      }
    };
    const stateData = stateDataFn(currentTransaction);

    const deletedListingTitle = intl.formatMessage({
      id: 'TransactionPanel.deletedListingTitle',
    });

    const { authorDisplayName, customerDisplayName, otherUserDisplayNameString } = displayNames(
      currentUser,
      currentProvider,
      currentCustomer,
      intl
    );

    const { publicData, geolocation } = currentListing.attributes;
    const location = publicData && publicData.location ? publicData.location : {};
    const listingTitle = currentListing.attributes.deleted
      ? deletedListingTitle
      : currentListing.attributes.title;

    const unitType = config.lineItemUnitType;
    const isNightly = unitType === LINE_ITEM_NIGHT;
    const isDaily = unitType === LINE_ITEM_DAY;

    const unitTranslationKey = isNightly
      ? 'TransactionPanel.perNight'
      : isDaily
      ? 'TransactionPanel.perDay'
      : 'TransactionPanel.perUnit';

    const price = currentListing.attributes.price;
    const bookingSubTitle = price
      ? `${formatMoney(intl, price)} ${intl.formatMessage({ id: unitTranslationKey })}`
      : '';

    const firstImage =
      currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

    const actionButtons = (
      <ActionButtonsMaybe
        showButtons={stateData.showActionButtons}
        primaryButtonProps={stateData?.primaryButtonProps}
        secondaryButtonProps={stateData?.secondaryButtonProps}
      />
    );

    const showSendMessageForm =
      !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

    const sendMessagePlaceholder = intl.formatMessage(
      { id: 'TransactionPanel.sendMessagePlaceholder' },
      { name: otherUserDisplayNameString }
    );

    const sendingMessageNotAllowed = intl.formatMessage({
      id: 'TransactionPanel.sendingMessageNotAllowed',
    });

    const paymentMethodsPageLink = (
      <NamedLink name="PaymentMethodsPage">
        <FormattedMessage id="TransactionPanel.paymentMethodsPageLink" />
      </NamedLink>
    );

    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <div className={css.container}>
          <div className={css.txInfo}>
            <DetailCardImage
              rootClassName={css.imageWrapperMobile}
              avatarWrapperClassName={css.avatarWrapperMobile}
              listingTitle={listingTitle}
              image={firstImage}
              provider={currentProvider}
              isCustomer={isCustomer}
            />
            {isProvider ? (
              <div className={css.avatarWrapperProviderDesktop}>
                <AvatarLarge user={currentCustomer} className={css.avatarDesktop} />
              </div>
            ) : null}

            <PanelHeading
              panelHeadingState={stateData.headingState}
              processName={stateData.processName}
              processState={stateData.processState}
              transactionRole={transactionRole}
              providerName={authorDisplayName}
              customerName={customerDisplayName}
              isCustomerBanned={isCustomerBanned}
              listingId={currentListing.id && currentListing.id.uuid}
              listingTitle={listingTitle}
              listingDeleted={listingDeleted}
            />

            <div className={css.orderDetails}>
              <div className={css.orderDetailsMobileSection}>
                <BreakdownMaybe
                  transaction={currentTransaction}
                  transactionRole={transactionRole}
                />
                <DiminishedActionButtonMaybe
                  showDispute={stateData.showDispute}
                  onOpenDisputeModal={onOpenDisputeModal}
                />
              </div>

              {savePaymentMethodFailed ? (
                <p className={css.genericError}>
                  <FormattedMessage
                    id="TransactionPanel.savePaymentMethodFailed"
                    values={{ paymentMethodsPageLink }}
                  />
                </p>
              ) : null}
              <DeliveryInfoMaybe
                className={css.deliveryInfoSection}
                transaction={currentTransaction}
                listing={currentListing}
              />
            </div>

            <FeedSection
              rootClassName={css.feedContainer}
              currentTransaction={currentTransaction}
              currentUser={currentUser}
              fetchMessagesError={fetchMessagesError}
              fetchMessagesInProgress={fetchMessagesInProgress}
              initialMessageFailed={initialMessageFailed}
              messages={messages}
              oldestMessagePageFetched={oldestMessagePageFetched}
              onOpenReviewModal={onOpenReviewModal}
              onShowMoreMessages={() => onShowMoreMessages(currentTransaction.id)}
              totalMessagePages={totalMessagePages}
            />
            {showSendMessageForm ? (
              <SendMessageForm
                formId={this.sendMessageFormName}
                rootClassName={css.sendMessageForm}
                messagePlaceholder={sendMessagePlaceholder}
                inProgress={sendMessageInProgress}
                sendMessageError={sendMessageError}
                onFocus={this.onSendMessageFormFocus}
                onBlur={this.onSendMessageFormBlur}
                onSubmit={this.onMessageSubmit}
              />
            ) : (
              <div className={css.sendingMessageNotAllowed}>{sendingMessageNotAllowed}</div>
            )}

            {stateData.showActionButtons ? (
              <div className={css.mobileActionButtons}>{actionButtons}</div>
            ) : null}
          </div>

          <div className={css.asideDesktop}>
            <div className={css.stickySection}>
              <div className={css.detailCard}>
                <DetailCardImage
                  avatarWrapperClassName={css.avatarWrapperDesktop}
                  listingTitle={listingTitle}
                  image={firstImage}
                  provider={currentProvider}
                  isCustomer={isCustomer}
                />

                <DetailCardHeadingsMaybe
                  showDetailCardHeadings={stateData.showDetailCardHeadings}
                  listingTitle={listingTitle}
                  subTitle={bookingSubTitle}
                />
                {stateData.showOrderPanel ? (
                  <OrderPanel
                    className={css.orderPanel}
                    titleClassName={css.orderTitle}
                    isOwnListing={false}
                    unitType={unitType}
                    listing={currentListing}
                    title={listingTitle}
                    author={currentProvider}
                    onSubmit={onSubmitOrderRequest}
                    onManageDisableScrolling={onManageDisableScrolling}
                    timeSlots={timeSlots}
                    fetchTimeSlotsError={fetchTimeSlotsError}
                    onFetchTransactionLineItems={onFetchTransactionLineItems}
                    lineItems={lineItems}
                    fetchLineItemsInProgress={fetchLineItemsInProgress}
                    fetchLineItemsError={fetchLineItemsError}
                  />
                ) : null}
                <BreakdownMaybe
                  className={css.breakdownContainer}
                  transaction={currentTransaction}
                  transactionRole={transactionRole}
                />

                {stateData.showActionButtons ? (
                  <div className={css.desktopActionButtons}>{actionButtons}</div>
                ) : null}
              </div>
              <DiminishedActionButtonMaybe
                showDispute={stateData.showDispute}
                onOpenDisputeModal={onOpenDisputeModal}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TransactionPanelComponent.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  fetchMessagesError: null,
  initialMessageFailed: false,
  savePaymentMethodFailed: false,
  sendMessageError: null,
  sendReviewError: null,
  timeSlots: null,
  fetchTimeSlotsError: null,
  nextTransitions: null,
  lineItems: null,
  fetchLineItemsError: null,
};

const actionButtonShape = shape({
  inProgress: bool.isRequired,
  error: propTypes.error,
  onTransition: func.isRequired,
  buttonText: string.isRequired,
  errorText: string.isRequired,
});

TransactionPanelComponent.propTypes = {
  rootClassName: string,
  className: string,

  currentUser: propTypes.currentUser,
  transaction: propTypes.transaction.isRequired,
  totalMessagePages: number.isRequired,
  oldestMessagePageFetched: number.isRequired,
  messages: arrayOf(propTypes.message).isRequired,
  initialMessageFailed: bool,
  savePaymentMethodFailed: bool,
  fetchMessagesInProgress: bool.isRequired,
  fetchMessagesError: propTypes.error,
  sendMessageInProgress: bool.isRequired,
  sendMessageError: propTypes.error,
  onManageDisableScrolling: func.isRequired,
  onOpenDisputeModal: func.isRequired,
  onOpenReviewModal: func.isRequired,
  onShowMoreMessages: func.isRequired,
  onSendMessage: func.isRequired,
  onSubmitOrderRequest: func.isRequired,
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
  nextTransitions: array,

  // Tx process transition related props
  markReceivedProps: actionButtonShape.isRequired,
  markReceivedFromPurchasedProps: actionButtonShape.isRequired,
  markDeliveredProps: actionButtonShape.isRequired,
  leaveReviewProps: actionButtonShape.isRequired,

  // line items
  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from injectIntl
  intl: intlShape,
};

const TransactionPanel = injectIntl(TransactionPanelComponent);

export default TransactionPanel;
