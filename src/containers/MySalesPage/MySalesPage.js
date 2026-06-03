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

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import { InboxItem } from '../../containers/InboxPage/InboxPage';
import { getStateData } from '../../containers/InboxPage/InboxPage.stateData';

import css from './MySalesPage.module.css';

export const MySalesPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const location = useLocation();
  const {
    currentUser,
    fetchInProgress,
    fetchSalesError,
    pagination,
    scrollingDisabled,
    transactions,
  } = props;

  const title = intl.formatMessage({ id: 'MySalesPage.title' });
  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);
  const search = parse(location.search);

  const pickType = lt => conf => conf.listingType === lt;
  const findListingTypeConfig = publicData => {
    const listingTypeConfigs = config.listing?.listingTypes;
    const { listingType } = publicData || {};
    return listingTypeConfigs?.find(pickType(listingType));
  };

  const toTxItem = tx => {
    const transactionRole = TX_TRANSITION_ACTOR_PROVIDER;
    let stateData = null;
    try {
      stateData = getStateData({ transaction: tx, transactionRole, intl });
    } catch (error) {
      // If stateData is missing, omit the transaction from the list.
    }

    const publicData = tx?.listing?.attributes?.publicData || {};
    const foundListingTypeConfig = findListingTypeConfig(publicData);
    const { stockType, availabilityType } = foundListingTypeConfig || {};
    const process = tx?.attributes?.processName;
    const transactionProcess = resolveLatestProcessName(process);
    const isBooking = isBookingProcess(transactionProcess);
    const isPurchase = isPurchaseProcess(transactionProcess);

    return stateData ? (
      <li key={tx.id.uuid} className={css.listItem}>
        <InboxItem
          transactionRole={transactionRole}
          tx={tx}
          intl={intl}
          stateData={stateData}
          stockType={stockType}
          availabilityType={availabilityType}
          isBooking={isBooking}
          isPurchase={isPurchase}
        />
      </li>
    ) : null;
  };

  const hasNoResults = !fetchInProgress && transactions.length === 0 && !fetchSalesError;
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
            <UserNav currentPage="MySalesPage" showManageListingsLink={showManageListingsLink} />
          </>
        }
        sideNav={
          <H2 as="h1" className={css.title}>
            <FormattedMessage id="MySalesPage.heading" />
          </H2>
        }
        footer={<FooterContainer />}
      >
        {fetchSalesError ? (
          <p className={css.error}>
            <FormattedMessage id="MySalesPage.loadingError" />
          </p>
        ) : null}
        <ul className={css.itemList}>
          {!fetchInProgress ? (
            transactions.map(toTxItem)
          ) : (
            <li className={css.listItemsLoading}>
              <IconSpinner />
            </li>
          )}
          {hasNoResults ? (
            <li key="noResults" className={css.noResults}>
              <FormattedMessage id="MySalesPage.noResults" />
            </li>
          ) : null}
        </ul>
        {hasTransactions && pagination && pagination.totalPages > 1 ? (
          <PaginationLinks
            className={css.pagination}
            pageName="MySalesPage"
            pageSearchParams={search}
            pagination={pagination}
          />
        ) : null}
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { fetchInProgress, fetchSalesError, pagination, transactionRefs } = state.MySalesPage;
  const { currentUser } = state.user;
  return {
    currentUser,
    fetchInProgress,
    fetchSalesError,
    pagination,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
  };
};

const MySalesPage = compose(connect(mapStateToProps))(MySalesPageComponent);

export default MySalesPage;
