import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { richText } from '../../../util/richText';

import { Heading } from '../../../components';

import css from './TransactionPanel.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

// Functional component as a helper to build ActivityFeed section
const InquiryMessageMaybe = props => {
  const { className, rootClassName, protectedData, showInquiryMessage, isCustomer } = props;
  const classes = classNames(rootClassName || css.deliveryInfoContainer, className);
  const inquiryMsgClasses = isCustomer ? css.ownInquiryMessage : css.inquiryMessage;
  const inquiryMsgLinkClassMaybe = isCustomer ? { linkClass: css.ownMessageContentLink } : {};

  if (showInquiryMessage) {
    const inquiryMessage = richText(protectedData?.inquiryMessage, {
      linkify: true,
      ...inquiryMsgLinkClassMaybe,
      longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
      longWordClass: css.longWord,
    });

    return (
      <div className={classes}>
        <Heading as="h3" rootClassName={css.sectionHeading}>
          <FormattedMessage id="TransactionPanel.inquiryMessageHeading" />
        </Heading>
        <p className={inquiryMsgClasses}>{inquiryMessage}</p>
      </div>
    );
  }
  return null;
};

export default InquiryMessageMaybe;
