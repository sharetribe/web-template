import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { messageHasPendingFiles, messageHasFailedFiles } from '../../../util/fileHelpers';
import { richText } from '../../../util/richText';
import { propTypes } from '../../../util/types';

import { Avatar } from '../../../components';

import { FileAttachmentList } from '../FileAttachments/FileAttachments';

import css from './Message.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

/**
 * Formats the content and format of the message for display. Replaces message content
 * with a marketplace text item if the sender is banned.
 * @param {Object} message The message to format
 * @param {Object} transaction The transaction where the message was sent
 * @param {Object} intl Intl
 * @returns A rich text version of the message content
 */
const getMessageContent = (message, transaction, intl, richTextOptions = {}) => {
  const { customer, provider } = transaction;
  const customerBannedUuid = customer?.attributes.banned ? customer?.id.uuid : '';
  const providerBannedUuid = provider?.attributes.banned ? provider?.id.uuid : '';

  const isBannedSender = [customerBannedUuid, providerBannedUuid].includes(message.sender.id.uuid);
  const content = isBannedSender
    ? intl.formatMessage({
        id: 'TransactionPage.messageSenderBanned',
      })
    : message.attributes.content;

  return richText(content, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
    ...richTextOptions,
  });
};

/**
 * @component
 * @param {Object} props - The props
 * @param {propTypes.message} props.message - The message
 * @param {string} props.formattedDate - The formatted date
 * @param {Object} props.transaction - The transaction
 * @param {Object} props.intl - The intl object
 * @param {boolean} props.allowFiles - Whether file downloads are allowed at the marketplace level
 * @param {Function} props.downloadFile - The download file handler
 * @param {Object} [props.fileDownloads] - Map of file attachment uuid to download state
 * @param {string} props.marketplaceName - The marketplace name used in the disabled-files error
 * @returns {JSX.Element} The Message component
 */
export const Message = props => {
  const {
    message,
    formattedDate,
    transaction,
    intl,
    allowFiles,
    downloadFile,
    fileDownloads,
    marketplaceName,
  } = props;

  const content = getMessageContent(message, transaction, intl);

  const hasPendingFiles = messageHasPendingFiles(message);
  const hasFailedFiles = messageHasFailedFiles(message);

  if (hasPendingFiles || hasFailedFiles) {
    return null;
  }

  const { publicFileAttachments = [] } = message;

  return (
    <div className={css.message}>
      <Avatar className={css.avatar} user={message.sender} />
      <div className={css.messageContentWrapper}>
        <div className={css.messageContent}>
          {content}
          {publicFileAttachments.length > 0 ? (
            <div className={css.fileAttachmentsContainer}>
              <FileAttachmentList
                fileAttachments={publicFileAttachments}
                allowFiles={allowFiles}
                onDownloadFile={downloadFile}
                intl={intl}
                marketplaceName={marketplaceName}
                iconClassName={css.fileAttachmentIconMessage}
                fileDownloads={fileDownloads}
              />
            </div>
          ) : null}
        </div>
        <p className={css.messageDate}>{formattedDate}</p>
      </div>
    </div>
  );
};

/**
 * @component
 * @param {Object} props - The props
 * @param {propTypes.message} props.message - The message
 * @param {string} props.formattedDate - The formatted date
 * @param {Object} props.transaction - The transaction
 * @param {Object} props.intl - The intl object
 * @param {boolean} props.allowFiles - Whether file downloads are allowed at the marketplace level
 * @param {Function} props.downloadFile - The download file handler
 * @param {Object} [props.fileDownloads] - Map of file attachment uuid to download state
 * @param {string} props.marketplaceName - The marketplace name used in the disabled-files error
 * @returns {JSX.Element} The OwnMessage component
 */
export const OwnMessage = props => {
  const {
    message,
    formattedDate,
    transaction,
    intl,
    allowFiles,
    downloadFile,
    fileDownloads,
    marketplaceName,
  } = props;

  const hasPendingFiles = messageHasPendingFiles(message);
  const hasFailedFiles = messageHasFailedFiles(message);

  // Grey bubble while files are still verifying or have failed; purple once all verified.
  const isUnverified = hasPendingFiles || hasFailedFiles;

  const content = getMessageContent(message, transaction, intl, {
    linkClass: isUnverified ? undefined : css.ownMessageContentLink,
  });

  const { publicFileAttachments = [] } = message;

  const bubbleClass = classNames(css.ownMessageContent, {
    [css.ownMessageContentUnverified]: isUnverified,
  });

  return (
    <div className={css.ownMessage}>
      <div className={css.ownMessageContentWrapper}>
        <div className={bubbleClass}>
          {content}
          {publicFileAttachments.length > 0 ? (
            <div className={css.fileAttachmentsContainer}>
              <FileAttachmentList
                fileAttachments={publicFileAttachments}
                allowFiles={allowFiles}
                onDownloadFile={downloadFile}
                intl={intl}
                marketplaceName={marketplaceName}
                iconClassName={
                  isUnverified
                    ? css.fileAttachmentIconOwnMessageUnverified
                    : css.fileAttachmentIconOwnMessage
                }
                fileDownloads={fileDownloads}
              />
            </div>
          ) : null}
        </div>
      </div>
      {hasPendingFiles ? (
        <p className={css.pendingVerificationNote}>
          <FormattedMessage id="Message.pendingVerificationNote" />
        </p>
      ) : hasFailedFiles ? (
        <p className={css.securityCheckFailedNote}>
          <FormattedMessage id="Message.securityCheckFailedNote" />
        </p>
      ) : null}
      <p className={css.ownMessageDate}>{formattedDate}</p>
    </div>
  );
};
