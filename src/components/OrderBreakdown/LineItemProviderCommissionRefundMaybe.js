import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { propTypes, LINE_ITEM_PROVIDER_COMMISSION } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemProviderCommissionRefundMaybe = props => {
  const { lineItems, isProvider, intl } = props;

  const refund = lineItems.find(
    item => item.code === LINE_ITEM_PROVIDER_COMMISSION && item.reversal
  );

  return isProvider && refund ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.refundProviderFee" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, refund.lineTotal)}</span>
    </div>
  ) : null;
};

LineItemProviderCommissionRefundMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemProviderCommissionRefundMaybe;
