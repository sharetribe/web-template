import React from 'react';

import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { types as sdkTypes } from '../../util/sdkLoader';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_PROVIDER_COMMISSION, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const { Money } = sdkTypes;

// Validate the assumption that the commission exists and the amount
// is zero or negative.
const isValidCommission = commissionLineItem => {
  return commissionLineItem.lineTotal instanceof Money && commissionLineItem.lineTotal.amount <= 0;
};

/**
 * A component that renders the provider commission as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {boolean} props.isProvider - Whether the provider is the one receiving the commission
 * @param {string} props.marketplaceName - The name of the marketplace
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemProviderCommissionMaybe = props => {
  const { lineItems, isProvider, marketplaceName, intl } = props;

  const providerCommissionLineItem = lineItems.find(
    item => item.code === LINE_ITEM_PROVIDER_COMMISSION && !item.reversal
  );

  // If commission is passed it will be shown as a fee already reduces from the total price
  let commissionItem = null;

  // Sharetribe Web Template is using the default-booking and default-purchase transaction processes.
  // They containt the provider commissions, so by default, the providerCommissionLineItem should exist.
  // If you are not using provider commisison you might want to remove this whole component from OrderBreakdown.js file.
  // https://www.sharetribe.com/docs/concepts/transaction-process/
  if (isProvider && providerCommissionLineItem) {
    if (!isValidCommission(providerCommissionLineItem)) {
      // eslint-disable-next-line no-console
      console.error('invalid commission line item:', providerCommissionLineItem);
      throw new Error('Commission should be present and the value should be zero or negative');
    }

    const commission = providerCommissionLineItem.lineTotal;
    const formattedCommission = commission ? formatMoney(intl, commission) : null;

    commissionItem = (
      <div className={css.lineItem}>
        <span className={css.itemLabel}>
          <FormattedMessage
            id="OrderBreakdown.commission"
            values={{ marketplaceName, role: 'provider' }}
          />
        </span>
        <span className={css.itemValue}>{formattedCommission}</span>
      </div>
    );
  }

  return commissionItem;
};

export default LineItemProviderCommissionMaybe;
