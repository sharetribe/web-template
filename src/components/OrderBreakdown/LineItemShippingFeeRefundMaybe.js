import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_SHIPPING_FEE, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemShippingFeeRefundMaybe = props => {
  const { transaction, intl } = props;

  const refund = transaction.attributes.lineItems.find(
    item => item.code === LINE_ITEM_SHIPPING_FEE && item.reversal
  );

  return refund ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.shippingFeeRefund" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, refund.lineTotal)}</span>
    </div>
  ) : null;
};

LineItemShippingFeeRefundMaybe.propTypes = {
  transaction: propTypes.transaction.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemShippingFeeRefundMaybe;
