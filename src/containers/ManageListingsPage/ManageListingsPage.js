import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useIntl } from '../../util/reactIntl';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { hasPermissionToPostListings } from '../../util/userHelpers';
import { NO_ACCESS_PAGE_POST_LISTINGS } from '../../util/urlHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import {
  LISTING_GRID_DEFAULTS,
  LISTING_GRID_ROLE,
  LISTING_GRID_CATEGORIES,
  LISTING_TYPES,
} from '../../util/types';

import { LayoutSingleColumn, Page, UserNav, NamedRedirect, ListingTabs } from '../../components';
import { getSearch } from '../../components/ListingTabs/GridHelpers';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ManageListingCard from './ManageListingCard/ManageListingCard';
import { closeListing, getOwnListingsById, openListing } from './ManageListingsPage.duck';

export const ManageListingsPageComponent = props => {
  const [listingMenuOpen, setListingMenuOpen] = useState(null);
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();
  const intl = useIntl();

  const {
    currentUser = null,
    closingListing = null,
    closingListingError = null,
    listings = [],
    onCloseListing,
    onOpenListing,
    openingListing = null,
    openingListingError = null,
    pagination = null,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled,
  } = props;
  const defaultListingType = LISTING_GRID_DEFAULTS.TYPE;
  const currentListingType = queryParams.pub_listingType || defaultListingType;
  const listingTypeCategories = LISTING_GRID_CATEGORIES[currentListingType];

  function createManageLocatorString(queryParams) {
    const pathParams = {};
    const destination = createResourceLocatorString(
      'ManageListingsPage',
      routeConfiguration,
      pathParams,
      queryParams
    );
    history.replace(destination);
  }

  function updateProductRoute() {
    const queryParams = {
      pub_listingType: LISTING_TYPES.PRODUCT,
      pub_categoryLevel1: LISTING_GRID_DEFAULTS.CATEGORY(
        LISTING_GRID_CATEGORIES[LISTING_TYPES.PRODUCT]
      ),
    };
    createManageLocatorString(queryParams);
  }

  function updatePortfolioRoute() {
    const queryParams = {
      pub_listingType: LISTING_TYPES.PORTFOLIO,
    };
    createManageLocatorString(queryParams);
  }

  useEffect(() => {
    const listingTypeParamValue = queryParams.pub_listingType;
    const invalidListingType = !(
      listingTypeParamValue && Object.values(LISTING_TYPES).includes(listingTypeParamValue)
    );
    const invalidCategoryType =
      listingTypeParamValue === LISTING_TYPES.PRODUCT && !queryParams.pub_categoryLevel1;
    const shouldUpdateRoute = invalidListingType || invalidCategoryType;
    if (shouldUpdateRoute) {
      updateProductRoute();
    }
  }, []);

  const hasPostingRights = hasPermissionToPostListings(currentUser);
  if (!hasPostingRights) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS }}
      />
    );
  }

  const onToggleMenu = listing => {
    setListingMenuOpen(listing);
  };
  const handleOpenListing = listingId => {
    if (!hasPostingRights) {
      const noAccessPagePath = pathByRouteName('NoAccessPage', routeConfiguration, {
        missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS,
      });
      history.push(noAccessPagePath);
    } else {
      onOpenListing(listingId);
    }
  };
  const closingErrorListingId = !!closingListingError && closingListingError.listingId;
  const openingErrorListingId = !!openingListingError && openingListingError.listingId;
  const listingRenderer = (listing, className, renderSizes) => {
    const listingId = listing.id.uuid;
    return (
      <ManageListingCard
        key={listingId}
        className={className}
        listing={listing}
        renderSizes={renderSizes}
        isMenuOpen={!!listingMenuOpen && listingMenuOpen.id.uuid === listingId}
        actionsInProgressListingId={openingListing || closingListing}
        onToggleMenu={onToggleMenu}
        onCloseListing={onCloseListing}
        onOpenListing={handleOpenListing}
        hasOpeningError={openingErrorListingId.uuid === listingId}
        hasClosingError={closingErrorListingId.uuid === listingId}
      />
    );
  };

  const onTabChange = key => {
    switch (key) {
      case LISTING_TYPES.PORTFOLIO:
        updatePortfolioRoute();
        break;
      case LISTING_TYPES.PRODUCT:
      default:
        updateProductRoute();
        break;
    }
  };

  const links = useMemo(
    () =>
      listingTypeCategories.map(category => ({
        id: category.id,
        name: 'ManageListingsPage',
        displayText: category.name,
        to: { search: getSearch(category.id, currentListingType) },
      })),
    [listingTypeCategories]
  );

  return (
    <Page
      title={intl.formatMessage({ id: 'ManageListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav currentPage="ManageListingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        <ListingTabs
          listings={listings}
          pagination={pagination}
          queryInProgress={queryInProgress}
          queryListingsError={queryListingsError}
          queryParams={queryParams}
          onTabChange={onTabChange}
          links={links}
          role={LISTING_GRID_ROLE.MANAGE}
          titleMessageId="ManageListingsPage.title"
          noResultsMessageId="ManageListingsPage.noResults"
          loadingMessageId="ManageListingsPage.loadingOwnListings"
          errorMessageId="ManageListingsPage.queryError"
          listingRenderer={listingRenderer}
        />
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
  } = state.ManageListingsPage;
  const listings = getOwnListingsById(state, currentPageResultIds);
  return {
    currentUser,
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
  };
};

const mapDispatchToProps = dispatch => ({
  onCloseListing: listingId => dispatch(closeListing(listingId)),
  onOpenListing: listingId => dispatch(openListing(listingId)),
});

const ManageListingsPage = compose(connect(mapStateToProps, mapDispatchToProps))(
  ManageListingsPageComponent
);

export default ManageListingsPage;
