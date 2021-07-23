import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { LINE_ITEM_UNITS, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemUnitsMaybe = props => {
  const { transaction, unitType } = props;

  if (unitType !== LINE_ITEM_UNITS) {
    return null;
  }

  const unitPurchase = transaction.attributes.lineItems.find(
    item => item.code === unitType && !item.reversal
  );

  if (!unitPurchase) {
    throw new Error(`LineItemUnitsMaybe: lineItem (${unitType}) missing`);
  }

  const quantity = unitPurchase.quantity;

  return (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.quantityUnit" />
      </span>
      <span className={css.itemValue}>
        <FormattedMessage id="OrderBreakdown.quantity" values={{ quantity }} />
      </span>
    </div>
  );
};

LineItemUnitsMaybe.propTypes = {
  transaction: propTypes.transaction.isRequired,
  unitType: propTypes.lineItemUnitType.isRequired,
};

export default LineItemUnitsMaybe;
