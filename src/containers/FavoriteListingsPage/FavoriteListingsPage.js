import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { injectIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { LISTING_GRID_DEFAULTS, LISTING_GRID_ROLE, propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, Page, UserNav, LayoutSingleColumn, ListingTabs, ListingCard } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { getListingsById } from '../../ducks/marketplaceData.duck';

import css from './FavoriteListingsPage.module.css';

export const FavoriteListingsPageComponent = props => {
  const {
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled,
    intl,
  } = props;
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const title = intl.formatMessage({ id: 'FavoriteListingsPage.title' });
  const defaultListingType = LISTING_GRID_DEFAULTS.TYPE;

  useEffect(() => {
    const validListingType = !queryParams.pub_listingType;
    const shouldUpdateRoute = validListingType;
    if (shouldUpdateRoute) {
      const pathParams = {};
      const queryParams = { pub_listingType: defaultListingType };
      const destination = createResourceLocatorString(
        'FavoriteListingsPage',
        routeConfiguration,
        pathParams,
        queryParams
      );
      history.replace(destination);
    }
  }, []);

  const onTabChange = key => {
    const pathParams = {};
    const queryParams = { pub_listingType: key };
    const destination = createResourceLocatorString(
      'FavoriteListingsPage',
      routeConfiguration,
      pathParams,
      queryParams
    );
    history.push(destination);
  };

  const listingRenderer = (listing, className, renderSizes) => {
    const listingId = listing.id.uuid;
    return (
      <ListingCard
        key={listingId}
        className={className}
        listing={listing}
        renderSizes={renderSizes}
      />
    );
  };

  const titleRenderer = (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage id="FavoriteListingsPage.title" />
    </H3>
  );

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="FavoriteListingsPage" />
            <UserNav currentPage="FavoriteListingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        <ListingTabs
          items={listings}
          pagination={pagination}
          queryInProgress={queryInProgress}
          queryListingsError={queryFavoritesError}
          queryParams={queryParams}
          onTabChange={onTabChange}
          listingRenderer={listingRenderer}
          role={LISTING_GRID_ROLE.FAVORITE}
          title={titleRenderer}
          noResultsMessageId="FavoriteListingsPage.noResults"
          loadingMessageId="FavoriteListingsPage.loadingFavoriteListings"
          errorMessageId="FavoriteListingsPage.queryError"
        />
      </LayoutSingleColumn>
    </Page>
  );
};

FavoriteListingsPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  queryFavoritesError: null,
  queryParams: null,
};

const { arrayOf, bool, object } = PropTypes;

FavoriteListingsPageComponent.propTypes = {
  listings: arrayOf(propTypes.listing),
  pagination: propTypes.pagination,
  queryInProgress: bool.isRequired,
  queryFavoritesError: propTypes.error,
  queryParams: object,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
  } = state.FavoriteListingsPage;
  const listings = getListingsById(state, currentPageResultIds);
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

const FavoriteListingsPage = compose(
  connect(mapStateToProps),
  injectIntl
)(FavoriteListingsPageComponent);

export default FavoriteListingsPage;
