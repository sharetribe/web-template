import React from 'react';
import PropTypes from 'prop-types';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { injectIntl, intlShape } from '../../../../util/reactIntl';

import css from './PriceBreakdown.module.css';

const { Money } = sdkTypes;

const PriceBreakdownComponent = ({ price, currencyConfig, intl }) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return (
      <div className={css.root}>
        <h4>Price Breakdown</h4>
        <p>Please enter a valid price to see the breakdown.</p>
      </div>
    );
  }

  const feePercentage = 5;
  const priceInCents = Math.round(price * 100);
  const priceAsMoney = new Money(priceInCents, currencyConfig.currency);
  const fees = new Money(Math.round(priceInCents * (feePercentage / 100)), currencyConfig.currency);
  const sellerReceives = new Money(priceInCents - fees.amount, currencyConfig.currency);

  const formatMoneyWithIntl = money => {
    try {
      return formatMoney(intl, money);
    } catch (error) {
      console.error('Error formatting money:', error);
      return 'N/A';
    }
  };

  return (
    <div className={css.root}>
      <h4>Price Breakdown</h4>
      <div className={css.row}>
        <span>Listing Price:</span>
        <span>{formatMoneyWithIntl(priceAsMoney)}</span>
      </div>
      <div className={css.row}>
        <span>Processing Fees ({feePercentage}%):</span>
        <span>{formatMoneyWithIntl(fees)}</span>
      </div>
      <div className={css.row}>
        <span>You Receive:</span>
        <span>{formatMoneyWithIntl(sellerReceives)}</span>
      </div>
    </div>
  );
};

PriceBreakdownComponent.propTypes = {
  price: PropTypes.number,
  currencyConfig: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    currencyFormatting: PropTypes.object,
  }).isRequired,
  intl: intlShape.isRequired,
};

const PriceBreakdown = injectIntl(PriceBreakdownComponent);

export default PriceBreakdown;
