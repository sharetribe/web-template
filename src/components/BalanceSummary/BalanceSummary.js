import React, { useState } from 'react';
import { useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { IconSpinner } from '../../components';

import css from './BalanceSummary.module.css';

const { Money } = sdkTypes;

const SummaryCard = ({ label, children, className }) => (
  <div className={className || css.card}>
    <div className={css.cardLabel}>{label}</div>
    <div className={css.cardValue}>{children}</div>
  </div>
);

const BalanceSummary = props => {
  const {
    completedTotalAmount = 0,
    pendingTotalAmount = 0,
    cancelledCount = 0,
    currentMonthCompletedAmount = 0,
    currentMonthPendingAmount = 0,
    currentMonthCancelledCount = 0,
    currency,
    fetchInProgress,
  } = props;

  const intl = useIntl();
  const [activeTab, setActiveTab] = useState('allTime');

  if (fetchInProgress) {
    return (
      <div className={css.root} aria-busy="true" aria-live="polite">
        <IconSpinner />
      </div>
    );
  }

  const isMonth = activeTab === 'currentMonth';

  const shownCompleted = isMonth ? currentMonthCompletedAmount : completedTotalAmount;
  const shownPending = isMonth ? currentMonthPendingAmount : pendingTotalAmount;
  const shownCancelled = isMonth ? currentMonthCancelledCount : cancelledCount;

  const completedMoney = currency
    ? formatMoney(intl, new Money(shownCompleted, currency))
    : '—';
  const pendingMoney = currency
    ? formatMoney(intl, new Money(shownPending, currency))
    : '—';

  return (
    <div className={css.wrapper}>
      <div className={css.tabs}>
        <button
          className={activeTab === 'allTime' ? css.tabActive : css.tab}
          onClick={() => setActiveTab('allTime')}
        >
          {intl.formatMessage({ id: 'BalanceSummary.tabAllTime' })}
        </button>
        <button
          className={activeTab === 'currentMonth' ? css.tabActive : css.tab}
          onClick={() => setActiveTab('currentMonth')}
        >
          {intl.formatMessage({ id: 'BalanceSummary.tabCurrentMonth' })}
        </button>
      </div>
      <div className={css.root}>
        <SummaryCard
          label={intl.formatMessage({ id: 'BalanceSummary.totalEarnings' })}
          className={css.cardEarnings}
        >
          {completedMoney}
        </SummaryCard>
        <SummaryCard
          label={intl.formatMessage({ id: 'BalanceSummary.pending' })}
          className={css.cardPending}
        >
          {pendingMoney}
        </SummaryCard>
        <SummaryCard
          label={intl.formatMessage({ id: 'BalanceSummary.cancelled' })}
          className={css.cardCancelled}
        >
          {shownCancelled}
        </SummaryCard>
      </div>
    </div>
  );
};

export default BalanceSummary;
