import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { useIntl, FormattedMessage } from '../../util/reactIntl';

import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { LISTING_GRID_DEFAULTS, LISTING_GRID_ROLE, LISTING_TAB_TYPES } from '../../util/types';
import { hasPermissionToPostListings } from '../../util/userHelpers';
import { NO_ACCESS_PAGE_POST_LISTINGS } from '../../util/urlHelpers';

import {
  H3,
  LayoutSingleColumn,
  Page,
  UserNav,
  NamedRedirect,
  ListingTabs,
  PortfolioListingCard,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import DiscardDraftModal from './DiscardDraftModal/DiscardDraftModal';
import ManageListingCard from './ManageListingCard/ManageListingCard';
import {
  closeListing,
  openListing,
  getOwnListingsById,
  discardDraft,
} from './ManageListingsPage.duck';
import { getLinks, getItems, getCurrentCategory, routeHandler } from './utils';

import css from './ManageListingsPage.module.css';

export const ManageListingsPageComponent = props => {
  const [listingMenuOpen, setListingMenuOpen] = useState(null);
  const [discardDraftModalOpen, setDiscardDraftModalOpen] = useState(null);
  const [discardDraftModalId, setDiscardDraftModalId] = useState(null);
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();
  const intl = useIntl();

  const {
    currentUser = null,
    closingListing = null,
    closingListingError = null,
    discardingDraft,
    discardingDraftError,
    listings = [],
    onCloseListing,
    onDiscardDraft,
    onOpenListing,
    openingListing = null,
    openingListingError = null,
    pagination = null,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled,
    onManageDisableScrolling,
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
      case LISTING_TAB_TYPES.PORTFOLIO: {
        const invalidCategoryType = !queryParams.pub_listingId;
        const listingsAvailable = !queryInProgress && !!currentCategory;
        const shouldUpdateRoute = invalidCategoryType && listingsAvailable;
        if (shouldUpdateRoute) {
          updatePortfolioRoute(currentCategory);
        }
        break;
      }
      default: {
        const invalidListingType = !(
          listingTypeParamValue && Object.values(LISTING_TAB_TYPES).includes(listingTypeParamValue)
        );
        const invalidCategoryType =
          listingTypeParamValue === LISTING_TAB_TYPES.PRODUCT && !queryParams.pub_categoryLevel1;
        const shouldUpdateRoute = invalidListingType || invalidCategoryType;
        if (shouldUpdateRoute) {
          updateProductRoute();
        }
        break;
      }
    }
  }, [queryInProgress]);

  const openDiscardDraftModal = listingId => {
    setDiscardDraftModalId(listingId);
    setDiscardDraftModalOpen(true);
  };

  const handleDiscardDraft = () => {
    onDiscardDraft(discardDraftModalId);
    setDiscardDraftModalOpen(false);
    setDiscardDraftModalId(null);
  };

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
      case LISTING_TAB_TYPES.PORTFOLIO: {
        return (
          <PortfolioListingCard
            key={`${currentCategory}-${index}`}
            className={className}
            item={item}
          />
        );
      }
      case LISTING_TAB_TYPES.PRODUCT:
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
        const discardingErrorListingId = !!discardingDraftError && discardingDraft.listingId;
        const listingId = item.id.uuid;
        return (
          <ManageListingCard
            key={listingId}
            className={className}
            listing={item}
            renderSizes={renderSizes}
            isMenuOpen={!!listingMenuOpen && listingMenuOpen.id.uuid === listingId}
            actionsInProgressListingId={openingListing || closingListing || discardingDraft}
            onToggleMenu={onToggleMenu}
            onCloseListing={onCloseListing}
            onOpenListing={handleOpenListing}
            onDiscardDraft={openDiscardDraftModal}
            hasOpeningError={openingErrorListingId.uuid === listingId}
            hasClosingError={closingErrorListingId.uuid === listingId}
            hasDiscardingError={discardingErrorListingId.uuid === listingId}
          />
        );
      }
    }
  };

  const titleRenderer = (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage id="ManageListingsPage.title" />
    </H3>
  );

  const onTabChange = key => {
    switch (key) {
      case LISTING_TAB_TYPES.PORTFOLIO:
        updatePortfolioRoute();
        break;
      case LISTING_TAB_TYPES.PRODUCT:
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
          listingRenderer={listingRenderer}
          role={LISTING_GRID_ROLE.MANAGE}
          title={titleRenderer}
          noResultsMessageId="ManageListingsPage.noResults"
          loadingMessageId="ManageListingsPage.loadingOwnListings"
          errorMessageId="ManageListingsPage.queryError"
        />

        {onManageDisableScrolling && discardDraftModalOpen ? (
          <DiscardDraftModal
            id="ManageListingsPage"
            isOpen={discardDraftModalOpen}
            onManageDisableScrolling={onManageDisableScrolling}
            onCloseModal={() => setDiscardDraftModalOpen(false)}
            onDiscardDraft={handleDiscardDraft}
          />
        ) : null}
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    pagination,
    queryParams,
    currentPageResultIds,
    queryInProgress,
    queryListingsError,
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
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
    discardingDraft,
    discardingDraftError,
  };
};

const mapDispatchToProps = dispatch => ({
  onCloseListing: listingId => dispatch(closeListing(listingId)),
  onOpenListing: listingId => dispatch(openListing(listingId)),
  onDiscardDraft: listingId => dispatch(discardDraft(listingId)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const ManageListingsPage = compose(connect(mapStateToProps, mapDispatchToProps))(
  ManageListingsPageComponent
);

export default ManageListingsPage;
