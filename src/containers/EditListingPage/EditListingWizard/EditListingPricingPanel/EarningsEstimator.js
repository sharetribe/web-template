import React from 'react';
import { useIntl } from '../../../../util/reactIntl';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { useConfiguration } from '../../../../context/configurationContext';

import css from './EarningsEstimator.module.css';

const { Money } = sdkTypes;

const EarningsEstimator = props => {
  const { price, marketplaceCurrency, includePaymentProcessing = false } = props;
  const intl = useIntl();
  const config = useConfiguration();

  const {
    providerCommissionPercentage = 10,
    providerCommissionFixedAmountInSubunits = 0,
    stripeFeePercentage = 2.9,
    stripeFeeFixedAmountInSubunits = 30,
  } = config.earningsEstimate || {};

  if (!price || !price.amount || price.amount <= 0) {
    return (
      <div className={css.root}>
        <p className={css.placeholder}>
          {intl.formatMessage({ id: 'EarningsEstimator.enterPrice' })}
        </p>
      </div>
    );
  }

  const gross = price.amount;
  const currency = price.currency || marketplaceCurrency;
  // Commission = percentage of price + fixed fee (always additive).
  const marketplaceCut =
    Math.round((gross * providerCommissionPercentage) / 100) +
    providerCommissionFixedAmountInSubunits;
  const stripeCut = includePaymentProcessing
    ? Math.round((gross * stripeFeePercentage) / 100) + stripeFeeFixedAmountInSubunits
    : 0;
  const earnings = gross - marketplaceCut - stripeCut;

  const fmt = amount => formatMoney(intl, new Money(amount, currency));
  const fixedFeeFormatted =
    providerCommissionFixedAmountInSubunits > 0
      ? fmt(providerCommissionFixedAmountInSubunits)
      : null;

  return (
    <div className={css.root}>
      <div className={css.title}>{intl.formatMessage({ id: 'EarningsEstimator.title' })}</div>

      <div className={css.lineItem}>
        <span>{intl.formatMessage({ id: 'EarningsEstimator.listingPrice' })}</span>
        <span>{fmt(gross)}</span>
      </div>

      <div className={css.lineItem}>
        <span className={css.deduction}>
          {intl.formatMessage({ id: 'EarningsEstimator.marketplaceFeeLabel' })}
          {fixedFeeFormatted
            ? ` (${providerCommissionPercentage}% + ${fixedFeeFormatted})`
            : ` (${providerCommissionPercentage}%)`}
        </span>
        <span className={css.deduction}>-{fmt(marketplaceCut)}</span>
      </div>

      {includePaymentProcessing ? (
        <div className={css.lineItem}>
          <span className={css.deduction}>
            {intl.formatMessage({ id: 'EarningsEstimator.stripeFee' })}
          </span>
          <span className={css.deduction}>-{fmt(stripeCut)}</span>
        </div>
      ) : null}

      <div className={css.earningsLine}>
        <span>{intl.formatMessage({ id: 'EarningsEstimator.yourEarnings' })}</span>
        <span>{fmt(Math.max(0, earnings))}</span>
      </div>

      <p className={css.disclaimer}>{intl.formatMessage({ id: 'EarningsEstimator.disclaimer' })}</p>
    </div>
  );
};

export default EarningsEstimator;
