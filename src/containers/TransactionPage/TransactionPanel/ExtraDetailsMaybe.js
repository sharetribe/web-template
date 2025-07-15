import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { richText } from '../../../util/richText';

import { Heading } from '../../../components';

import css from './TransactionPanel.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

// Functional component as a helper to build ActivityFeed section
const ExtraDetailsMaybe = props => {
  const {
    className,
    rootClassName,
    protectedData,
    msgKey,
    showExtraDetailsMessage,
    isOwnMessage,
  } = props;
  const classes = classNames(rootClassName || css.deliveryInfoContainer, className);
  const extraDetailsMsgClasses = isOwnMessage
    ? css.ownExtraDetailsMessage
    : css.extraDetailsMessage;
  const extraDetailsMsgLinkClassMaybe = isOwnMessage
    ? { linkClass: css.ownMessageContentLink }
    : {};
  const message = protectedData?.[msgKey];

  if (showExtraDetailsMessage && message) {
    const extraDetailsMessage = richText(protectedData?.[msgKey], {
      linkify: true,
      ...extraDetailsMsgLinkClassMaybe,
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
    });

    return (
      <div className={classes}>
        <Heading as="h3" rootClassName={css.sectionHeading}>
          <FormattedMessage id="TransactionPanel.extraDetailsMessageHeading" />
        </Heading>
        <p className={extraDetailsMsgClasses}>{extraDetailsMessage}</p>
      </div>
    );
  }
  return null;
};

export default ExtraDetailsMaybe;
