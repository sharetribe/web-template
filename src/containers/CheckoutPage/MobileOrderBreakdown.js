import React from 'react';

import { Heading, IconSpinner } from '../../components';
import css from './CheckoutPage.module.css';

// AV: localized loading overlay shown over the breakdown while a re-speculation
// (e.g. after selecting a shipping type) is in flight — keeps the loading scoped
// to the order breakdown instead of blanking the whole checkout page.
const breakdownLoadingOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.6)',
  zIndex: 1,
};

const MobileOrderBreakdown = props => {
  const {
    breakdown,
    speculateTransactionErrorMessage,
    priceVariantName,
    speculateInProgress,
  } = props;

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
      <div style={{ position: 'relative' }}>
        {speculateInProgress ? (
          <div style={breakdownLoadingOverlayStyle}>
            <IconSpinner />
          </div>
        ) : null}
        {breakdown}
      </div>
    </div>
  );
};

export default MobileOrderBreakdown;
