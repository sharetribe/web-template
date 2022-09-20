import React from 'react';
import { string } from 'prop-types';

import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { propTypes, LINE_ITEM_PROVIDER_COMMISSION } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemProviderCommissionRefundMaybe = props => {
  const { lineItems, isProvider, marketplaceName, intl } = props;

  const refund = lineItems.find(
    item => item.code === LINE_ITEM_PROVIDER_COMMISSION && item.reversal
  );

  return isProvider && refund ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.refundProviderFee" values={{ marketplaceName }} />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, refund.lineTotal)}</span>
    </div>
  ) : null;
};

LineItemProviderCommissionRefundMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  marketplaceName: string.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemProviderCommissionRefundMaybe;
