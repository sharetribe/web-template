import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import {
  analyseFileName,
  calculateFileSize,
  messageHasPendingFiles,
  messageHasFailedFiles,
} from '../../../util/fileHelpers';
import { richText } from '../../../util/richText';
import { propTypes } from '../../../util/types';

import { Avatar } from '../../../components';

import css from './Message.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const IconDownload = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      d="M13.3333 10.6667C13.7015 10.6667 14 10.9651 14 11.3333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V11.3333C2 10.9651 2.29848 10.6667 2.66667 10.6667C3.03486 10.6667 3.33333 10.9651 3.33333 11.3333V12.3333C3.33333 12.5174 3.48257 12.6667 3.66667 12.6667H12.3333C12.5174 12.6667 12.6667 12.5174 12.6667 12.3333V11.3333C12.6667 10.9651 12.9651 10.6667 13.3333 10.6667Z"
      fill="currentColor"
    />
    <path
      d="M8 2C8.36817 2.00003 8.66667 2.29849 8.66667 2.66667V8.39062L10.1953 6.86198C10.4557 6.60166 10.8777 6.60164 11.138 6.86198C11.3983 7.12232 11.3983 7.54434 11.138 7.80469L8.47135 10.4714C8.21101 10.7317 7.789 10.7317 7.52865 10.4714L4.86198 7.80469C4.60163 7.54434 4.60163 7.12233 4.86198 6.86198C5.12233 6.60166 5.54435 6.60164 5.80469 6.86198L7.33333 8.39062V2.66667C7.33333 2.29848 7.63181 2 8 2Z"
      fill="currentColor"
    />
  </svg>
);

const IconUnavailable = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301ZM4.73051 12.2113C5.63367 12.9134 6.76746 13.333 8.00004 13.333C10.9456 13.333 13.3334 10.9452 13.3334 7.99967C13.3334 6.76709 12.9138 5.6333 12.2116 4.73014L4.73051 12.2113ZM8.00004 2.66634C5.05452 2.66634 2.66671 5.05416 2.66671 7.99967C2.66671 9.23193 3.08599 10.3655 3.7878 11.2686L11.2689 3.78744C10.3659 3.08562 9.2323 2.66634 8.00004 2.66634Z"
      fill="currentColor"
    />
  </svg>
);

const IconSpinnerSmall = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      d="M13.3334 7.99966C13.3334 6.94482 13.0203 5.91382 12.4343 5.03676C11.8483 4.15974 11.0155 3.47623 10.041 3.07256C9.06655 2.66891 7.99417 2.56278 6.95966 2.76852C5.92509 2.97431 4.97441 3.48228 4.22853 4.22816C3.48265 4.97405 2.97468 5.92472 2.76889 6.95929C2.56315 7.99381 2.66928 9.06619 3.07293 10.0407C3.4766 11.0152 4.16011 11.8479 5.03713 12.4339C5.91419 13.0199 6.94519 13.333 8.00002 13.333C8.36821 13.333 8.66669 13.6315 8.66669 13.9997C8.66669 14.3679 8.36821 14.6663 8.00002 14.6663C6.68148 14.6663 5.39257 14.2752 4.29624 13.5426C3.19996 12.8101 2.34508 11.7692 1.8405 10.5511C1.33592 9.33292 1.20436 7.99208 1.4616 6.69887C1.71886 5.40574 2.35352 4.21776 3.28582 3.28545C4.21812 2.35315 5.40611 1.71849 6.69924 1.46123C7.99245 1.20399 9.33329 1.33555 10.5515 1.84014C11.7696 2.34472 12.8105 3.19959 13.543 4.29587C14.2756 5.3922 14.6667 6.68111 14.6667 7.99966C14.6667 8.36785 14.3682 8.66633 14 8.66633C13.6318 8.66633 13.3334 8.36785 13.3334 7.99966Z"
      fill="currentColor"
    />
  </svg>
);

const IconErrorSmall = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="none"
  >
    <path
      d="M8.00004 9.99967C8.36823 9.99967 8.66671 10.2982 8.66671 10.6663C8.66671 11.0345 8.36823 11.333 8.00004 11.333C7.63185 11.333 7.33337 11.0345 7.33337 10.6663C7.33337 10.2982 7.63185 9.99967 8.00004 9.99967Z"
      fill="currentColor"
    />
    <path
      d="M8.00004 4.66634C8.36823 4.66634 8.66671 4.96482 8.66671 5.33301V8.33301C8.66671 8.7012 8.36823 8.99967 8.00004 8.99967C7.63185 8.99967 7.33337 8.7012 7.33337 8.33301V5.33301C7.33337 4.96482 7.63185 4.66634 8.00004 4.66634Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.00004 1.33301C11.6819 1.33301 14.6667 4.31778 14.6667 7.99967C14.6667 11.6816 11.6819 14.6663 8.00004 14.6663C4.31814 14.6663 1.33337 11.6816 1.33337 7.99967C1.33337 4.31778 4.31814 1.33301 8.00004 1.33301ZM8.00004 2.66634C5.05452 2.66634 2.66671 5.05416 2.66671 7.99967C2.66671 10.9452 5.05452 13.333 8.00004 13.333C10.9456 13.333 13.3334 10.9452 13.3334 7.99967C13.3334 5.05416 10.9456 2.66634 8.00004 2.66634Z"
      fill="currentColor"
    />
  </svg>
);

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

const FileAttachment = props => {
  const { fileAttachment, downloadFile, intl } = props;
  const { file } = fileAttachment;
  const isAvailable = file.attributes.state === 'available' && fileAttachment.file;
  const isVerifying = file.attributes.state === 'pendingVerification';
  const isVerificationFailed = file.attributes.state === 'verificationFailed';
  // TODO double check deletion conditions from file attribute when deletion implemented in Core!
  const isDeleted = !file || file.attributes.deleted;

  const name = file?.attributes?.name;
  // File name truncates on overflow, extension should be displayed when possible
  const { baseName, extension } = analyseFileName(name);

  const rootClass = classNames(css.fileAttachment, isAvailable && css.fileAttachmentAvailable);

  if (isAvailable) {
    const { size, unit } = calculateFileSize(file.attributes.size);
    return (
      <div className={rootClass} onClick={() => downloadFile(fileAttachment.id)}>
        <span
          role="img"
          aria-label={intl.formatMessage({ id: 'Message.downloadFile' })}
          className={css.fileAttachmentIcon}
        >
          <IconDownload />
        </span>
        <span className={css.fileAttachmentName}>
          <span className={css.fileAttachmentBaseName}>{baseName}</span>
          {extension ? <span className={css.fileAttachmentExtension}>{extension}</span> : null}
        </span>
        <span className={css.fileAttachmentStatus}>
          {size} {unit}
        </span>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className={rootClass}>
        <span
          role="img"
          aria-label={intl.formatMessage({ id: 'Message.fileVerifying' })}
          className={css.fileAttachmentIcon}
        >
          <IconSpinnerSmall />
        </span>
        <span className={css.fileAttachmentName}>
          <span className={css.fileAttachmentBaseName}>{baseName}</span>
          {extension ? <span className={css.fileAttachmentExtension}>{extension}</span> : null}
        </span>
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileVerifying" />
        </span>
      </div>
    );
  }

  if (isVerificationFailed) {
    return (
      <div className={rootClass}>
        <span
          role="img"
          aria-label={intl.formatMessage({ id: 'Message.fileSecurityCheckFailed' })}
          className={css.fileAttachmentIcon}
        >
          <IconErrorSmall />
        </span>
        <span className={css.fileAttachmentName}>
          <span className={css.fileAttachmentBaseName}>{baseName}</span>
          {extension ? <span className={css.fileAttachmentExtension}>{extension}</span> : null}
        </span>
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileSecurityCheckFailed" />
        </span>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className={rootClass}>
        <span
          role="img"
          aria-label={intl.formatMessage({ id: 'Message.fileDeleted' })}
          className={css.fileAttachmentIcon}
        >
          <IconUnavailable />
        </span>
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileDeleted" />
        </span>
      </div>
    );
  }

  return null;
};

/**
 * @component
 * @param {Object} props - The props
 * @param {propTypes.message} props.message - The message
 * @param {string} props.formattedDate - The formatted date
 * @returns {JSX.Element} The Message component
 */
export const Message = props => {
  const { message, formattedDate, transaction, intl, allowFiles, downloadFile } = props;

  const content = getMessageContent(message, transaction, intl);

  const hasPendingFiles = messageHasPendingFiles(message);
  const hasFailedFiles = messageHasFailedFiles(message);

  if (hasPendingFiles || hasFailedFiles) {
    return null;
  }

  const { publicFiles = [] } = message;

  return (
    <div className={css.message}>
      <Avatar className={css.avatar} user={message.sender} />
      <div>
        <div className={css.messageContent}>
          {content}
          {publicFiles.length > 0 ? (
            <div className={css.fileAttachmentsContainer}>
              {allowFiles
                ? publicFiles.map(f => (
                    <FileAttachment
                      fileAttachment={f}
                      key={f.id.uuid}
                      downloadFile={downloadFile}
                      intl={intl}
                    />
                  ))
                : null}
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
 * @returns {JSX.Element} The OwnMessage component
 */
export const OwnMessage = props => {
  const { message, formattedDate, transaction, intl, allowFiles, downloadFile } = props;

  const hasPendingFiles = messageHasPendingFiles(message);
  const hasFailedFiles = messageHasFailedFiles(message);

  // Grey bubble while files are still verifying or have failed; purple once all verified.
  const isUnverified = hasPendingFiles || hasFailedFiles;

  const content = getMessageContent(message, transaction, intl, {
    linkClass: isUnverified ? undefined : css.ownMessageContentLink,
  });

  const { publicFiles = [] } = message;

  const bubbleClass = classNames(
    css.ownMessageContent,
    isUnverified && css.ownMessageContentUnverified
  );

  return (
    <div className={css.ownMessage}>
      <div className={css.ownMessageContentWrapper}>
        <div className={bubbleClass}>
          {content}
          {publicFiles.length > 0 ? (
            <div className={css.fileAttachmentsContainer}>
              {allowFiles
                ? publicFiles.map(f => (
                    <FileAttachment
                      fileAttachment={f}
                      key={f.id.uuid}
                      downloadFile={downloadFile}
                      intl={intl}
                    />
                  ))
                : null}
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
