import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { handleToggleFavorites } from '../../util/favorites';
import { injectIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import {
  GRID_STYLE_SQUARE,
  LISTING_GRID_DEFAULTS,
  LISTING_GRID_ROLE,
  propTypes,
} from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

import { H3, Page, UserNav, LayoutSingleColumn, ListingTabs, ListingCard } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { updateProfile } from '../ProfileSettingsPage/ProfileSettingsPage.duck';

import { getListingsById } from '../../ducks/marketplaceData.duck';

import css from './FavoriteListingsPage.module.css';

export const FavoriteListingsPageComponent = props => {
  const {
    currentUser,
    listings = [],
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    onUpdateFavorites,
    onFetchCurrentUser,
    scrollingDisabled,
    intl,
  } = props;
  const history = useHistory();
  const location = useLocation();
  const routeConfiguration = useRouteConfiguration();
  const title = intl.formatMessage({ id: 'FavoriteListingsPage.title' });
  const defaultListingType = LISTING_GRID_DEFAULTS.TYPE(LISTING_GRID_ROLE.FAVORITE);
  const currentUserFavorites = currentUser?.attributes?.profile?.privateData?.favorites || {};

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

  const listingRenderer = (
    listing,
    className,
    renderSizes,
    index,
    gridLayout = GRID_STYLE_SQUARE
  ) => {
    const listingId = listing.id.uuid;
    const listingType = listing.attributes?.publicData?.listingType;
    const isFavorite = currentUserFavorites?.[listingType]?.includes(listingId);
    const routingParams = { params: {}, history, routes: routeConfiguration };
    const onToggleFavorites = handleToggleFavorites({
      ...routingParams,
      listingId,
      listingType,
      onUpdateFavorites,
      onFetchCurrentUser,
      location,
    });
    return (
      <ListingCard
        key={listingId}
        className={className}
        listing={listing}
        renderSizes={renderSizes}
        isFavorite={isFavorite}
        onToggleFavorites={onToggleFavorites}
        gridLayout={gridLayout}
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
  const { currentUser } = state.user;
  const listings = getListingsById(state, currentPageResultIds);
  return {
    currentUser,
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onUpdateFavorites: payload => dispatch(updateProfile(payload)),
  onFetchCurrentUser: () => dispatch(fetchCurrentUser({})),
});

const FavoriteListingsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(FavoriteListingsPageComponent);

export default FavoriteListingsPage;
