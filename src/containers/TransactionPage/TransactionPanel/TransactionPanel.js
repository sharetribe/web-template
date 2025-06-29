import React, { Component, useState } from 'react';
import classNames from 'classnames';
import moment from 'moment'; // [SKYFARER]

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { displayPrice } from '../../../util/configHelpers';
import { propTypes } from '../../../util/types';
import { userDisplayNameAsString } from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { createSlug } from '../../../util/urlHelpers';

import { AvatarLarge, ExternalLink, NamedLink, UserDisplayName, Modal } from '../../../components'; // [SKYFARER MERGE: +Modal]

import { stateDataShape } from '../TransactionPage.stateData';
import SendMessageForm from '../SendMessageForm/SendMessageForm';

// These are internal components that make this file more readable.
import BreakdownMaybe from './BreakdownMaybe';
import DetailCardHeadingsMaybe from './DetailCardHeadingsMaybe';
import DetailCardImage from './DetailCardImage';
import DeliveryInfoMaybe from './DeliveryInfoMaybe';
import BookingLocationMaybe from './BookingLocationMaybe';
import InquiryMessageMaybe from './InquiryMessageMaybe';
import FeedSection from './FeedSection';
import ActionButtonsMaybe from './ActionButtonsMaybe';
import DiminishedActionButtonMaybe from './DiminishedActionButtonMaybe';
import PanelHeading from './PanelHeading';

import css from './TransactionPanel.module.css';

// [SKYFARER]
import { BookingPeriod } from '../../../components/OrderBreakdown/LineItemBookingPeriod';
import { getGoogleCalendarEventDetails } from '../../../util/transactionDataExtractor';
import { cancelGoogleEvent, request, adjustBooking } from '../../../util/api';
// [/SKYFARER]

// Helper function to get display names for different roles
const displayNames = (currentUser, provider, customer, intl) => {
  const authorDisplayName = <UserDisplayName user={provider} intl={intl} />;
  const customerDisplayName = <UserDisplayName user={customer} intl={intl} />;

  let otherUserDisplayName = '';
  let otherUserDisplayNameString = '';
  const currentUserIsCustomer =
    currentUser.id && customer?.id && currentUser.id.uuid === customer?.id?.uuid;
  const currentUserIsProvider =
    currentUser.id && provider?.id && currentUser.id.uuid === provider?.id?.uuid;

  if (currentUserIsCustomer) {
    otherUserDisplayName = authorDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(provider, '');
  } else if (currentUserIsProvider) {
    otherUserDisplayName = customerDisplayName;
    otherUserDisplayNameString = userDisplayNameAsString(customer, '');
  }

  return {
    authorDisplayName,
    customerDisplayName,
    otherUserDisplayName,
    otherUserDisplayNameString,
  };
};

const CancelModal = ({ intl, isOpen, onClose, onManageDisableScrolling, cancel }) => {
  return (
    <Modal
      id="cancel-booking-modal"
      intl={intl}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      title={intl.formatMessage({ id: 'RescheduleCancelModal.title', defaultMessage: 'Cancel Booking' })}
    >
      <div className={css.cancelModalContent}>
        <FormattedMessage id="RescheduleCancelModal.description" defaultMessage="Are you sure you want to cancel this booking?" />
        <button className={`buttonPrimaryInline ${css.cancelButton}`} onClick={cancel}>{intl.formatMessage({ id: 'RescheduleCancelModal.confirmCancellation', defaultMessage: 'Confirm Cancellation' })}</button>
      </div>
    </Modal>
  )
}

// [ADJUST BOOKING] Move AdjustBookingModal to top-level
const AdjustBookingModal = ({ transaction, onClose, onSubmit, onManageDisableScrolling }) => {
  const [hours, setHours] = useState(transaction.booking?.attributes?.hours || 1);
  // Prepopulate price with the listing price and make it non-editable
  const price = transaction.listing?.attributes?.price?.amount
    ? transaction.listing.attributes.price.amount
    : 0;
  const currency = transaction.listing?.attributes?.price?.currency || 'USD';
  const handleSubmit = () => {
    onSubmit(hours, price);
    onClose();
  };
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Adjust Booking"
      onManageDisableScrolling={onManageDisableScrolling}
    >
      <div style={{ padding: 24 }}>
        <label>
          Hours:
          <input
            type="number"
            min={1}
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            style={{ marginLeft: 8, marginBottom: 16 }}
          />
        </label>
        <br />
        <label>
          Price (in {currency}):
          <input
            type="number"
            value={price / 100}
            readOnly
            style={{ marginLeft: 8, marginBottom: 16, background: '#f5f5f5', color: '#888' }}
          />
        </label>
        <br />
        <button onClick={handleSubmit} style={{ marginTop: 16 }}>Submit Adjustment</button>
      </div>
    </Modal>
  );
};

