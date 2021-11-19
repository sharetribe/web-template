import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build OrderBreakdown
const BreakdownMaybe = props => {
  const { className, rootClassName, orderBreakdown } = props;
  const classes = classNames(rootClassName || css.breakdownMaybe, className);

  return orderBreakdown ? (
    <div className={classes}>
      <h3 className={css.orderBreakdownTitle}>
        <FormattedMessage id="TransactionPanel.orderBreakdownTitle" />
      </h3>
      {orderBreakdown}
    </div>
  ) : null;
};

export default BreakdownMaybe;
