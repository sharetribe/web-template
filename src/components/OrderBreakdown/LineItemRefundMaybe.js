import React from 'react';
import Decimal from 'decimal.js';

import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  propTypes,
  LINE_ITEM_CUSTOMER_COMMISSION,
  LINE_ITEM_PROVIDER_COMMISSION,
} from '../../util/types';

import css from './OrderBreakdown.module.css';

const { Money } = sdkTypes;

/**
 * Calculates the total price in sub units for multiple line items.
 */
const lineItemsTotal = (lineItems, marketplaceCurrency) => {
  const amount = lineItems.reduce((total, item) => {
    return total.plus(item.lineTotal.amount);
  }, new Decimal(0));
  const currency = lineItems[0] ? lineItems[0].lineTotal.currency : marketplaceCurrency;
  return new Money(amount, currency);
};

/**
 * Checks if line item represents commission
 */
const isCommission = lineItem => {
  return (
    lineItem.code === LINE_ITEM_PROVIDER_COMMISSION ||
    lineItem.code === LINE_ITEM_CUSTOMER_COMMISSION
  );
};

/**
 * Returns non-commission, reversal line items
 */
const nonCommissionReversalLineItems = lineItems => {
  return lineItems.filter(item => !isCommission(item) && item.reversal);
};

/**
 * A component that renders the refund as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemRefundMaybe = props => {
  const { lineItems, intl, marketplaceCurrency } = props;

  // all non-commission, reversal line items
  const refundLineItems = nonCommissionReversalLineItems(lineItems);

  const refund = lineItemsTotal(refundLineItems, marketplaceCurrency);

  const formattedRefund = refundLineItems.length > 0 ? formatMoney(intl, refund) : null;

  return formattedRefund ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.refund" />
      </span>
      <span className={css.itemValue}>{formattedRefund}</span>
    </div>
  ) : null;
};

export default LineItemRefundMaybe;
