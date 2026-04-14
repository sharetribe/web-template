import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { calculateFileSize } from '../../../util/fileHelpers';
import { richText } from '../../../util/richText';
import { propTypes } from '../../../util/types';

import { Avatar } from '../../../components';

import { IconDownload } from './IconDownload';
import { IconUnavailable } from './IconUnavailable';
import { IconSpinnerSmall } from './IconSpinnerSmall';
import { IconErrorSmall } from './IconErrorSmall';

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

const FileAttachment = props => {
  const { fileAttachment, downloadFile, intl } = props;
  const { file } = fileAttachment;
  const isAvailable = file.attributes.state === 'available' && fileAttachment.file;
  const isVerifying = file.attributes.state === 'pendingVerification';
  const isVerificationFailed = file.attributes.state === 'verificationFailed';
  const isDeleted = !file || file.attributes.deleted;

  const name = file?.attributes?.name;

  const rootClass = classNames(css.fileAttachment, isAvailable && css.fileAttachmentAvailable);

  if (isAvailable) {
    const { size, unit } = calculateFileSize(file.attributes.size);
    return (
      <button
        className={rootClass}
        aria-label={intl.formatMessage({ id: 'Message.downloadFile' }, { fileName: name })}
        onClick={() => downloadFile(fileAttachment.id)}
      >
        <span className={css.fileAttachmentIcon}>
          <IconDownload />
        </span>
        <span className={css.fileAttachmentName}>{name}</span>
        <span className={css.fileAttachmentStatus}>
          {size} {unit}
        </span>
      </button>
    );
  }

  if (isVerifying) {
    return (
      <div className={rootClass}>
        <span className={css.fileAttachmentIcon}>
          <IconSpinnerSmall />
        </span>
        <span className={css.fileAttachmentName}>{name}</span>
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileVerifying" />
        </span>
      </div>
    );
  }

  if (isVerificationFailed) {
    return (
      <div className={rootClass}>
        <span className={css.fileAttachmentIcon}>
          <IconErrorSmall />
        </span>
        <span className={css.fileAttachmentName}>{name}</span>
        <span className={css.fileAttachmentStatus}>
          <FormattedMessage id="Message.fileSecurityCheckFailed" />
        </span>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className={rootClass}>
        <span className={css.fileAttachmentIcon}>
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
  const { message, formattedDate, transaction, intl, downloadFile } = props;
  const content = getMessageContent(message, transaction, intl);

  const { publicFileAttachments = [] } = message;

  return (
    <div className={css.message}>
      <Avatar className={css.avatar} user={message.sender} />
      <div>
        <div className={css.messageContent}>
          {content}
          {publicFileAttachments.length > 0 ? (
            <div className={css.fileAttachmentsContainer}>
              {publicFileAttachments.map(f => (
                <FileAttachment
                  fileAttachment={f}
                  key={f.id.uuid}
                  downloadFile={downloadFile}
                  intl={intl}
                />
              ))}
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
  const { message, formattedDate, transaction, intl, downloadFile } = props;
  const content = getMessageContent(message, transaction, intl, {
    linkClass: css.ownMessageContentLink,
  });

  const { publicFileAttachments = [] } = message;
  const hasVerifyingFile = publicFileAttachments.some(
    f => f.file.attributes.state === 'pendingVerification'
  );

  return (
    <div className={css.ownMessage}>
      <div className={css.ownMessageContentWrapper}>
        <div className={css.ownMessageContent}>
          {content}
          {publicFileAttachments.length > 0 ? (
            <div className={css.fileAttachmentsContainer}>
              {publicFileAttachments.map(f => (
                <FileAttachment
                  fileAttachment={f}
                  key={f.id.uuid}
                  downloadFile={downloadFile}
                  intl={intl}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {hasVerifyingFile ? (
        <p className={css.pendingVerificationNote}>
          <FormattedMessage id="Message.pendingVerificationNote" />
        </p>
      ) : null}
      <p className={css.ownMessageDate}>{formattedDate}</p>
    </div>
  );
};
