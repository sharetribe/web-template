import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Flex, Space, Tabs, Button as AntButton, Col, Row } from 'antd';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { hasPermissionToPostListings } from '../../util/userHelpers';
import { NO_ACCESS_PAGE_POST_LISTINGS } from '../../util/urlHelpers';
import { isErrorNoPermissionToPostListings } from '../../util/errors';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { LISTING_TYPES } from '../../util/types';

import {
  Button,
  H3,
  LayoutSingleColumn,
  NamedLink,
  Page,
  PaginationLinks,
  UserNav,
  NamedRedirect,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ManageListingCard from './ManageListingCard/ManageListingCard';
import css from './ManageListingsPage.module.css';
import { closeListing, getOwnListingsById, openListing } from './ManageListingsPage.duck';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ScrollableLinks from '../../components/ScrollableLinks/ScrollableLinks';

const PaginationLinksMaybe = props => {
  const { listingsAreLoaded, pagination, page } = props;
  return listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
    <PaginationLinks
      className={css.pagination}
      pageName="ManageListingsPage"
      pageSearchParams={{ page }}
      pagination={pagination}
    />
  ) : null;
};

function getSearch(category, listingType = LISTING_TYPES.PRODUCT) {
  const params = new URLSearchParams();
  params.set('pub_categoryLevel1', category);
  params.set('pub_listingType', listingType);
  return params.toString();
}

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
  const defaultListingType = LISTING_TYPES.PRODUCT;
  const defaultCategoryType = categories[0].id;
  const currentListingType = queryParams.pub_listingType || defaultListingType;
  const currentCategoryType = queryParams.pub_categoryLevel1 || defaultCategoryType;

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

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;
  const hasNoResults = listingsAreLoaded && pagination.totalItems === 0;

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="ManageListingsPage.loadingOwnListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="ManageListingsPage.queryError" />
      </H3>
    </div>
  );

  const closingErrorListingId = !!closingListingError && closingListingError.listingId;
  const openingErrorListingId = !!openingListingError && openingListingError.listingId;

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  const onTabChange = key => {
    const destination = createResourceLocatorString(
      'ManageListingsPage',
      routeConfiguration,
      {},
      { pub_listingType: key }
    );
    history.push(destination);
  };

  const goToCreateListing = (mode = 'create', searchParams = {}) => {
    const destination = createResourceLocatorString(
      'BatchEditListingPage',
      routeConfiguration,
      {
        mode,
        tab: 'upload',
      },
      searchParams
    );
    history.push(destination);
  };

  const links = useMemo(
    () =>
      categories.map(category => ({
        id: category.id,
        name: 'ManageListingsPage',
        displayText: category.name,
        to: { search: getSearch(category.id, currentListingType) },
      })),
    [categories]
  );

  const listingRenderer = (
    <>
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col xs={24} sm={16}>
          <ScrollableLinks links={links} selectedLinkId={currentCategoryType} />
        </Col>
        <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
          <Space size="middle">
            <AntButton
              type="text"
              className={css.actionButton}
              onClick={() => goToCreateListing('edit', queryParams)}
            >
              Manage {currentCategoryType}
            </AntButton>
            <AntButton
              type="primary"
              className={css.actionButton}
              onClick={() => goToCreateListing()}
            >
              Add New Photo(s)
            </AntButton>
          </Space>
        </Col>
      </Row>

      {hasNoResults ? (
        <div className={css.noResultsContainer}>
          <H3 as="h2" className={css.headingNoListings}>
            <FormattedMessage id="ManageListingsPage.noResults" />
          </H3>
        </div>
      ) : (
        <div className={css.listingCards}>
          {listings.map(l => (
            <ManageListingCard
              className={css.listingCard}
              key={l.id.uuid}
              listing={l}
              isMenuOpen={!!listingMenuOpen && listingMenuOpen.id.uuid === l.id.uuid}
              actionsInProgressListingId={openingListing || closingListing}
              onToggleMenu={onToggleMenu}
              onCloseListing={onCloseListing}
              onOpenListing={handleOpenListing}
              hasOpeningError={openingErrorListingId.uuid === l.id.uuid}
              hasClosingError={closingErrorListingId.uuid === l.id.uuid}
              renderSizes={renderSizes}
            />
          ))}
        </div>
      )}

      <PaginationLinksMaybe
        listingsAreLoaded={listingsAreLoaded}
        pagination={pagination}
        page={queryParams ? queryParams.page : 1}
      />
    </>
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
        {queryInProgress ? loadingResults : null}
        {queryListingsError ? queryError : null}

        <div className={css.listingPanel}>
          <H3 as="h1" className={css.heading}>
            <FormattedMessage id="ManageListingsPage.title" defaultMessage="Manage your market" />
          </H3>
          <div className={css.listingCardsTabs}>
            <Tabs
              defaultActiveKey={currentListingType}
              onChange={onTabChange}
              items={[
                { key: LISTING_TYPES.PRODUCT, label: 'Shop', children: listingRenderer },
                { key: LISTING_TYPES.SERVICE, label: 'Services', children: listingRenderer },
                { key: LISTING_TYPES.PORTFOLIO, label: 'Portfolio', children: listingRenderer },
              ]}
            ></Tabs>
          </div>
        </div>
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
