import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import {
  LINE_ITEM_DAY,
  LINE_ITEM_FIXED,
  LINE_ITEM_HOUR,
  LINE_ITEM_NIGHT,
  propTypes,
} from '../../util/types';
import Decimal from 'decimal.js';
import { types as sdkTypes } from '../../util/sdkLoader';

import css from './OrderBreakdown.module.css';

const { Money } = sdkTypes;

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
  const isFixed = code === LINE_ITEM_FIXED;

  const translationKey = isNightly
    ? 'OrderBreakdown.baseUnitNight'
    : isDaily
    ? 'OrderBreakdown.baseUnitDay'
    : isHourly
    ? 'OrderBreakdown.baseUnitHour'
    : isFixed
    ? 'OrderBreakdown.baseUnitFixedBooking'
    : 'OrderBreakdown.baseUnitQuantity';

  // Find the relevant line item
  const unitPurchase = lineItems.find(item => item.code === code && !item.reversal);

  const quantity = unitPurchase?.units
    ? unitPurchase.units.toString()
    : unitPurchase?.quantity
    ? unitPurchase.quantity.toString()
    : null;

    let unitPrice;
    if (unitPurchase && quantity) {
      const totalSubunits = unitPurchase.lineTotal.amount; // this is already in cents
      const quantityNum = new Decimal(quantity);
    
      const perUnitSubunits = new Decimal(totalSubunits)
        .dividedBy(quantityNum)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP) // cents, no need to convert again
        .toNumber();
    
      const perUnitMoney = new Money(perUnitSubunits, unitPurchase.lineTotal.currency);
      unitPrice = formatMoney(intl, perUnitMoney);
    } else {
      unitPrice = unitPurchase ? formatMoney(intl, unitPurchase.unitPrice) : null;
    }
    






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
