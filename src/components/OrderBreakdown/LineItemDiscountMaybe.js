import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import {
  LINE_ITEM_DISCOUNT,
  LINE_ITEM_DISCOUNT_25,
  LINE_ITEM_DISCOUNT_30,
  LINE_ITEM_DISCOUNT_40,
  propTypes,
} from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the discount as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemDiscountMaybe = props => {
  const { lineItems, intl } = props;

  // Find any discount line item
  const discountLineItem = lineItems.find(
    item =>
      (item.code === LINE_ITEM_DISCOUNT ||
        item.code === LINE_ITEM_DISCOUNT_25 ||
        item.code === LINE_ITEM_DISCOUNT_30 ||
        item.code === LINE_ITEM_DISCOUNT_40) &&
      !item.reversal
  );

  if (!discountLineItem) {
    return null;
  }

  // Extract discount percentage from the code or description
  let discountPercent = 0;
  if (discountLineItem.code === LINE_ITEM_DISCOUNT_25) {
    discountPercent = 25;
  } else if (discountLineItem.code === LINE_ITEM_DISCOUNT_30) {
    discountPercent = 30;
  } else if (discountLineItem.code === LINE_ITEM_DISCOUNT_40) {
    discountPercent = 40;
  } else if (discountLineItem.description) {
    // Try to extract percentage from description (e.g. "25% off")
    const match = discountLineItem.description.match(/(\d+)% off/);
    if (match) {
      discountPercent = parseInt(match[1], 10);
    }
  }

  return (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage
          id="OrderBreakdown.discount"
          values={{ percentage: discountPercent }}
        />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, discountLineItem.lineTotal)}</span>
    </div>
  );
};

LineItemDiscountMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemDiscountMaybe; 