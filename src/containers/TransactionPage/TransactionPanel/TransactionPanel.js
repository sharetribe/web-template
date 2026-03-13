import React, { Component } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { file as sdkFile } from '../../../util/sdkLoader';
import { propTypes } from '../../../util/types';
import { userDisplayNameAsString } from '../../../util/data';
import { isMobileSafari } from '../../../util/userAgent';
import { createSlug } from '../../../util/urlHelpers';
import { displayPrice } from '../../../util/configHelpers';

import { AvatarLarge, NamedLink, UserDisplayName } from '../../../components';

import { stateDataShape } from '../TransactionPage.stateData';
import SendMessageForm from '../SendMessageForm/SendMessageForm';

// These are internal components that make this file more readable.
import BreakdownMaybe from './BreakdownMaybe';
import DetailCardHeadingsMaybe from './DetailCardHeadingsMaybe';
import DetailCardImage from './DetailCardImage';
import DeliveryInfoMaybe from './DeliveryInfoMaybe';
import BookingLocationMaybe from './BookingLocationMaybe';
import FeedSection from './FeedSection';
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

const allowShowingExtraInfo = (showExtraInfo, transactionPartyInfo) => {
  const {
    isCustomer,
    isCustomerBanned,
    isCustomerDeleted,
    isProvider,
    isProviderBanned,
    isProviderDeleted,
  } = transactionPartyInfo;
  return (
    !!showExtraInfo &&
    ((isProvider && !isCustomerBanned && !isCustomerDeleted) ||
      (isCustomer && !isProviderBanned && !isProviderDeleted))
  );
};

const FILE_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const idAsString = id => (typeof id === 'string' ? id : id?.uuid || '');

