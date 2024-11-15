import React from 'react';
import PropTypes from 'prop-types';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { FormattedMessage, injectIntl, intlShape } from '../../../../util/reactIntl';

import css from './PriceBreakdown.module.css';

const { Money } = sdkTypes;

const PriceBreakdownComponent = props => {
  const { price, currencyConfig, intl, providerCommission, providerFlatFee } = props;

  if (typeof price !== 'number' || isNaN(price)) {
    return (
      <div className={css.root}>
        <h4>
          <FormattedMessage id="EditListingPriceBreakdown.priceBreakdownTitle" />
        </h4>
        <p>
          <FormattedMessage id="EditListingPriceBreakdown.priceMissing" />
        </p>
      </div>
    );
  }

  const priceInCents = Math.round(price * 100);
  const priceAsMoney = new Money(priceInCents, currencyConfig.currency);
  const providerCommissionAsMoney = new Money(
    Math.round(priceInCents * (providerCommission.percentage / 100)),
    currencyConfig.currency
  );
  const flatFeeAsMoney = new Money(providerFlatFee, currencyConfig.currency);

  const sellerReceives = new Money(
    priceAsMoney.amount - providerCommissionAsMoney.amount - flatFeeAsMoney.amount,
    currencyConfig.currency
  );

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
      <h4>
        <FormattedMessage id="EditListingPriceBreakdown.priceBreakdownTitle" />
      </h4>
      <div className={css.row}>
        <span>
          <FormattedMessage id="EditListingPriceBreakdown.listingPrice" />
        </span>
        <span>{formatMoneyWithIntl(priceAsMoney)}</span>
      </div>
      <div className={css.row}>
        <span>
          <FormattedMessage
            id="EditListingPriceBreakdown.processingFees"
            values={{ providerCommission: providerCommission.percentage }}
          />
        </span>
        <span>{formatMoneyWithIntl(providerCommissionAsMoney)}</span>
      </div>
      <div className={css.row}>
        <FormattedMessage id="EditListingPriceBreakdown.providerFlatFee" />
        <span>{formatMoneyWithIntl(flatFeeAsMoney)}</span>
      </div>
      <div className={css.row}>
        <span>
          <FormattedMessage id="EditListingPriceBreakdown.sellerReceives" />
        </span>
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
