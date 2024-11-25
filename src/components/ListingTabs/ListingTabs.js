import React from 'react';
import { useHistory } from 'react-router-dom';
import { arrayOf, oneOfType, bool, object, string, func } from 'prop-types';
import { Button as AntButton, Col, Row, Space, Tabs } from 'antd';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { LISTING_GRID_ROLE, LISTING_GRID_DEFAULTS, propTypes } from '../../util/types';
import { PAGE_MODE_EDIT, PAGE_MODE_NEW } from '../../containers/BatchEditListingPage/constants';

import { H3, ScrollableLinks } from '../';
import { Loader, Error, Pagination, getTabsFeaturesForRole } from './GridHelpers';

import css from './ListingTabs.module.css';

export const ListingTabs = ({
  listings = [],
  pagination,
  queryInProgress,
  queryListingsError,
  queryParams,
  titleMessageId,
  noResultsMessageId,
  loadingMessageId,
  errorMessageId,
  onTabChange,
  categories,
  listingRenderer,
  role = LISTING_GRID_ROLE.MANAGE,
}) => {
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;
  const defaultListingType = LISTING_GRID_DEFAULTS.TYPE;
  const defaultCategoryType = LISTING_GRID_DEFAULTS.CATEGORY(categories);
  const currentListingType = queryParams.pub_listingType || defaultListingType;
  const currentCategoryType = queryParams.pub_categoryLevel1 || defaultCategoryType;
  const hasNoResults = listingsAreLoaded && pagination.totalItems === 0;
  const withLinks = !!(categories && categories.length);
  const enableGrid = listingsAreLoaded && !queryListingsError;
  const enablePagination = listingsAreLoaded && pagination && pagination.totalPages > 1;
  const page = queryParams ? queryParams.page : 1;
  const { pageName, tabs, enableCategoryTabs, enableListingManagement } = getTabsFeaturesForRole(
    role
  );

  const goToManageListing = (mode = PAGE_MODE_NEW, searchParams = {}) => {
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

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  const listingGridRenderer = hasNoResults ? (
    <div className={css.messagePanel}>
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id={noResultsMessageId} />
      </H3>
    </div>
  ) : (
    <div className={css.listingCards}>
      {listings.map(listing => listingRenderer(listing, css.listingCard, renderSizes))}
    </div>
  );

  const contentRenderer = (
    <div>
      {enableCategoryTabs && (
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={16}>
            {withLinks && (
              <ScrollableLinks links={categories} selectedLinkId={currentCategoryType} />
            )}
          </Col>
          {enableListingManagement && (
            <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
              <Space size="middle">
                <AntButton
                  type="text"
                  className={css.actionButton}
                  onClick={() =>
                    goToManageListing(PAGE_MODE_EDIT, {
                      category: currentCategoryType,
                      type: currentListingType,
                    })
                  }
                >
                  Manage {currentCategoryType}
                </AntButton>
                <AntButton
                  type="primary"
                  className={css.actionButton}
                  onClick={() => goToManageListing()}
                >
                  Add New Photo(s)
                </AntButton>
              </Space>
            </Col>
          )}
        </Row>
      )}
      <div className={css.listingPanel}>
        {queryInProgress && <Loader messageId={loadingMessageId} />}
        {queryListingsError && <Error messageId={errorMessageId} />}
        {enableGrid && listingGridRenderer}
      </div>
    </div>
  );

  return (
    <div className={css.root}>
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id={titleMessageId} />
      </H3>
      <div>
        <Tabs
          defaultActiveKey={currentListingType}
          onChange={onTabChange}
          items={tabs.map(tab => ({ ...tab, children: contentRenderer }))}
        />
        {enablePagination && (
          <Pagination pageName={pageName} pageSearchParams={{ page }} pagination={pagination} />
        )}
      </div>
    </div>
  );
};

ListingTabs.defaultProps = {
  listings: [],
  pagination: null,
  queryListingsError: null,
  queryParams: null,
  loadingMessageId: 'ManageListingsPage.loadingOwnListings',
  errorMessageId: 'ManageListingsPage.queryError',
};

ListingTabs.propTypes = {
  listings: arrayOf(oneOfType([propTypes.listing, propTypes.ownListing])),
  pagination: propTypes.pagination,
  queryInProgress: bool.isRequired,
  queryListingsError: propTypes.error,
  queryParams: object,
  loadingMessageId: string,
  errorMessageId: string,
  onTabChange: func,
};

export default ListingTabs;
