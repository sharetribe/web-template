import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_PICKUP_FEE, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

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

LineItemPickupFeeMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemPickupFeeMaybe;
