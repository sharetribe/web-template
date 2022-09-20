import React from 'react';
import { string } from 'prop-types';

import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { propTypes, LINE_ITEM_CUSTOMER_COMMISSION } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemCustomerCommissionRefundMaybe = props => {
  const { lineItems, isCustomer, marketplaceName, intl } = props;

  const refund = lineItems.find(
    item => item.code === LINE_ITEM_CUSTOMER_COMMISSION && item.reversal
  );

  return isCustomer && refund ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.refundCustomerFee" values={{ marketplaceName }} />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, refund.lineTotal)}</span>
    </div>
  ) : null;
};

LineItemCustomerCommissionRefundMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  marketplaceName: string.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemCustomerCommissionRefundMaybe;
