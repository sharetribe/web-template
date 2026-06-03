import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { parse } from '../../util/urlHelpers';
import {
  TX_TRANSITION_ACTOR_PROVIDER,
  resolveLatestProcessName,
  isBookingProcess,
  isPurchaseProcess,
} from '../../transactions/transaction';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { showCreateListingLinkForUser } from '../../util/userHelpers';
import {
  H2,
  Page,
  PaginationLinks,
  IconSpinner,
  UserNav,
  LayoutSideNavigation,
} from '../../components';
import BalanceSummary from '../../components/BalanceSummary/BalanceSummary';
import TransactionFilters from '../../components/TransactionFilters/TransactionFilters';
import PayoutItem from '../../components/PayoutItem/PayoutItem';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './MyBalancePage.module.css';

export const MyBalancePageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const location = useLocation();
  const {
    currentUser,
    fetchInProgress,
    fetchError,
    pagination,
    scrollingDisabled,
    transactions,
    summaryFetchInProgress,
    completedTotalAmount,
    pendingTotalAmount,
    cancelledCount,
    currentMonthCompletedAmount,
    currentMonthPendingAmount,
    currentMonthCancelledCount,
    currency,
  } = props;

  const title = intl.formatMessage({ id: 'MyBalancePage.title' });
  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);
  const search = parse(location.search);

  const hasNoResults = !fetchInProgress && transactions.length === 0 && !fetchError;
  const hasTransactions = !fetchInProgress && currentUser?.id && transactions.length > 0;

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        sideNavClassName={css.navigation}
        topbar={
          <>
            <TopbarContainer
              mobileRootClassName={css.mobileTopbar}
              desktopClassName={css.desktopTopbar}
            />
            <UserNav currentPage="MyBalancePage" showManageListingsLink={showManageListingsLink} />
          </>
        }
        sideNav={
          <H2 as="h1" className={css.title}>
            <FormattedMessage id="MyBalancePage.heading" />
          </H2>
        }
        footer={<FooterContainer />}
      >
        <BalanceSummary
          completedTotalAmount={completedTotalAmount}
          pendingTotalAmount={pendingTotalAmount}
          cancelledCount={cancelledCount}
          currentMonthCompletedAmount={currentMonthCompletedAmount}
          currentMonthPendingAmount={currentMonthPendingAmount}
          currentMonthCancelledCount={currentMonthCancelledCount}
          currency={currency}
          fetchInProgress={summaryFetchInProgress}
        />

        <TransactionFilters pageName="MyBalancePage" />

        {fetchError ? (
          <p className={css.error}>
            <FormattedMessage id="MyBalancePage.loadingError" />
          </p>
        ) : null}

        <div className={css.itemList}>
          {!fetchInProgress ? (
            transactions.map(tx => <PayoutItem key={tx.id.uuid} tx={tx} />)
          ) : (
            <div className={css.listItemsLoading}>
              <IconSpinner />
            </div>
          )}
          {hasNoResults ? (
            <p className={css.noResults}>
              <FormattedMessage id="MyBalancePage.noResults" />
            </p>
          ) : null}
        </div>

        {hasTransactions && pagination && pagination.totalPages > 1 ? (
          <PaginationLinks
            className={css.pagination}
            pageName="MyBalancePage"
            pageSearchParams={search}
            pagination={pagination}
          />
        ) : null}
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    fetchInProgress,
    fetchError,
    pagination,
    transactionRefs,
    summaryFetchInProgress,
    completedTotalAmount,
    pendingTotalAmount,
    cancelledCount,
    currentMonthCompletedAmount,
    currentMonthPendingAmount,
    currentMonthCancelledCount,
    currency,
  } = state.MyBalancePage;
  const { currentUser } = state.user;
  return {
    currentUser,
    fetchInProgress,
    fetchError,
    pagination,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
    summaryFetchInProgress,
    completedTotalAmount,
    pendingTotalAmount,
    cancelledCount,
    currentMonthCompletedAmount,
    currentMonthPendingAmount,
    currentMonthCancelledCount,
    currency,
  };
};

const MyBalancePage = compose(connect(mapStateToProps))(MyBalancePageComponent);

export default MyBalancePage;
