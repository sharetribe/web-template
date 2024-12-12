import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY, propTypes, LINE_ITEM_HOUR } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the base price as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {propTypes.lineItemUnitType} props.code - The code of the line item
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemBasePriceMaybe = props => {
  const { lineItems, code, intl } = props;
  const isNightly = code === LINE_ITEM_NIGHT;
  const isDaily = code === LINE_ITEM_DAY;
  const isHourly = code === LINE_ITEM_HOUR;
  const translationKey = isNightly
    ? 'OrderBreakdown.baseUnitNight'
    : isDaily
    ? 'OrderBreakdown.baseUnitDay'
    : isHourly
    ? 'OrderBreakdown.baseUnitHour'
    : 'OrderBreakdown.baseUnitQuantity';

  // Find correct line-item for given code prop.
  // It should be one of the following: 'line-item/night, 'line-item/day', 'line-item/hour', or 'line-item/item'
  // These are defined in '../../util/types';
  const unitPurchase = lineItems.find(item => item.code === code && !item.reversal);

  const quantity = unitPurchase?.units
    ? unitPurchase.units.toString()
    : unitPurchase?.quantity
    ? unitPurchase.quantity.toString()
    : null;
  const unitPrice = unitPurchase ? formatMoney(intl, unitPurchase.unitPrice) : null;
  const total = unitPurchase ? formatMoney(intl, unitPurchase.lineTotal) : null;

  const message = unitPurchase?.seats ? (
    <FormattedMessage
      id={`${translationKey}Seats`}
      values={{ unitPrice, quantity, seats: unitPurchase.seats }}
    />
  ) : (
    <FormattedMessage id={translationKey} values={{ unitPrice, quantity }} />
  );

  return quantity && total ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>{message}</span>
      <span className={css.itemValue}>{total}</span>
    </div>
  ) : null;
};

export default LineItemBasePriceMaybe;
