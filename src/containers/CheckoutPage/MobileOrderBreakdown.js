import React from 'react';

import css from './CheckoutPage.module.css';

const MobileOrderBreakdown = props => {
  const { breakdown, speculateTransactionErrorMessage } = props;

  return (
    <div className={css.priceBreakdownContainer}>
      {speculateTransactionErrorMessage}
      {breakdown}
    </div>
  );
};

export default MobileOrderBreakdown;
