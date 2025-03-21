import React from 'react';

import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { propTypes, LINE_ITEM_PROVIDER_COMMISSION } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the provider commission refund as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {boolean} props.isProvider - Whether the provider is the one receiving the commission
 * @param {string} props.marketplaceName - The name of the marketplace
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
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

export default LineItemProviderCommissionRefundMaybe;
