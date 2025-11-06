import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { getProcess, resolveLatestProcessName } from '../../../transactions/transaction';

import { Heading } from '../../../components';

import TextMaybe from '../TextMaybe/TextMaybe';
import css from './RequestQuote.module.css';

// Functional component as a helper to build ActivityFeed section
const RequestQuote = props => {
  const {
    className,
    rootClassName,
    transaction,
    transactionRole,
    isNegotiationProcess,
    intl,
  } = props;

  if (!isNegotiationProcess) {
    return null;
  }

  const isCustomer = transactionRole === 'customer';
  const protectedData = transaction?.attributes?.protectedData;
  const customerDefaultMessage = protectedData?.customerDefaultMessage;

  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  let process = null;
  try {
    process = processName ? getProcess(processName) : null;
  } catch (error) {
    // Process was not recognized!
    return null;
  }

  const classes = classNames(rootClassName || css.container, className);
  return customerDefaultMessage ? (
    <div className={classes}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="TransactionPage.RequestQuote.heading" />
      </Heading>

      <TextMaybe
        heading={intl.formatMessage({
          id: 'TransactionPage.RequestQuote.customerDefaultMessageLabel',
        })}
        headingClassName={css.defaultMessageLabel}
        text={customerDefaultMessage}
        isOwn={isNegotiationProcess && isCustomer}
        showText={isNegotiationProcess}
      />
    </div>
  ) : null;
};

export default RequestQuote;
