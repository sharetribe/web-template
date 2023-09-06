import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { Heading } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActivityFeed section
const InquiryMessageMaybe = props => {
  const { className, rootClassName, protectedData, showInquiryMessage, isCustomer } = props;
  const classes = classNames(rootClassName || css.deliveryInfoContainer, className);
  const inquiryMsgClasses = isCustomer ? css.ownInquiryMessage : css.inquiryMessage;

  if (showInquiryMessage) {
    return (
      <div className={classes}>
        <Heading as="h3" rootClassName={css.sectionHeading}>
          <FormattedMessage id="TransactionPanel.inquiryMessageHeading" />
        </Heading>
        <p className={inquiryMsgClasses}>{protectedData?.inquiryMessage}</p>
      </div>
    );
  }
  return null;
};

export default InquiryMessageMaybe;
