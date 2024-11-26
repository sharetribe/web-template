import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { H6 } from '../../../components';

import css from './TransactionPanel.module.css';

function BreakdownMaybe(props) {
  const { className, rootClassName, orderBreakdown, processName, processState, transactionRole } =
    props;
  const classes = classNames(rootClassName || css.breakdownMaybe, className);

  if (processState === 'preauthorized-gift' || processState === 'accept-gift') {
    return (
      <div className={classes}>

        <H6 as="h3" className={css.orderBreakdownTitle} style={{ marginBottom: '50px' }}>

          <FormattedMessage
            id="TransactionPanel.preauthorizedGift.paidWithBuonoTitle"
            defaultMessage="Pagato con Gift Card"
          />
        </H6>

      </div>
    );
  }

  if (processState === 'accepted-gift' && transactionRole === 'provider') {
    return (
      <div className={classes}>
        <H6 as="h3" className={css.orderBreakdownTitle}>
          <FormattedMessage id={`TransactionPanel.${processName}.orderBreakdownTitle`} />
          <FormattedMessage
            id="TransactionPanel.preauthorizedGift.paidWithBuonoTitle"
            defaultMessage="Pagato con buono ti verrà accreditato a fine mese"
          />
        </H6>
        <hr className={css.totalDivider} />
        {orderBreakdown}
      </div>
    );
  }

  if (processState === 'accepted-gift') {
    return (
      <div className={classes}>

        <H6 as="h3" className={css.orderBreakdownTitle} style={{ marginBottom: '50px' }}>
          "Pagato con Gift dard"

        </H6>
        <hr className={css.totalDivider} />
      </div>
    );
  }

  return orderBreakdown ? (
    <div className={classes}>
      <H6 as="h3" className={css.orderBreakdownTitle}>
        <FormattedMessage id={`TransactionPanel.${processName}.orderBreakdownTitle`} />
      </H6>
      <hr className={css.totalDivider} />
      {orderBreakdown}
    </div>
  ) : null;
}

export default BreakdownMaybe;