import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { LISTING_TYPES, propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, UserNav, LayoutSingleColumn, ListingTabs } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { getListingsById } from '../../ducks/marketplaceData.duck';

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
  const defaultListingType = LISTING_TYPES.PRODUCT;

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
          listings={listings}
          pagination={pagination}
          queryInProgress={queryInProgress}
          queryFavoritesError={queryFavoritesError}
          queryParams={queryParams}
          onTabChange={onTabChange}
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
