import React from 'react';
import { bool } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { txIsCanceled, txIsReceived, txIsCompleted } from '../../util/transaction';
import { propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemTotalPrice = props => {
  const { transaction, isProvider, intl } = props;

  let providerTotalMessageId = 'OrderBreakdown.providerTotalDefault';
  if (txIsReceived(transaction) || txIsCompleted(transaction)) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalReceived';
  } else if (txIsCanceled(transaction)) {
    providerTotalMessageId = 'OrderBreakdown.providerTotalCanceled';
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

LineItemTotalPrice.propTypes = {
  transaction: propTypes.transaction.isRequired,
  isProvider: bool.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemTotalPrice;
