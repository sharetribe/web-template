import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_PICKUP_FEE, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the pickup fee as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemPickupFeeMaybe = props => {
  const { lineItems, intl } = props;

  const pickupFeeLineItem = lineItems.find(
    item => item.code === LINE_ITEM_PICKUP_FEE && !item.reversal
  );

  return pickupFeeLineItem ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.pickupFee" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, pickupFeeLineItem.lineTotal)}</span>
    </div>
  ) : null;
};

export default LineItemPickupFeeMaybe;
