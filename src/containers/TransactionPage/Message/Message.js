import React from 'react';

import { richText } from '../../../util/richText';
import { propTypes } from '../../../util/types';

import { Avatar } from '../../../components';

import css from '../ActivityFeed/ActivityFeed.module.css';

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

const FileLinks = props => {
  const { file, downloadFile } = props;
  return (
    <div className={css.fileLink} onClick={() => downloadFile(file.id)}>
      <span>|_|</span>
      <span>{file.file.attributes.name}</span>
    </div>
  );
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

  const { publicFiles = [] } = message;

  return (
    <div className={css.message}>
      <Avatar className={css.avatar} user={message.sender} />
      <div>
        <div className={css.messageContent}>
          {content}

          {publicFiles?.map(pf => (
            <FileLinks file={pf} key={pf.id.uuid} downloadFile={downloadFile} />
          ))}
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

  const { publicFiles = [] } = message;

  return (
    <div className={css.ownMessage}>
      <div className={css.ownMessageContentWrapper}>
        <div className={css.ownMessageContent}>
          {content}
          {publicFiles?.map(pf => (
            <FileLinks file={pf} key={pf.id.uuid} downloadFile={downloadFile} />
          ))}
        </div>
      </div>
      <p className={css.ownMessageDate}>{formattedDate}</p>
    </div>
  );
};
