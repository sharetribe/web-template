import React from 'react';
import { getRouteConfiguration, renderShallow } from '../../util/test-helpers';
import { fakeIntl } from '../../util/test-data';
import { SearchPageComponent } from './SearchPageWithList';

const noop = () => null;

const listingExtendedDataConfig = [
  {
    key: 'category',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: ['Cat 1', 'Cat 2'],
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
    includeForProcessAliases: ['flex-booking-default-process/release-1'],
    schemaType: 'multi-enum',
    schemaOptions: ['Dog 1', 'Dog 2'],
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
          processes: ['flex-product-default-process', 'flex-booking-default-process'],
        },
        sortSearchByDistance: false,
      },
      routeConfiguration: getRouteConfiguration(),
    };
    const tree = renderShallow(<SearchPageComponent {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
