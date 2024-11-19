import React from 'react';
import { arrayOf, bool, object, string, func } from 'prop-types';
import { Tabs } from 'antd';

import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_TYPES, propTypes } from '../../util/types';

import {
  H3,
  PaginationLinks,
  ListingCard,
} from '../';

import css from './ListingTabs.module.css';

export const ListingTabs = props => {
  const {
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    loadingMessageId,
    errorMessageId,
    onTabChange,
  } = props;
  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;
  const defaultListingType = LISTING_TYPES.PRODUCT;
  const currentListingType = queryParams.pub_listingType || defaultListingType;
  const hasNoResults = listingsAreLoaded && pagination.totalItems === 0;
  const enableGrid = listingsAreLoaded && !queryFavoritesError;










  const REACT_APP_MARKETPLACE_ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL
  const REACT_APP_SHARETRIBE_SDK_CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID
  console.warn('\n\n\n*******************************');
  console.warn('\n[ListingTabs] - REACT_APP_MARKETPLACE_ROOT_URL:', REACT_APP_MARKETPLACE_ROOT_URL);
  console.warn('\n[ListingTabs] - REACT_APP_SHARETRIBE_SDK_CLIENT_ID:', REACT_APP_SHARETRIBE_SDK_CLIENT_ID);
  console.warn('\n*******************************\n\n\n');








  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id={loadingMessageId} />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id={errorMessageId} />
      </H3>
    </div>
  );

  const page = queryParams ? queryParams.page : 1;
  const paginationLinks =
    listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="FavoriteListingsPage"
        pageSearchParams={{ page }}
        pagination={pagination}
      />
    ) : null;

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  const listingGridRenderer = hasNoResults ? (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage id="FavoriteListingsPage.noResults" />
    </H3>
  ) : (
    <div className={css.listingCards}>
      {listings.map(l => (
        <ListingCard
          className={css.listingCard}
          key={l.id.uuid}
          listing={l}
          renderSizes={renderSizes}
        />
      ))}
    </div>
  );

  const contentRenderer = (
    <div className={css.listingPanel}>
      {queryInProgress && loadingResults}
      {queryFavoritesError && queryError}
      {enableGrid && listingGridRenderer}
    </div>
  )

  return (
    <div className={css.root}>
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.title" />
      </H3>
      <div>
        <Tabs
          defaultActiveKey={currentListingType}
          onChange={onTabChange}
          items={[
            { key: LISTING_TYPES.PRODUCT, label: 'Shop', children: contentRenderer },
            { key: LISTING_TYPES.PROFILE, label: 'Creatives', children: contentRenderer },
          ]}
        />
        {paginationLinks}
      </div>
    </div>
  );
};

ListingTabs.defaultProps = {
  listings: [],
  pagination: null,
  queryFavoritesError: null,
  queryParams: null,
  loadingMessageId: "ManageListingsPage.loadingOwnListings",
  errorMessageId: "ManageListingsPage.queryError",
};

ListingTabs.propTypes = {
  listings: arrayOf(propTypes.listing),
  pagination: propTypes.pagination,
  queryInProgress: bool.isRequired,
  queryFavoritesError: propTypes.error,
  queryParams: object,
  loadingMessageId: string,
  errorMessageId: string,
  onTabChange: func,
};

export default ListingTabs;
