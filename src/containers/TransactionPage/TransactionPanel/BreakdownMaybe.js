import React from 'react';
import classNames from 'classnames';

import config from '../../../config';
import { DATE_TYPE_DATE } from '../../../util/types';

import { OrderBreakdown } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build OrderBreakdown
const BreakdownMaybe = props => {
  const { className, rootClassName, breakdownClassName, transaction, transactionRole } = props;
  const loaded = transaction?.id && transaction.attributes.lineItems?.length > 0;

  const classes = classNames(rootClassName || css.breakdownMaybe, className);
  const breakdownClasses = classNames(breakdownClassName || css.breakdown);

  const txBookingMaybe = transaction.booking?.id
    ? { booking: ensureBooking(transaction.booking), dateType: DATE_TYPE_DATE }
    : {};

  return loaded ? (
    <div className={classes}>
      <OrderBreakdown
        className={breakdownClasses}
        userRole={transactionRole}
        unitType={config.lineItemUnitType}
        transaction={transaction}
        {...txBookingMaybe}
      />
    </div>
  ) : null;
};

export default BreakdownMaybe;
