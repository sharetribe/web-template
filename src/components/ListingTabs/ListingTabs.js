import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button as AntButton, Col, Row, Space, Tabs } from 'antd';
import classNames from 'classnames';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { LISTING_GRID_ROLE, LISTING_GRID_DEFAULTS, LISTING_TAB_TYPES } from '../../util/types';
import { PAGE_MODE_EDIT, PAGE_MODE_NEW } from '../../containers/BatchEditListingPage/constants';

import { H3, ScrollableLinks } from '../';
import { Loader, Error, Pagination, getTabsFeaturesForRole } from './GridHelpers';

import css from './ListingTabs.module.css';

export const ListingTabs = ({
  items = [],
  pagination,
  queryInProgress,
  queryListingsError,
  queryParams,
  onTabChange,
  categories,
  currentCategory,
  listingRenderer,
  role = LISTING_GRID_ROLE.MANAGE,
  hideReviews = false,
  title,
  noResultsMessageId,
  loadingMessageId,
  errorMessageId,
}) => {
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();

  const listingsAreLoaded = !queryInProgress;
  const defaultListingType = LISTING_GRID_DEFAULTS.TYPE;
  const currentListingType = queryParams.pub_listingType || defaultListingType;
  const hasNoResults = listingsAreLoaded && !items.length;
  const withCategories = !!(categories && categories.length);
  const enableGrid = listingsAreLoaded && !queryListingsError;
  const enablePagination = listingsAreLoaded && pagination && pagination.totalPages > 1;
  const page = queryParams ? queryParams.page : 1;
  const { pageName, tabs, enableCategoryTabs, enableListingManagement } = getTabsFeaturesForRole(
    role,
    hideReviews
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

  const gridClassname = classNames({
    [css.listingCards]:
      role !== LISTING_GRID_ROLE.PROFILE ||
      ![LISTING_TAB_TYPES.REVIEWS, LISTING_TAB_TYPES.PROFILE].includes(currentListingType),
  });
  const listingGridRenderer = hasNoResults ? (
    <div className={css.messagePanel}>
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id={noResultsMessageId} />
      </H3>
    </div>
  ) : (
    <div className={gridClassname}>
      {items.map((item, index) => listingRenderer(item, css.listingCard, renderSizes, index))}
    </div>
  );

  const contentRenderer = (
    <div>
      {enableCategoryTabs && (
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={16}>
            {withCategories && (
              <ScrollableLinks links={categories} selectedLinkId={currentCategory} />
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
                      category: currentCategory,
                      type: currentListingType,
                    })
                  }
                >
                  <FormattedMessage id="ListingTabs.manageButton" />
                </AntButton>
                <AntButton
                  type="primary"
                  className={css.actionButton}
                  onClick={() => goToManageListing()}
                >
                  <FormattedMessage id="ListingTabs.addButton" />
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
      {title}
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

export default ListingTabs;
