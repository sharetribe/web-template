import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import {
  H3,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  ListingCard,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './FavoriteListingPage.module.css';
import { getListingsById } from '../../ducks/marketplaceData.duck';

export const FavoriteListingPageComponent = props => {
  const { listings, pagination, queryInProgress, queryFavoritesError, queryParams, scrollingDisabled, intl } = props;

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingPage.loadingFavoriteListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingPage.queryError" />
      </H3>
    </div>
  );

  const noResults =
    listingsAreLoaded && pagination.totalItems === 0 ? (
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id="FavoriteListingPage.noResults" />
      </H3>
    ) : null;

  const heading =
    listingsAreLoaded && pagination.totalItems > 0 ? (
      <H3 as="h1" className={css.heading}>
        <FormattedMessage
          id="FavoriteListingPage.youHaveListings"
          values={{ count: pagination.totalItems }}
        />
      </H3>
    ) : (
      noResults
    );

  const page = queryParams ? queryParams.page : 1;
  const paginationLinks =
    listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="FavoriteListingPage"
        pageSearchParams={{ page }}
        pagination={pagination}
      />
    ) : null;

  const title = intl.formatMessage({ id: 'FavoriteListingPage.title' });

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="FavoriteListingPage" />
            <UserNav currentPage="FavoriteListingPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        {queryInProgress ? loadingResults : null}
        {queryFavoritesError ? queryError : null}
        <div className={css.listingPanel}>
          {heading}
          <div className={css.listingCards}>
            {Array.isArray(listings) && listings.length > 0 ? (
              listings.map(l => (
              <ListingCard
                className={css.listingCard}
                key={l.id.uuid}
                listing={l}
                showHeartIcon={false}
                renderSizes={renderSizes}
              />
            ))
          ):(
            !queryInProgress &&
            !queryFavoritesError && (
              <div className={css.noResultsMessage}>
                <FormattedMessage id="FavoriteListingPage.noResults" />
              </div>
            )
          )}
          </div>
          {paginationLinks}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    currentPageResultIds = [],
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
  } = state.FavoriteListingPage || {};
  const listings = getListingsById(state, currentPageResultIds || []);
  return {
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const FavoriteListingPage = compose(
  connect(mapStateToProps),
  injectIntl
)(FavoriteListingPageComponent);

export default FavoriteListingPage;