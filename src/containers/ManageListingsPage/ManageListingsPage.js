import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Flex, Space, Tabs } from 'antd';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { hasPermissionToPostListings } from '../../util/userHelpers';
import { NO_ACCESS_PAGE_POST_LISTINGS } from '../../util/urlHelpers';
import { isErrorNoPermissionToPostListings } from '../../util/errors';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { LISTING_GRID_DEFAULTS, LISTING_GRID_ROLE } from '../../util/types';

import {
  Button,
  H3,
  LayoutSingleColumn,
  NamedLink,
  Page,
  PaginationLinks,
  UserNav,
  NamedRedirect,
  ListingTabs,
} from '../../components';

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
    categories,
  } = props;
  const defaultListingType = LISTING_GRID_DEFAULTS.TYPE;
  const defaultCategoryType = LISTING_GRID_DEFAULTS.CATEGORY(categories);







  useEffect(() => {
    const validListingType = !queryParams.pub_listingType;
    const validCategoryType = !queryParams.pub_categoryLevel1;
    const shouldUpdateRoute = validListingType || validCategoryType;
    if (shouldUpdateRoute) {
      const pathParams = {};
      const queryParams = {
        pub_listingType: defaultListingType,
        pub_categoryLevel1: defaultCategoryType,
      };
      const destination = createResourceLocatorString(
        'ManageListingsPage',
        routeConfiguration,
        pathParams,
        queryParams
      );
      history.replace(destination);
    }
  }, []);










  /**
   * [TODO:]
   *    - Ver si estos dos hacen lo mismo....
   */
  useEffect(() => {
    if (isErrorNoPermissionToPostListings(openingListingError?.error)) {
      const noAccessPagePath = pathByRouteName('NoAccessPage', routeConfiguration, {
        missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS,
      });
      history.push(noAccessPagePath);
    }
  }, [openingListingError]);

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
    )
  };











  const onTabChange = key => {
    const destination = createResourceLocatorString(
      'ManageListingsPage',
      routeConfiguration,
      {},
      { pub_listingType: key }
    );
    history.push(destination);
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
          listings={listings}
          pagination={pagination}
          queryInProgress={queryInProgress}
          queryListingsError={queryListingsError}
          queryParams={queryParams}
          onTabChange={onTabChange}
          categories={categories}
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
    categories,
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
    categories,
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
