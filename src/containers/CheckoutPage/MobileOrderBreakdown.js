import React from 'react';

import { Heading } from '../../components';
import css from './CheckoutPage.module.css';

const MobileOrderBreakdown = props => {
  const { breakdown, speculateTransactionErrorMessage, priceVariantName } = props;

  return (
    <div className={css.priceBreakdownContainer}>
      {priceVariantName ? (
        <div className={css.bookingPriceVariantMobile}>
          <Heading as="h3" rootClassName={css.priceVariantNameMobile}>
            {priceVariantName}
          </Heading>
        </div>
      ) : null}
      {speculateTransactionErrorMessage}
      {breakdown}
    </div>
  );
};

export default MobileOrderBreakdown;
