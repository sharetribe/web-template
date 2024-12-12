import React from 'react';
import { intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { humanizeLineItemCode } from '../../util/data';
import { LINE_ITEMS, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * Renders non-reversal line items that are not listed in the
 * `LINE_ITEMS` array in util/types.js
 *
 * The line items are rendered so that the line item code is formatted to human
 * readable form and the line total is printed as price.
 *
 * If you require another kind of presentation for your line items, add them to
 * the `LINE_ITEMS` array in util/types.js and create a specific line item
 * component for them that can be used in the `OrderBreakdown` component.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {boolean} props.isProvider - Whether the provider is the one receiving the commission
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemUnknownItemsMaybe = props => {
  const { lineItems, isProvider, intl } = props;

  // resolve unknown non-reversal line items
  const allItems = lineItems.filter(item => LINE_ITEMS.indexOf(item.code) === -1 && !item.reversal);

  const items = isProvider
    ? allItems.filter(item => item.includeFor.includes('provider'))
    : allItems.filter(item => item.includeFor.includes('customer'));

  return items.length > 0 ? (
    <React.Fragment>
      {items.map((item, i) => {
        const quantity = item.quantity;

        const label =
          quantity && quantity > 1
            ? `${humanizeLineItemCode(item.code)} x ${quantity}`
            : humanizeLineItemCode(item.code);

        const formattedTotal = formatMoney(intl, item.lineTotal);
        return (
          <div key={`${i}-item.code`} className={css.lineItem}>
            <span className={css.itemLabel}>{label}</span>
            <span className={css.itemValue}>{formattedTotal}</span>
          </div>
        );
      })}
    </React.Fragment>
  ) : null;
};

export default LineItemUnknownItemsMaybe;
