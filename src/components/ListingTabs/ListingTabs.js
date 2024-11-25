import React from 'react';
import { useHistory } from 'react-router-dom';
import { arrayOf, oneOfType, bool, object, string, func } from 'prop-types';
import { Flex, Space, Tabs } from 'antd';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage } from '../../util/reactIntl';
import { createResourceLocatorString, pathByRouteName } from '../../util/routes';
import { LISTING_TYPES, LISTING_GRID_ROLE, LISTING_GRID_DEFAULTS, propTypes } from '../../util/types';

import {
  Button,
  H3,
  NamedLink,
} from '../';

import { Loader, Error, Pagination, getSearch, getTabsFeaturesForRole } from './GridHelpers'

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
  const enableGrid = listingsAreLoaded && !queryListingsError;
  const enablePagination = listingsAreLoaded && pagination && pagination.totalPages > 1
  const page = queryParams ? queryParams.page : 1;
  const { pageName, tabs, enableCategoryTabs, enableListingManagement } = getTabsFeaturesForRole(role);









  const goToCreateListing = () => {
    const destination = createResourceLocatorString('BatchEditListingPage', routeConfiguration, {
      category: currentCategoryType,
      type: 'new',
      tab: 'upload',
    });
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
      {listings.map(listing => (
        listingRenderer(listing, css.listingCard, renderSizes)
      ))}
    </div>
  );

  const contentRenderer = (
    <div>
      {enableCategoryTabs && (
        <Flex className={css.filters}>
          <Flex className={css.categories}>
            <Space
              direction="horizontal"
              size="middle"
              className={css.productTypeFilters}
              hidden={currentListingType !== LISTING_TYPES.PRODUCT}
            >
              {categories.map(category => (
                <NamedLink
                  key={category.id}
                  name={pageName}
                  active={currentCategoryType === category.id}
                  activeClassName={css.filterLinkActive}
                  to={{ search: getSearch(category.id, currentListingType) }}
                >
                  {category.name}
                </NamedLink>
              ))}
            </Space>
          </Flex>
          {enableListingManagement && (
            <Flex align="flex-end" style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Space size="middle">
                <Button style={{ width: 200 }} onClick={goToCreateListing}>







                  Add New Photo(s)






                </Button>
              </Space>
            </Flex>
          )}
        </Flex>
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
          <Pagination
            pageName={pageName}
            pageSearchParams={{ page }}
            pagination={pagination}
          />
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
