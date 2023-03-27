import React from 'react';
import '@testing-library/jest-dom';

import { createListing, fakeIntl } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
} from '../../util/testHelpers';

import { SearchPageComponent as SearchPageWithGrid } from './SearchPageWithGrid';
import { SearchPageComponent as SearchPageWithMap } from './SearchPageWithMap';

const { screen } = testingLibrary;

const noop = () => null;

const listingTypes = [
  {
    listingType: 'rent-bicycles-daily',
    transactionType: {
      process: 'default-booking',
      alias: 'default-booking/release-1',
      unitType: 'day',
    },
  },
  {
    listingType: 'rent-bicycles-nightly',
    transactionType: {
      process: 'default-booking',
      alias: 'default-booking/release-1',
      unitType: 'night',
    },
  },
  {
    listingType: 'rent-bicycles-hourly',
    transactionType: {
      process: 'default-booking',
      alias: 'default-booking/release-1',
      unitType: 'hour',
    },
  },
  {
    listingType: 'sell-bicycles',
    transactionType: {
      process: 'default-purchase',
      alias: 'default-purchase/release-1',
      unitType: 'item',
    },
  },
];

const listingFieldsConfig = [
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

describe('SearchPageWithGrid', () => {
  const props = {
    location: { search: '' },
    history: {
      push: () => console.log('HistoryPush called'),
    },
    listings: [createListing('l1'), createListing('l2')],
    pagination: {
      page: 1,
      perPage: 12,
      totalItems: 22,
      totalPages: 2,
    },
    tab: 'listings',
    scrollingDisabled: false,
    searchInProgress: false,
    authInProgress: false,
    currentUserHasListings: false,
    listingsAreLoaded: true,
    intl: fakeIntl,
    isAuthenticated: false,
    onActivateListing: noop,
    onLogout: noop,
    onManageDisableScrolling: noop,
    onSearchMapListings: noop,
    sendVerificationEmailInProgress: false,
    onResendVerificationEmail: noop,
    config: {
      currency: 'USD',
      listing: {
        listingFields: listingFieldsConfig,
        listingTypes,
      },
      search: {
        mainSearch: {
          searchType: 'location',
        },
        defaultFilters: defaultFiltersConfig,
        sortConfig: sortConfig,
      },
      maps: {
        search: {
          sortSearchByDistance: false,
        },
      },
      layout: {
        searchPage: { variantType: 'grid' },
      },
    },
    routeConfiguration: getRouteConfiguration(),
  };

  test('Check that filterColumn exists', () => {
    render(<SearchPageWithGrid {...props} />);
    const filterColumnAside = 'filterColumnAside';
    expect(screen.getByTestId(filterColumnAside)).toBeInTheDocument();
    const searchMapContainer = 'searchMapContainer';
    expect(screen.queryByTestId(searchMapContainer)).not.toBeInTheDocument();
  });

  test('Check that map exists', () => {
    render(<SearchPageWithMap {...props} />);
    const filterColumnAside = 'filterColumnAside';
    expect(screen.queryByTestId(filterColumnAside)).not.toBeInTheDocument();
    const searchMapContainer = 'searchMapContainer';
    expect(screen.getByTestId(searchMapContainer)).toBeInTheDocument();
  });
});
