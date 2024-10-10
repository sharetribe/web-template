import React from 'react';
import CurrencyNote from '../../extensions/MultipleCurrency/components/CurrencyNote/CurrencyNote';

import css from './CheckoutPage.module.css';

const MobileOrderBreakdown = props => {
  const { breakdown, speculateTransactionErrorMessage } = props;

  return (
    <div className={css.priceBreakdownContainer}>
      {speculateTransactionErrorMessage}
      {breakdown}
      <CurrencyNote componentId="CheckoutPage" />
    </div>
  );
};

export default MobileOrderBreakdown;
