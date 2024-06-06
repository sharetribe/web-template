import React from 'react';
import '@testing-library/jest-dom';

import { createListing } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
} from '../../util/testHelpers';

const { screen, waitFor } = testingLibrary;

const noop = () => null;

const listingTypes = [
  {
    id: 'rent-bicycles-daily',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'day',
  },
  {
    id: 'rent-bicycles-nightly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'night',
  },
  {
    id: 'rent-bicycles-hourly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'hour',
  },
  {
    id: 'sell-bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
  },
];

const listingFields = [
  {
    key: 'category',
    scope: 'public',
    includeForListingTypes: ['sell-bicycles'],
    schemaType: 'enum',
    enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Category',
      group: 'primary',
    },
    showConfig: {
      label: 'Category',
    },
    saveConfig: {
      label: 'Category',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    includeForListingTypes: [
      'rent-bicycles-daily',
      'rent-bicycles-nightly',
      'rent-bicycles-hourly',
    ],
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'dog_1', label: 'Dog 1' }, { option: 'dog_2', label: 'Dog 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Amenities',
      //searchMode: 'has_all',
      group: 'secondary',
    },
    showConfig: {
      label: 'Category',
    },
    saveConfig: {
      label: 'Category',
    },
  },
];

const defaultFiltersConfig = [
  {
    key: 'price',
    schemaType: 'price',
    label: 'Price',
    // Note: unlike most prices this is not handled in subunits
    min: 0,
    max: 1000,
    step: 5,
  },
  {
    key: 'keywords',
    schemaType: 'text',
    label: 'Keyword',
  },
];

const sortConfig = {
  active: true,
  queryParamName: 'sort',
  relevanceKey: 'relevance',
  conflictingFilters: [],
  options: [
    { key: 'createdAt', label: 'Newest' },
    { key: '-createdAt', label: 'Oldest' },
    { key: '-price', label: 'Lowest price' },
    { key: 'price', label: 'Highest price' },
    { key: 'relevance', label: 'Relevance', longLabel: 'Relevance (Keyword search)' },
  ],
};

const getConfig = variantType => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingFields: {
      listingFields,
    },
    listingTypes: {
      listingTypes,
    },
    search: {
      ...hostedConfig.search,
      mainSearch: {
        searchType: 'location',
      },
      defaultFilters: defaultFiltersConfig,
      sortConfig: sortConfig,
    },
    layout: {
      ...hostedConfig.layout,
      searchPage: { variantType },
    },
  };
};

describe('SearchPage', () => {
  const l1 = createListing('l1');
  const l2 = createListing('l2');

  // We'll initialize the store with relevant listing data
  const initialState = {
    SearchPage: {
      currentPageResultIds: [l1.id, l2.id],
      pagination: {
        page: 1,
        perPage: 1,
        totalItems: 2,
        totalPages: 2,
      },
      searchInProgress: false,
      searchListingsError: null,
      searchParams: null,
      activeListingId: null,
    },
    marketplaceData: {
      entities: {
        listing: {
          l1,
          l2,
        },
      },
    },
  };

  const commonProps = {
    scrollingDisabled: false,
    onActivateListing: noop,
    onManageDisableScrolling: noop,
  };

  it('Check that filterColumn and filters exist in grid variant', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('grid');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const searchRouteConfig = routeConfiguration.find(conf => conf.name === 'SearchPage');
    const SearchPage = searchRouteConfig.component;

    const { getByPlaceholderText, getByText, getAllByText, queryByText } = render(
      <SearchPage {...props} />,
      {
        initialState,
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Has main search in Topbar and it's a location search.
      expect(getByPlaceholderText('TopbarSearchForm.placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('location-search')).toBeInTheDocument();

      // Has filter column
      expect(screen.getByTestId('filterColumnAside')).toBeInTheDocument();
      // Does not have search map container
      expect(screen.queryByTestId('searchMapContainer')).not.toBeInTheDocument();

      // Has SortBy component
      expect(getByText('MainPanelHeader.sortBy')).toBeInTheDocument();
      expect(getAllByText('Newest')).toHaveLength(4); // desktop and mobile dropdowns & selected
      expect(getAllByText('Oldest')).toHaveLength(2); // desktop and mobile dropdowns

      // Has Category filter (primary)
      expect(getByText('Category')).toBeInTheDocument();
      // Has(!) Amenities filter (secondary filter)
      expect(getByText('Amenities')).toBeInTheDocument();

      // Has Price filter
      expect(getByText('FilterComponent.priceLabel')).toBeInTheDocument();

      // Shows listings
      // Has listing with title
      expect(getByText('l1 title')).toBeInTheDocument();
      // Has listing with title
      expect(getByText('l2 title')).toBeInTheDocument();
      // 2 listings with the same price
      expect(getAllByText('$55.00')).toHaveLength(2);
    });
  });

  it('Check that map and filters exist in map variant', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('map');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const searchRouteConfig = routeConfiguration.find(conf => conf.name === 'SearchPage');
    const SearchPage = searchRouteConfig.component;

    const { getByPlaceholderText, getByText, getAllByText, queryByText } = render(
      <SearchPage {...props} />,
      {
        initialState,
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Has main search in Topbar and it's a location search.
      expect(getByPlaceholderText('TopbarSearchForm.placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('location-search')).toBeInTheDocument();

      // Does not have filter column
      expect(screen.queryByTestId('filterColumnAside')).not.toBeInTheDocument();
      // Has search map container
      expect(screen.getByTestId('searchMapContainer')).toBeInTheDocument();

      // Has SortBy component
      expect(getByText('MainPanelHeader.sortBy')).toBeInTheDocument();
      expect(getAllByText('Newest')).toHaveLength(4); // desktop and mobile dropdowns & selected
      expect(getAllByText('Oldest')).toHaveLength(2); // desktop and mobile dropdowns

      // Has Category filter (primary)
      expect(getByText('Category')).toBeInTheDocument();
      // Does not have Amenities filter (secondary)
      expect(queryByText('Amenities')).not.toBeInTheDocument();

      // Has "more filters" button for secondary filters
      expect(getByText('SearchFiltersPrimary.moreFiltersButton')).toBeInTheDocument();

      // Has Price filter
      expect(getByText('FilterComponent.priceLabel')).toBeInTheDocument();

      // Shows listings
      // Has listing with title
      expect(getByText('l1 title')).toBeInTheDocument();
      // Has listing with title
      expect(getByText('l2 title')).toBeInTheDocument();
      // 2 listings with the same price
      expect(getAllByText('$55.00')).toHaveLength(2);
    });
  });
});