/**
 * Transaction panel
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {string} props.transactionRole - The transaction role
 * @param {propTypes.listing} props.listing - The listing
 * @param {propTypes.user} props.customer - The customer
 * @param {propTypes.user} props.provider - The provider
 * @param {boolean} props.hasTransitions - Whether the transitions are shown
 * @param {propTypes.uuid} props.transactionId - The transaction id
 * @param {Array<propTypes.message>)} props.messages - The messages
 * @param {boolean} props.initialMessageFailed - Whether the initial message failed
 * @param {boolean} props.savePaymentMethodFailed - Whether the save payment method failed
 * @param {propTypes.error} props.fetchMessagesError - The fetch messages error
 * @param {boolean} props.sendMessageInProgress - Whether the send message is in progress
 * @param {propTypes.error} props.sendMessageError - The send message error
 * @param {Function} props.onOpenDisputeModal - The on open dispute modal function
 * @param {Function} props.onSendMessage - The on send message function
 * @param {stateDataShape} props.stateData - The state data
 * @param {boolean} props.showBookingLocation - Whether the booking location is shown
 * @param {React.ReactNode} props.activityFeed - The activity feed
 * @param {React.ReactNode} props.orderBreakdown - The order breakdown
 * @param {React.ReactNode} props.orderPanel - The order panel
 * @param {object} props.config - The config
 * @param {intlShape} props.intl - The intl
 * @returns {JSX.Element} The TransactionPanel component
 */
