import React, { Component } from 'react';
import { arrayOf, bool, func, node, object, oneOf, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY, propTypes } from '../../../util/types';
import { userDisplayNameAsString } from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { formatMoney } from '../../../util/currency';
import { AvatarLarge, NamedLink, UserDisplayName } from '../../../components';

import { stateDataShape } from '../TransactionPage.stateData';
import SendMessageForm from '../SendMessageForm/SendMessageForm';

// These are internal components that make this file more readable.
import BreakdownMaybe from './BreakdownMaybe';
import DetailCardHeadingsMaybe from './DetailCardHeadingsMaybe';
import DetailCardImage from './DetailCardImage';
import DeliveryInfoMaybe from './DeliveryInfoMaybe';
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
      lineItemUnitType,
      customer,
      provider,
      hasTransitions,
      protectedData,
      messages,
      initialMessageFailed,
      savePaymentMethodFailed,
      fetchMessagesError,
      sendMessageInProgress,
      sendMessageError,
      onOpenDisputeModal,
      intl,
      stateData,
      activityFeed,
      orderBreakdown,
      orderPanel,
      config,
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

    const listingTitle = listing?.attributes?.deleted
      ? deletedListingTitle
      : listing?.attributes?.title;

    const isNightly = lineItemUnitType === LINE_ITEM_NIGHT;
    const isDaily = lineItemUnitType === LINE_ITEM_DAY;
    const unitTranslationKey = isNightly
      ? 'TransactionPanel.perNight'
      : isDaily
      ? 'TransactionPanel.perDay'
      : 'TransactionPanel.perUnit';

    const price = listing?.attributes?.price;
    const orderSubTitle = price
      ? `${formatMoney(intl, price)} ${intl.formatMessage({ id: unitTranslationKey })}`
      : '';

    const firstImage = listing?.images?.length > 0 ? listing?.images[0] : null;

    const actionButtons = (
      <ActionButtonsMaybe
        showButtons={stateData.showActionButtons}
        primaryButtonProps={stateData?.primaryButtonProps}
        secondaryButtonProps={stateData?.secondaryButtonProps}
      />
    );

    const showSendMessageForm =
      !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

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
              provider={provider}
              isCustomer={isCustomer}
              listingConfig={config.listing}
            />
            {isProvider ? (
              <div className={css.avatarWrapperProviderDesktop}>
                <AvatarLarge user={customer} className={css.avatarDesktop} />
              </div>
            ) : null}

            <PanelHeading
              processName={stateData.processName}
              processState={stateData.processState}
              isPendingPayment={!!stateData.isPendingPayment}
              transactionRole={transactionRole}
              providerName={authorDisplayName}
              customerName={customerDisplayName}
              isCustomerBanned={isCustomerBanned}
              listingId={listing?.id?.uuid}
              listingTitle={listingTitle}
              listingDeleted={listingDeleted}
            />

            <div className={css.orderDetails}>
              <div className={css.orderDetailsMobileSection}>
                <BreakdownMaybe orderBreakdown={orderBreakdown} />
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
                protectedData={protectedData}
                listing={listing}
                locale={config.locale}
              />
            </div>

            <FeedSection
              rootClassName={css.feedContainer}
              hasMessages={messages.length > 0}
              hasTransitions={hasTransitions}
              fetchMessagesError={fetchMessagesError}
              initialMessageFailed={initialMessageFailed}
              activityFeed={activityFeed}
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
                  provider={provider}
                  isCustomer={isCustomer}
                  listingConfig={config.listing}
                />

                <DetailCardHeadingsMaybe
                  showDetailCardHeadings={stateData.showDetailCardHeadings}
                  listingTitle={listingTitle}
                  subTitle={orderSubTitle}
                />
                {stateData.showOrderPanel ? orderPanel : null}
                <BreakdownMaybe
                  className={css.breakdownContainer}
                  orderBreakdown={orderBreakdown}
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
  listing: null,
  customer: null,
  provider: null,
  hasTransitions: false,
  fetchMessagesError: null,
  initialMessageFailed: false,
  savePaymentMethodFailed: false,
  sendMessageError: null,
  sendReviewError: null,
  stateData: {},
  activityFeed: null,
  orderBreakdown: null,
  orderPanel: null,
};

TransactionPanelComponent.propTypes = {
  rootClassName: string,
  className: string,

  currentUser: propTypes.currentUser,
  transactionRole: oneOf(['customer', 'provider']).isRequired,
  listing: propTypes.listing,
  customer: propTypes.user,
  provider: propTypes.user,
  hasTransitions: bool,
  transactionId: propTypes.uuid.isRequired,
  messages: arrayOf(propTypes.message).isRequired,
  initialMessageFailed: bool,
  savePaymentMethodFailed: bool,
  fetchMessagesError: propTypes.error,
  sendMessageInProgress: bool.isRequired,
  sendMessageError: propTypes.error,
  onOpenDisputeModal: func.isRequired,
  onSendMessage: func.isRequired,
  stateData: stateDataShape,
  activityFeed: node,
  orderBreakdown: node,
  orderPanel: node,
  config: object.isRequired,

  // from injectIntl
  intl: intlShape,
};

const TransactionPanel = injectIntl(TransactionPanelComponent);

export default TransactionPanel;
