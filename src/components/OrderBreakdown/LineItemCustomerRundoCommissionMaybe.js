import React from 'react';
import { bool, string } from 'prop-types';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { LINE_ITEM_CUSTOMER_COMMISSION, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const { Money } = sdkTypes;

// Validate the assumption that the commission exists and the amount
// is zero or positive.
const isValidCommission = commissionLineItem => {
  return (
    commissionLineItem &&
    commissionLineItem.lineTotal instanceof Money &&
    commissionLineItem.lineTotal.amount >= 0
  );
};

const LineItemCustomerCommissionMaybe = props => {
  const { lineItems, isCustomer, marketplaceName, intl } = props;

  const customerCommissionLineItem = lineItems.find(
    item => item.code === LINE_ITEM_CUSTOMER_COMMISSION && !item.reversal
  );

  // If commission is passed it will be shown as a fee already reduces from the total price
  let commissionItem = null;

  if (isCustomer && customerCommissionLineItem) {
    if (!isValidCommission(customerCommissionLineItem)) {
      // eslint-disable-next-line no-console
      console.error('invalid commission line item:', customerCommissionLineItem);
      throw new Error('Commission should be present and the value should be zero or positive');
    }

    const commission = customerCommissionLineItem.lineTotal;
    const formattedCommission = commission ? formatMoney(intl, commission) : null;

    commissionItem = (
      <div className={css.lineItem}>
        <span className={css.itemLabel}>
          <FormattedMessage id="OrderBreakdown.commission" values={{ marketplaceName }} />
        </span>
        <span className={css.itemValue}>{formattedCommission}</span>
      </div>
    );
  }

  return commissionItem;
};

LineItemCustomerCommissionMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  isCustomer: bool.isRequired,
  marketplaceName: string.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemCustomerCommissionMaybe;
