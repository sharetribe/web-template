import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { propTypes } from '../../util/types';
import { resolveLatestProcessName, getProcess } from '../../transactions/transaction';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the total price as a line item.
 *
 * @component
 * @param {Object} props
 * @param {propTypes.transaction} props.transaction - The transaction to render
 * @param {boolean} props.isProvider - Whether the provider is the one receiving the commission
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemTotalPrice = props => {
  const { transaction, isProvider, intl } = props;
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  if (!processName) {
    return null;
  }
  const process = getProcess(processName);
  const isCompleted = process.isCompleted(transaction?.attributes?.lastTransition);
  const isRefunded = process.isRefunded(transaction?.attributes?.lastTransition);

  let providerTotalMessageId = 'OrderBreakdown.providerTotalDefault';
  if (isCompleted) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalReceived';
  } else if (isRefunded) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalRefunded';
  }

  const totalLabel = isProvider ? (
    <FormattedMessage id={providerTotalMessageId} />
  ) : (
    <FormattedMessage id="OrderBreakdown.total" />
  );

  const totalPrice = isProvider
    ? transaction.attributes.payoutTotal
    : transaction.attributes.payinTotal;
  const formattedTotalPrice = formatMoney(intl, totalPrice);

  return (
    <>
      <hr className={css.totalDivider} />
      <div className={css.lineItemTotal}>
        <div className={css.totalLabel}>{totalLabel}</div>
        <div className={css.totalPrice}>{formattedTotalPrice}</div>
      </div>
    </>
  );
};

export default LineItemTotalPrice;
