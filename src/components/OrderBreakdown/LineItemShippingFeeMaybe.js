import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_SHIPPING_FEE, propTypes } from '../../util/types';

import css from './BookingBreakdown.module.css';

const LineItemShippingFeeMaybe = props => {
  const { transaction, intl } = props;

  const shippingFeeLineItem = transaction.attributes.lineItems.find(
    item => item.code === LINE_ITEM_SHIPPING_FEE && !item.reversal
  );

  return shippingFeeLineItem ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="BookingBreakdown.shippingFee" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, shippingFeeLineItem.lineTotal)}</span>
    </div>
  ) : null;
};

LineItemShippingFeeMaybe.propTypes = {
  transaction: propTypes.transaction.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemShippingFeeMaybe;
