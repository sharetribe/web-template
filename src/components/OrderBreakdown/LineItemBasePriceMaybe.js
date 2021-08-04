import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemBasePriceMaybe = props => {
  const { lineItems, unitType, intl } = props;
  const isNightly = unitType === LINE_ITEM_NIGHT;
  const isDaily = unitType === LINE_ITEM_DAY;
  const translationKey = isNightly
    ? 'OrderBreakdown.baseUnitNight'
    : isDaily
    ? 'OrderBreakdown.baseUnitDay'
    : 'OrderBreakdown.baseUnitQuantity';

  // Find correct line-item for given unitType prop.
  // It should be one of the following: 'line-item/night, 'line-item/day', 'line-item/units', or 'line-item/time'
  // These are defined in '../../util/types';
  const unitPurchase = lineItems.find(item => item.code === unitType && !item.reversal);

  const quantity = unitPurchase ? unitPurchase.quantity.toString() : null;
  const unitPrice = unitPurchase ? formatMoney(intl, unitPurchase.unitPrice) : null;
  const total = unitPurchase ? formatMoney(intl, unitPurchase.lineTotal) : null;

  return quantity && total ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id={translationKey} values={{ unitPrice, quantity }} />
      </span>
      <span className={css.itemValue}>{total}</span>
    </div>
  ) : null;
};

LineItemBasePriceMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  unitType: propTypes.lineItemUnitType.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemBasePriceMaybe;
