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
import { LISTING_GRID_DEFAULTS, LISTING_GRID_ROLE, LISTING_TYPES } from '../../util/types';

import { LayoutSingleColumn, Page, UserNav, NamedRedirect, ListingTabs } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ManageListingCard from './ManageListingCard/ManageListingCard';
import PortfolioListingCard from './ManageListingCard/PortfolioListingCard';
import { closeListing, getOwnListingsById, openListing } from './ManageListingsPage.duck';
import { getLinks, getItems, getCurrentCategory, routeHandler } from './utils';

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

  const currentCategory = useMemo(
    () => getCurrentCategory(listings, currentListingType, queryParams),
    [listings, currentListingType, queryParams]
  );
  const links = useMemo(() => getLinks(listings, currentListingType), [
    listings,
    currentListingType,
  ]);
  const items = useMemo(() => getItems(listings, currentListingType, currentCategory), [
    listings,
    currentListingType,
    currentCategory,
  ]);

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
  const { updateProductRoute, updatePortfolioRoute } = routeHandler(createManageLocatorString);

  useEffect(() => {
    const listingTypeParamValue = queryParams.pub_listingType;
    switch (listingTypeParamValue) {
      case LISTING_TYPES.PORTFOLIO: {
        const invalidCategoryType = !queryParams.pub_listingId;
        const listingsAvailable = !queryInProgress && !!currentCategory;
        const shouldUpdate = invalidCategoryType && listingsAvailable;
        if (shouldUpdate) {
          updatePortfolioRoute(currentCategory);
        }
        break;
      }
      default: {
        const invalidListingType = !(
          listingTypeParamValue && Object.values(LISTING_TYPES).includes(listingTypeParamValue)
        );
        const invalidCategoryType =
          listingTypeParamValue === LISTING_TYPES.PRODUCT && !queryParams.pub_categoryLevel1;
        const shouldUpdateRoute = invalidListingType || invalidCategoryType;
        if (shouldUpdateRoute) {
          updateProductRoute();
        }
        break;
      }
    }
  }, [queryInProgress]);

  const hasPostingRights = hasPermissionToPostListings(currentUser);
  if (!hasPostingRights) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS }}
      />
    );
  }

  const listingRenderer = (item, className, renderSizes, index) => {
    switch (currentListingType) {
      case LISTING_TYPES.PORTFOLIO: {
        return (
          <PortfolioListingCard
            key={`${currentCategory}-${index}`}
            className={className}
            image={item}
            renderSizes={renderSizes}
          />
        );
      }
      case LISTING_TYPES.PRODUCT:
      default: {
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
        const listingId = item.id.uuid;
        return (
          <ManageListingCard
            key={listingId}
            className={className}
            listing={item}
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
      }
    }
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
          items={items}
          pagination={pagination}
          queryInProgress={queryInProgress}
          queryListingsError={queryListingsError}
          queryParams={queryParams}
          onTabChange={onTabChange}
          categories={links}
          currentCategory={currentCategory}
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