const parseUploadedFileFromMessage = message => {
  const content = message?.attributes?.content || '';
  const publicFiles = message?.attributes?.publicFiles || [];
  const parsedFromPublicFiles = publicFiles
    .map(publicFile => {
      const fileId = idAsString(publicFile?.fileId);
      if (!FILE_ID_REGEX.test(fileId)) {
        return null;
      }

      const fileNameMatch = content.match(/^Uploaded file:\s*(.*?)\s*\(/i);
      const fileName = fileNameMatch ? fileNameMatch[1] : fileId;

      return {
        fileId,
        fileName,
        messageId: message?.id?.uuid || fileId,
      };
    })
    .filter(file => !!file);

  if (parsedFromPublicFiles.length > 0) {
    return parsedFromPublicFiles;
  }

  const fileIdMatch = content.match(/fileId:\s*([0-9a-f-]{36})/i);
  if (!fileIdMatch) {
    return [];
  }

  const fileId = fileIdMatch[1];
  if (!FILE_ID_REGEX.test(fileId)) {
    return [];
  }

  const fileNameMatch = content.match(/^Uploaded file:\s*(.*?)\s*\(/i);
  const fileName = fileNameMatch ? fileNameMatch[1] : fileId;

  return [
    {
      fileId,
      fileName,
      messageId: message?.id?.uuid || fileId,
    },
  ];
};

const uploadedFilesFromMessages = messages => {
  const allUploadedFiles = (messages || [])
    .flatMap(parseUploadedFileFromMessage)
    .filter(file => !!file);

  const filesById = allUploadedFiles.reduce((collected, file) => {
    collected[file.fileId] = file;
    return collected;
  }, {});

  return Object.values(filesById);
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
 * @param {boolean} props.savePaymentMethodFailed - Whether the save payment method failed
 * @param {propTypes.error} props.fetchMessagesError - The fetch messages error
 * @param {boolean} props.sendMessageInProgress - Whether the send message is in progress
 * @param {propTypes.error} props.sendMessageError - The send message error
 * @param {Function} props.onOpenDisputeModal - The on open dispute modal function
 * @param {Function} props.onSendMessage - The on send message function
 * @param {stateDataShape} props.stateData - The state data
 * @param {boolean} props.showBookingLocation - Whether the booking location is shown
 * @param {React.ReactNode} props.activityFeed - The activity feed
 * @param {Function} props.actionButtons - The action buttons function
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
      fileDownloadInProgress: false,
      fileUploadStatus: 'idle',
    };
    this.isMobSaf = false;
    this.sendMessageFormName = 'TransactionPanel.SendMessageForm';

    this.onSendMessageFormFocus = this.onSendMessageFormFocus.bind(this);
    this.onSendMessageFormBlur = this.onSendMessageFormBlur.bind(this);
    this.onMessageSubmit = this.onMessageSubmit.bind(this);
    this.onFileUpload = this.onFileUpload.bind(this);
    this.onDownloadUploadedFile = this.onDownloadUploadedFile.bind(this);
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

  ensureAuthenticated(sdk) {
    if (!sdk?.currentUser?.show) {
      return Promise.resolve();
    }

    return sdk.currentUser.show().catch(() => {
      throw new Error('User is not authenticated');
    });
  }

  waitForFileAvailable(ownFilesApi, fileId, attempt = 0) {
    const maxAttempts = 60;
    const intervalMs = 1000;

    return ownFilesApi.show({ id: fileId }).then(response => {
      const ownFile = response?.data?.data;
      const fileState = ownFile?.attributes?.state;

      if (fileState === 'available') {
        return ownFile;
      }

      if (fileState === 'verificationFailed') {
        throw new Error('File verification failed');
      }

      if (attempt >= maxAttempts - 1) {
        throw new Error('Timed out waiting for file to become available');
      }

      return new Promise(resolve => {
        setTimeout(resolve, intervalMs);
      }).then(() => this.waitForFileAvailable(ownFilesApi, fileId, attempt + 1));
    });
  }

  onFileUpload(event) {
    const file = event.target.files[0];
    console.log('file', file);

    if (!file) {
      return;
    }

    const sdk = window?.app?.sdk;
    const transactionId = this.props.transactionId;
    const ownFilesApi = sdk?.ownFiles || sdk?.own_files;
    const fileUploadsApi = sdk?.fileUploads || sdk?.file_uploads;
    const messagesApi = sdk?.messages;

    this.setState({ fileUploadStatus: 'uploading' });

    if (!sdk || !transactionId) {
      console.error('SDK instance or transactionId is missing');
      this.setState({ fileUploadStatus: 'failed' });
      return;
    }

    if (!ownFilesApi?.create || !ownFilesApi?.show || !fileUploadsApi?.create || !messagesApi?.send) {
      console.error('Required SDK file APIs are missing', {
        hasOwnFilesCreate: !!ownFilesApi?.create,
        hasOwnFilesShow: !!ownFilesApi?.show,
        hasFileUploadsCreate: !!fileUploadsApi?.create,
        hasMessagesSend: !!messagesApi?.send,
        hasFileMetadata: !!sdkFile?.metadata,
        hasFileUpload: !!sdkFile?.upload,
        sdkKeys: Object.keys(sdk || {}),
      });
      this.setState({ fileUploadStatus: 'failed' });
      return;
    }

    let uploadedFileId;

    this.ensureAuthenticated(sdk)
      .then(() => {
        return sdkFile.metadata(file);
      })
      .then(meta => ownFilesApi.create(meta))
      .then(ownFileResponse => {
        const ownFile = ownFileResponse?.data?.data;
        const fileId = ownFile?.id;
        const fileIdString = idAsString(fileId);

        if (!fileId || !FILE_ID_REGEX.test(fileIdString)) {
          throw new Error('Failed to create own file');
        }

        uploadedFileId = fileId;

        return fileUploadsApi.create({ fileId }).then(fileUploadResponse => {
          return { fileId, fileUploadResponse };
        });
      })
      .then(({ fileId, fileUploadResponse }) => {
        const uploadAttributes = fileUploadResponse?.data?.data?.attributes || {};
        const method = uploadAttributes.method || 'PUT';
        const url = uploadAttributes.url;
        const headers = uploadAttributes.headers || {};

        if (!url) {
          throw new Error('Failed to get pre-signed upload URL');
        }

        return sdkFile.upload({ method, url, headers, file }).then(() => fileId);
      })
      .then(fileId => {
        this.setState({ fileUploadStatus: 'verifying' });
        return this.waitForFileAvailable(ownFilesApi, fileId).catch(error => {
          if (error?.message === 'Timed out waiting for file to become available') {
            console.warn('File verification is taking longer than expected, continuing with uploaded file ID');
            return { id: fileId, attributes: { state: 'pendingUpload' } };
          }

          throw error;
        });
      })
      .then(verifiedOwnFile => {
        const ownFileId = verifiedOwnFile?.id || uploadedFileId;
        const ownFileIdString = idAsString(ownFileId);
        const messageContent = `Uploaded file: ${file.name} (${file.type || 'unknown'}, ${file.size} bytes), fileId: ${ownFileIdString}`;

        return messagesApi.send({
          transactionId,
          content: messageContent,
          publicFiles: [{ fileId: ownFileId }],
        });
      })
      .then(messageResponse => {
        console.log('message response', messageResponse);
        event.target.value = '';
        this.setState({ fileUploadStatus: 'success' });
      })
      .catch(e => {
        console.error('error', e);
        this.setState({ fileUploadStatus: 'failed' });
      });
  }

  onDownloadUploadedFile(fileId) {
    const sdk = window?.app?.sdk;
    const ownFileDownloadsApi = sdk?.ownFileDownloads || sdk?.own_file_downloads;

    if (!ownFileDownloadsApi?.create) {
      console.error('SDK ownFileDownloads.create is missing');
      return;
    }

    this.setState({ fileDownloadInProgress: true });

    ownFileDownloadsApi
      .create({ fileId })
      .then(response => {
        const url = response?.data?.data?.attributes?.url;
        if (!url) {
          throw new Error('Download URL was not found in ownFileDownloads.create response');
        }

        window.open(url, '_blank', 'noopener,noreferrer');
      })
      .catch(error => {
        console.error('File download failed', error);
      })
      .finally(() => {
        this.setState({ fileDownloadInProgress: false });
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
      transitions,
      processName,
      protectedData,
      messages,
      savePaymentMethodFailed = false,
      fetchMessagesError,
      sendMessageInProgress,
      sendMessageError,
      onOpenDisputeModal,
      showListingImage,
      intl,
      stateData = {},
      showBookingLocation = false,
      requestQuote,
      offer,
      activityFeed,
      actionButtons,
      isInquiryProcess,
      orderBreakdown,
      orderPanel,
      config,
      hasViewingRights,
      transactionFieldsComponent,
    } = this.props;

    const { fileDownloadInProgress, fileUploadStatus } = this.state;

    const hasTransitions = transitions.length > 0;
    const isCustomer = transactionRole === 'customer';
    const isProvider = transactionRole === 'provider';

    const listingDeleted = !!listing?.attributes?.deleted;
    const isCustomerBanned = !!customer?.attributes?.banned;
    const isCustomerDeleted = !!customer?.attributes?.deleted;
    const isProviderBanned = !!provider?.attributes?.banned;
    const isProviderDeleted = !!provider?.attributes?.deleted;

    const transactionPartyInfo = {
      isCustomer,
      isCustomerBanned,
      isCustomerDeleted,
      isProvider,
      isProviderBanned,
      isProviderDeleted,
    };

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

    const listingType = listing?.attributes?.publicData?.listingType;
    const listingTypeConfigs = config.listing.listingTypes;
    const listingTypeConfig = listingTypeConfigs.find(conf => conf.listingType === listingType);
    const showPrice = isInquiryProcess && displayPrice(listingTypeConfig);
    const showBreakDown = stateData.showBreakDown !== false; // NOTE: undefined defaults to true due to historical reasons.

    const showSendMessageForm =
      !isCustomerBanned && !isCustomerDeleted && !isProviderBanned && !isProviderDeleted;

    // Only show order panel for users who have listing viewing rights, otherwise
    // show the detail card heading.
    const showOrderPanel = stateData.showOrderPanel && hasViewingRights;
    const showDetailCardHeadings = stateData.showDetailCardHeadings || !hasViewingRights;

    const deliveryMethod = protectedData?.deliveryMethod || 'none';
    const priceVariantName = protectedData?.priceVariantName;

    const classes = classNames(rootClassName || css.root, className);
    const uploadedFiles = uploadedFilesFromMessages(messages);

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
              showListingImage={showListingImage}
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
              showExtraInfo={allowShowingExtraInfo(stateData.showExtraInfo, transactionPartyInfo)}
              showPriceOnMobile={showPrice}
              price={listing?.attributes?.price}
              intl={intl}
              deliveryMethod={deliveryMethod}
              isPendingPayment={!!stateData.isPendingPayment}
              transactionRole={transactionRole}
              providerName={authorDisplayName}
              customerName={customerDisplayName}
              listingId={listing?.id?.uuid}
              listingTitle={listingTitle}
              listingDeleted={listingDeleted}
            />

            {requestQuote}
            {offer}
            {transactionFieldsComponent}

            {!isInquiryProcess ? (
              <div className={css.orderDetails}>
                <div className={css.orderDetailsMobileSection}>
                  {showBreakDown ? (
                    <BreakdownMaybe
                      orderBreakdown={orderBreakdown}
                      processName={stateData.processName}
                      priceVariantName={priceVariantName}
                    />
                  ) : null}
                  <DiminishedActionButtonMaybe
                    id="mobile_disputeOrderButton"
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
              activityFeed={activityFeed}
              isConversation={isInquiryProcess}
            />
            {showSendMessageForm ? (
              <>
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
                <input type="file" onChange={this.onFileUpload} />
                {fileUploadStatus === 'uploading' ? (
                  <p className={css.uploadStatus}>
                    <FormattedMessage id="TransactionPanel.uploadStatusUploading" />
                  </p>
                ) : null}
                {fileUploadStatus === 'verifying' ? (
                  <p className={css.uploadStatus}>
                    <FormattedMessage id="TransactionPanel.uploadStatusVerifying" />
                  </p>
                ) : null}
                {fileUploadStatus === 'success' ? (
                  <p className={css.uploadStatus}>
                    <FormattedMessage id="TransactionPanel.uploadStatusSuccess" />
                  </p>
                ) : null}
                {fileUploadStatus === 'failed' ? (
                  <p className={css.uploadStatusError}>
                    <FormattedMessage id="TransactionPanel.uploadStatusFailed" />
                  </p>
                ) : null}
              </>
            ) : (
              <div className={css.sendingMessageNotAllowed}>
                <FormattedMessage id="TransactionPanel.sendingMessageNotAllowed" />
              </div>
            )}

            {uploadedFiles.length > 0 ? (
              <div className={css.uploadedFilesSection}>
                <p className={css.sectionHeading}>
                  <FormattedMessage id="TransactionPanel.uploadedFilesHeading" />
                </p>
                <ul className={css.uploadedFilesList}>
                  {uploadedFiles.map(file => (
                    <li key={file.fileId} className={css.uploadedFileItem}>
                      <span className={css.uploadedFileName}>{file.fileName}</span>
                      <button
                        type="button"
                        className={css.uploadedFileDownloadButton}
                        onClick={() => this.onDownloadUploadedFile(file.fileId)}
                        disabled={fileDownloadInProgress}
                      >
                        <FormattedMessage id="TransactionPanel.downloadFile" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {stateData.showActionButtons ? (
              <>
                <div className={css.mobileActionButtonSpacer}></div>
                <div className={css.mobileActionButtons}>{actionButtons('mobile')}</div>
              </>
            ) : null}
          </div>

          <div className={css.asideDesktop}>
            <div
              className={classNames(css.stickySection, { [css.noListingImage]: !showListingImage })}
            >
              <div className={css.detailCard}>
                <DetailCardImage
                  avatarWrapperClassName={css.avatarWrapperDesktop}
                  listingTitle={listingTitle}
                  image={firstImage}
                  provider={provider}
                  isCustomer={isCustomer}
                  showListingImage={showListingImage}
                  listingImageConfig={config.layout.listingImage}
                />

                <DetailCardHeadingsMaybe
                  showDetailCardHeadings={showDetailCardHeadings}
                  showListingImage={showListingImage}
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
                {showBreakDown ? (
                  <BreakdownMaybe
                    className={css.breakdownContainer}
                    orderBreakdown={orderBreakdown}
                    processName={stateData.processName}
                    priceVariantName={priceVariantName}
                  />
                ) : null}

                {stateData.showActionButtons ? (
                  <div className={css.desktopActionButtons}>{actionButtons('desktop')}</div>
                ) : null}
              </div>
              <DiminishedActionButtonMaybe
                id="desktop_disputeOrderButton"
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
