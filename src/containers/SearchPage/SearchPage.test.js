import React from 'react';
import { getRouteConfiguration, renderShallow } from '../../util/test-helpers';
import { fakeIntl } from '../../util/test-data';
import { SearchPageComponent } from './SearchPageWithList';

const noop = () => null;

const transactionTypes = [
  {
    type: 'rent-bicycles-daily',
    process: 'default-booking',
    alias: 'release-1',
    unitType: 'day',
  },
  {
    type: 'rent-bicycles-nightly',
    process: 'default-booking',
    alias: 'release-1',
    unitType: 'night',
  },
  {
    type: 'rent-bicycles-hourly',
    process: 'default-booking',
    alias: 'release-1',
    unitType: 'hour',
  },
  {
    type: 'sell-bicycles',
    process: 'default-buying-products',
    alias: 'release-1',
    unitType: 'item',
  },
];

const listingExtendedDataConfig = [
  {
    key: 'category',
    scope: 'public',
    includeForTransactionTypes: ['sell-bicycles'],
    schemaType: 'enum',
    schemaOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Category',
      group: 'primary',
    },
    listingPageConfig: {
      label: 'Category',
    },
    editListingPageConfig: {
      label: 'Category',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    includeForTransactionTypes: [
      'rent-bicycles-daily',
      'rent-bicycles-nightly',
      'rent-bicycles-hourly',
    ],
    schemaType: 'multi-enum',
    schemaOptions: [{ option: 'dog_1', label: 'Dog 1' }, { option: 'dog_2', label: 'Dog 2' }],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Amenities',
      //searchMode: 'has_all',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Category',
    },
    editListingPageConfig: {
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

describe('SearchPageWithList', () => {
  it('matches snapshot', () => {
    const props = {
      location: { search: '' },
      history: {
        push: () => console.log('HistoryPush called'),
      },
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
      intl: fakeIntl,
      isAuthenticated: false,
      onActivateListing: noop,
      onLogout: noop,
      onManageDisableScrolling: noop,
      onSearchMapListings: noop,
      sendVerificationEmailInProgress: false,
      onResendVerificationEmail: noop,
      config: {
        listing: {
          listingExtendedData: listingExtendedDataConfig,
        },
        search: {
          mainSearchType: 'location',
          defaultFilters: defaultFiltersConfig,
          sortConfig: sortConfig,
        },
        transaction: {
          transactionTypes,
        },
        maps: {
          search: {
            sortSearchByDistance: false,
          },
        },
        layout: {
          searchPageVariant: 'list',
        },
      },
      routeConfiguration: getRouteConfiguration(),
    };
    const tree = renderShallow(<SearchPageComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