export class TransactionPanelComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sendMessageFormFocused: false,
      modal: false, // [SKYFARER]
      showAdjustModal: false, // [ADJUST BOOKING]
      adjustHours: null, // [ADJUST BOOKING]
      adjustPrice: null, // [ADJUST BOOKING]
    };
    this.isMobSaf = false;
    this.sendMessageFormName = 'TransactionPanel.SendMessageForm';

    this.onSendMessageFormFocus = this.onSendMessageFormFocus.bind(this);
    this.onSendMessageFormBlur = this.onSendMessageFormBlur.bind(this);
    this.onMessageSubmit = this.onMessageSubmit.bind(this);
    this.scrollToMessage = this.scrollToMessage.bind(this);
    this.handleAdjustBooking = this.handleAdjustBooking.bind(this); // [ADJUST BOOKING]
    this.handleShowAdjustModal = this.handleShowAdjustModal.bind(this); // [ADJUST BOOKING]
    this.handleCloseAdjustModal = this.handleCloseAdjustModal.bind(this); // [ADJUST BOOKING]
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
    const { transactionId, onSendMessage, config } = this.props;

    if (!message) {
      return;
    }
    onSendMessage(transactionId, message, config)
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

  // [ADJUST BOOKING] Handler for showing/hiding modal
  handleShowAdjustModal() {
    this.setState({ showAdjustModal: true });
  }
  handleCloseAdjustModal() {
    this.setState({ showAdjustModal: false });
  }

  // [ADJUST BOOKING] Handler for submitting adjustment
  async handleAdjustBooking(newHours, newPrice) {
    try {
      console.log('handleAdjustBooking', newHours, newPrice);
      const response = await adjustBooking({
        transactionId: this.props.transaction.id.uuid,
        newHours,
        newPrice,
      });
      if (!response.success) {
        const errorMsg = response && response.error ? response.error : 'Unknown error';
        alert('Failed to adjust booking: ' + errorMsg);
        return;
      }
      window.location.reload();
    } catch (err) {
      alert('Network or server error: ' + (err.message || err));
    }
  }

  render() {
    const {
      rootClassName,
      className,
      currentUser,
      transactionRole,
      listing,
      customer,
      provider,
      hasTransitions = false,
      protectedData,
      messages,
      initialMessageFailed = false,
      savePaymentMethodFailed = false,
      fetchMessagesError,
      sendMessageInProgress,
      sendMessageError,
      onOpenDisputeModal,
      intl,
      stateData = {},
      showBookingLocation = false,
      activityFeed,
      isInquiryProcess,
      orderBreakdown,
      orderPanel,
      config,
      hasViewingRights,
      transaction, // [SKYFARER]
      onManageDisableScrolling, // [SKYFARER]
    } = this.props;
    // [SKYFARER]
    const googleCalendarEventDetails = getGoogleCalendarEventDetails(transaction);
    const eventStartTime = googleCalendarEventDetails?.eventStartTime;
    const currentTime = moment();
    // Parse the event start time
    const eventTime = moment(eventStartTime);

    const shouldEnableButton = () => {
      return currentTime.isSameOrAfter(eventTime, 'minute');
    };
    // [/SKYFARER]

    const isCustomer = transactionRole === 'customer';
    const isProvider = transactionRole === 'provider';

    const listingDeleted = !!listing?.attributes?.deleted;
    const isCustomerBanned = !!customer?.attributes?.banned;
    const isCustomerDeleted = !!customer?.attributes?.deleted;
    const isProviderBanned = !!provider?.attributes?.banned;
    const isProviderDeleted = !!provider?.attributes?.deleted;

    const { authorDisplayName, customerDisplayName, otherUserDisplayNameString } = displayNames(
      currentUser,
      provider,
      customer,
      intl
    );

    const deletedListingTitle = intl.formatMessage({
      id: 'TransactionPanel.deletedListingTitle',
    });

    const listingTitle = listingDeleted ? deletedListingTitle : listing?.attributes?.title;
    const firstImage = listing?.images?.length > 0 ? listing?.images[0] : null;

    const actionButtons = (
      <ActionButtonsMaybe
        showButtons={stateData.showActionButtons}
        setModal={(modal) => this.setState({ modal })} // [SKYFARER]
        primaryButtonProps={stateData?.primaryButtonProps}
        secondaryButtonProps={stateData?.secondaryButtonProps}
        isListingDeleted={listingDeleted}
        isProvider={isProvider}
        onShowAdjustModal={this.handleShowAdjustModal} // [ADJUST BOOKING]
      />
    );

    const listingType = listing?.attributes?.publicData?.listingType;
    const listingTypeConfigs = config.listing.listingTypes;
    const listingTypeConfig = listingTypeConfigs.find(conf => conf.listingType === listingType);
    const showPrice = isInquiryProcess && displayPrice(listingTypeConfig);

    const showSendMessageForm =
      !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

    // Only show order panel for users who have listing viewing rights, otherwise
    // show the detail card heading.
    const showOrderPanel = stateData.showOrderPanel && hasViewingRights;
    const showDetailCardHeadings = stateData.showDetailCardHeadings || !hasViewingRights;

    const deliveryMethod = protectedData?.deliveryMethod || 'none';
    const priceVariantName = protectedData?.priceVariantName;

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
              provider={provider}
              isCustomer={isCustomer}
              listingImageConfig={config.layout.listingImage}
              transaction={transaction} // [SKYFARER]
            />
            {isProvider ? (
              <div className={css.avatarWrapperProviderDesktop}>
                <AvatarLarge user={customer} className={css.avatarDesktop} />
              </div>
            ) : null}

            <PanelHeading
              processName={stateData.processName}
              processState={stateData.processState}
              showExtraInfo={stateData.showExtraInfo}
              showPriceOnMobile={showPrice}
              price={listing?.attributes?.price}
              intl={intl}
              deliveryMethod={deliveryMethod}
              isPendingPayment={!!stateData.isPendingPayment}
              transactionRole={transactionRole}
              providerName={authorDisplayName}
              customerName={customerDisplayName}
              isCustomerBanned={isCustomerBanned}
              listingId={listing?.id?.uuid}
              listingTitle={listingTitle}
              listingDeleted={listingDeleted}
              headingTextId={ // [SKYFARER]
                transaction.attributes.metadata.rescheduleRequest
                  ? `TransactionPage.default-booking.${transactionRole}.reschedule-pending.title`
                  : undefined
              }
            />

            <InquiryMessageMaybe
              protectedData={protectedData}
              showInquiryMessage={isInquiryProcess}
              isCustomer={isCustomer}
            />

            {!isInquiryProcess ? (
              <div className={css.orderDetails}>
                <div className={css.orderDetailsMobileSection}>
                  <BreakdownMaybe
                    orderBreakdown={orderBreakdown}
                    processName={stateData.processName}
                    priceVariantName={priceVariantName}
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
                      values={{
                        paymentMethodsPageLink: (
                          <NamedLink name="PaymentMethodsPage">
                            <FormattedMessage id="TransactionPanel.paymentMethodsPageLink" />
                          </NamedLink>
                        ),
                      }}
                    />
                  </p>
                ) : null}
                <DeliveryInfoMaybe
                  className={css.deliveryInfoSection}
                  protectedData={protectedData}
                  listing={listing}
                  locale={config.localization.locale}
                />
                <BookingLocationMaybe
                  className={css.deliveryInfoSection}
                  listing={listing}
                  showBookingLocation={showBookingLocation}
                />
              </div>
            ) : null}

            <FeedSection
              rootClassName={css.feedContainer}
              hasMessages={messages.length > 0}
              hasTransitions={hasTransitions}
              fetchMessagesError={fetchMessagesError}
              initialMessageFailed={initialMessageFailed}
              activityFeed={activityFeed}
              isConversation={isInquiryProcess}
            />
            {showSendMessageForm ? (
              <SendMessageForm
                formId={this.sendMessageFormName}
                rootClassName={css.sendMessageForm}
                messagePlaceholder={intl.formatMessage(
                  { id: 'TransactionPanel.sendMessagePlaceholder' },
                  { name: otherUserDisplayNameString }
                )}
                inProgress={sendMessageInProgress}
                sendMessageError={sendMessageError}
                onFocus={this.onSendMessageFormFocus}
                onBlur={this.onSendMessageFormBlur}
                onSubmit={this.onMessageSubmit}
              />
            ) : (
              <div className={css.sendingMessageNotAllowed}>
                <FormattedMessage id="TransactionPanel.sendingMessageNotAllowed" />
              </div>
            )}

            {stateData.showActionButtons && (
              <>
                <div className={css.mobileActionButtonSpacer}></div>
                <div className={css.mobileActionButtons}>{actionButtons}</div>

                {/* [SKYFARER] */}
                <CancelModal
                  intl={intl}
                  isOpen={this.state.modal === 'cancel'}
                  onClose={() => this.setState({ modal: false })}
                  onManageDisableScrolling={onManageDisableScrolling}
                  cancel={() => {
                    stateData.secondaryButtonProps?.onAction();
                    cancelGoogleEvent({ txId: transaction.id.uuid });
                  }}
                />
              </>
            )}

            {this.state.showAdjustModal && (
              <AdjustBookingModal
                transaction={transaction}
                onClose={this.handleCloseAdjustModal}
                onSubmit={this.handleAdjustBooking}
                onManageDisableScrolling={this.props.onManageDisableScrolling}
              />
            )}
          </div>

          <div className={css.asideDesktop}>
            <div className={css.stickySection}>
              <div className={css.detailCard}>
                <DetailCardImage
                  avatarWrapperClassName={css.avatarWrapperDesktop}
                  listingTitle={listingTitle}
                  image={firstImage}
                  provider={provider}
                  isCustomer={isCustomer}
                  listingImageConfig={config.layout.listingImage}
                />

                <DetailCardHeadingsMaybe
                  showDetailCardHeadings={showDetailCardHeadings}
                  listingTitle={
                    listingDeleted ? (
                      listingTitle
                    ) : (
                      <NamedLink
                        name="ListingPage"
                        params={{ id: listing.id?.uuid, slug: createSlug(listingTitle) }}
                      >
                        {listingTitle}
                      </NamedLink>
                    )
                  }
                  showPrice={showPrice}
                  price={listing?.attributes?.price}
                  intl={intl}
                />
                {showOrderPanel ? orderPanel : null}
                <BreakdownMaybe
                  className={css.breakdownContainer}
                  orderBreakdown={orderBreakdown}
                  processName={stateData.processName}
                  priceVariantName={priceVariantName}
                />

                {/* [SKYFARER] */}
                {googleCalendarEventDetails?.meetingLink && !transaction.attributes.lastTransition.includes('cancel') && (
                  <div className={css.meetingLink}>
                    <ExternalLink
                      href={googleCalendarEventDetails?.meetingLink}
                      className={classNames(css.buttonLink, {
                        // [css.pointerEvents]: !shouldEnableButton(),
                      })}
                    >
                      <FormattedMessage id="TransactionPanel.meetingLink" />
                    </ExternalLink>
                  </div>
                )}
                {/* [/SKYFARER] */}

                {stateData.showActionButtons && (
                  <>
                    <div className={css.desktopActionButtons}>{actionButtons}</div>

                    <CancelModal
                      intl={intl}
                      isOpen={this.state.modal === 'cancel'}
                      onClose={() => this.setState({ modal: false })}
                      onManageDisableScrolling={onManageDisableScrolling}
                      cancel={() => {
                        stateData.secondaryButtonProps?.onAction();
                        cancelGoogleEvent({ txId: transaction.id.uuid });
                      }}
                    />
                  </>
                )}
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

const TransactionPanel = injectIntl(TransactionPanelComponent);

export default TransactionPanel;
