import React, { Component } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { displayPrice } from '../../../util/configHelpers';
import { propTypes } from '../../../util/types';
import { userDisplayNameAsString } from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { createSlug } from '../../../util/urlHelpers';

import { AvatarLarge, NamedLink, UserDisplayName } from '../../../components';

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
    } = this.props;

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
        primaryButtonProps={stateData?.primaryButtonProps}
        secondaryButtonProps={stateData?.secondaryButtonProps}
        isListingDeleted={listingDeleted}
        isProvider={isProvider}
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

            {stateData.showActionButtons ? (
              <>
                <div className={css.mobileActionButtonSpacer}></div>
                <div className={css.mobileActionButtons}>{actionButtons}</div>
              </>
            ) : null}
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

const TransactionPanel = injectIntl(TransactionPanelComponent);

export default TransactionPanel;
