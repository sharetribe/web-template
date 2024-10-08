import React from 'react';
import '@testing-library/jest-dom';

import { createImageVariantConfig } from '../../util/sdkLoader';
import { createCurrentUser, createListing } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
  createFakeDispatch,
  dispatchedActions,
} from '../../util/testHelpers';

import { loadData, searchListingsRequest, searchListingsSuccess } from './SearchPage.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

const { screen, userEvent, waitFor } = testingLibrary;

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

const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
const addSpaces = str => str.split('-').join(' ');
const labelize = str => addSpaces(capitalizeFirstLetter(str));

const generateCategories = optionStrings => {
  return optionStrings.reduce((converted, entry) => {
    const isArray = Array.isArray(entry);
    const option = isArray
      ? { id: entry[0], name: labelize(entry[0]), subcategories: generateCategories(entry[1]) }
      : { id: entry, name: labelize(entry) };
    return [...converted, option];
  }, []);
};
const categories = generateCategories([
  ['dogs', ['labradors', 'poodles']],
  ['cats', ['burmese', 'egyptian-mau']],
  ['fish', [['freshwater', ['grayling', 'arctic-char', 'pike']], 'saltwater']],
  ['birds', ['parrot', 'macaw']],
]);
//console.log(JSON.stringify(categories, null, 2));

const listingFields = [
  {
    // Formerly used for category, but now there's dedicated category setup
    key: 'cat',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['sell-bicycles'],
    },
    categoryConfig: {
      limitToCategoryIds: true,
      categoryIds: ['cats'],
    },
    schemaType: 'enum',
    enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Cat',
      group: 'primary',
    },
    showConfig: {
      label: 'Cat',
    },
    saveConfig: {
      label: 'Cat',
    },
  },
  {
    key: 'singleSelectTest',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['sell-bicycles'],
    },
    schemaType: 'enum',
    enumOptions: [{ option: 'enum1', label: 'Enum 1' }, { option: 'enum2', label: 'Enum 2' }],
    filterConfig: {
      indexForSearch: true,
      filterType: 'SelectSingleFilter',
      label: 'Single Select Test',
      group: 'primary',
    },
    showConfig: {
      label: 'Single Select Test',
    },
    saveConfig: {
      label: 'Single Select Test',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['rent-bicycles-daily', 'rent-bicycles-nightly', 'rent-bicycles-hourly'],
    },
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'dog_1', label: 'Dog 1' }, { option: 'dog_2', label: 'Dog 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Amenities',
      //searchMode: 'has_all',
      group: 'secondary',
    },
    showConfig: {
      label: 'Amenities',
    },
    saveConfig: {
      label: 'Amenities',
    },
  },
];

const defaultFiltersConfig = [
  {
    key: 'categoryLevel',
    schemaType: 'category',
    scope: 'public',
    isNestedEnum: true,
    nestedParams: ['categoryLevel1', 'categoryLevel2', 'categoryLevel3'],
  },
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

const getConfig = (variantType, customListingFields) => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingFields: {
      listingFields: customListingFields || listingFields,
    },
    listingTypes: {
      listingTypes,
    },
    categories: { categories },
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

const getSearchParams = config => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;
  return {
    page: 1,
    perPage: 24,
    include: ['author', 'images'],
    'fields.listing': [
      'title',
      'geolocation',
      'price',
      'deleted',
      'state',
      'publicData.listingType',
      'publicData.transactionProcessAlias',
      'publicData.unitType',
      // These help rendering of 'purchase' listings,
      // when transitioning from search page to listing page
      'publicData.pickupEnabled',
      'publicData.shippingEnabled',
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': [
      'variants.scaled-small',
      'variants.scaled-medium',
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    'limit.images': 1,
  };
};

describe('SearchPage', () => {
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

    const { getByPlaceholderText, getByText, getAllByText, queryByText, getByRole } = render(
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

      // Has no Cat filter (primary filter tied to 'Cats' category)
      expect(queryByText('Cat')).not.toBeInTheDocument();
      // Has(!) Amenities filter (secondary filter)
      expect(getByText('Amenities')).toBeInTheDocument();
      // Has Single Select Test filter
      expect(getByText('Single Select Test')).toBeInTheDocument();
      expect(getByText('Enum 1')).toBeInTheDocument();
      expect(getByText('Enum 2')).toBeInTheDocument();

      // Has Category filter
      expect(getByText('FilterComponent.categoryLabel')).toBeInTheDocument();
      expect(getByText('Dogs')).toBeInTheDocument();
      expect(queryByText('Poodle')).not.toBeInTheDocument();
      expect(getByText('Cats')).toBeInTheDocument();
      expect(queryByText('Burmese')).not.toBeInTheDocument();
      expect(getByText('Fish')).toBeInTheDocument();
      expect(queryByText('Freshwater')).not.toBeInTheDocument();

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

    // Test category intercation: click "Fish"
    await waitFor(() => {
      userEvent.click(getByRole('button', { name: 'Fish' }));
    });

    expect(getByText('Dogs')).toBeInTheDocument();
    expect(queryByText('Poodle')).not.toBeInTheDocument();
    expect(getByText('Cats')).toBeInTheDocument();
    expect(queryByText('Burmese')).not.toBeInTheDocument();
    // Subcategories of Fish should be visible
    expect(getByText('Fish')).toBeInTheDocument();
    expect(getByText('Freshwater')).toBeInTheDocument();
    expect(getByText('Saltwater')).toBeInTheDocument();
  });

  it('Check that map and filters exist in map variant', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('map');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const searchRouteConfig = routeConfiguration.find(conf => conf.name === 'SearchPage');
    const SearchPage = searchRouteConfig.component;

    const { getByPlaceholderText, getByText, getAllByText, queryByText, getByRole } = render(
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

      // Has no Cat filter (primary filter tied to 'Cats' category)
      expect(queryByText('Cat')).not.toBeInTheDocument();
      // Does not have Amenities filter (secondary)
      expect(queryByText('Amenities')).not.toBeInTheDocument();
      // Has Single Select Test filter
      expect(getByText('Single Select Test')).toBeInTheDocument();
      expect(queryByText('Enum 1')).not.toBeInTheDocument();
      expect(queryByText('Enum 2')).not.toBeInTheDocument();

      // Has Category filter
      expect(getByText('FilterComponent.categoryLabel')).toBeInTheDocument();
      expect(queryByText('Dogs')).not.toBeInTheDocument();
      expect(queryByText('Cats')).not.toBeInTheDocument();
      expect(queryByText('Fish')).not.toBeInTheDocument();

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

    // Test category intercation
    await waitFor(() => {
      userEvent.click(getByRole('button', { name: 'FilterComponent.categoryLabel' }));
    });
    expect(getByText('Dogs')).toBeInTheDocument();
    expect(queryByText('Poodle')).not.toBeInTheDocument();
    expect(getByText('Cats')).toBeInTheDocument();
    expect(queryByText('Burmese')).not.toBeInTheDocument();
    expect(getByText('Fish')).toBeInTheDocument();
    expect(queryByText('Freshwater')).not.toBeInTheDocument();

    // Test category intercation: click "Fish"
    await waitFor(() => {
      userEvent.click(getByRole('button', { name: 'Fish' }));
    });
    expect(getByText('Dogs')).toBeInTheDocument();
    expect(queryByText('Poodle')).not.toBeInTheDocument();
    expect(getByText('Cats')).toBeInTheDocument();
    expect(queryByText('Burmese')).not.toBeInTheDocument();
    // Subcategories of Fish should be visible
    expect(getByText('Fish')).toBeInTheDocument();
    expect(getByText('Freshwater')).toBeInTheDocument();
    expect(getByText('Saltwater')).toBeInTheDocument();
  });

  it('Check that Cat filters is revealed in grid variant', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('grid');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const searchRouteConfig = routeConfiguration.find(conf => conf.name === 'SearchPage');
    const SearchPage = searchRouteConfig.component;

    const { getByPlaceholderText, getByText, getAllByText, queryByText, getByRole } = render(
      <SearchPage {...props} />,
      {
        initialState,
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Has no Cat filter (primary)
      expect(queryByText('Cat')).not.toBeInTheDocument();

      // Has Category filter
      expect(getByText('FilterComponent.categoryLabel')).toBeInTheDocument();
      expect(getByText('Dogs')).toBeInTheDocument();
      expect(queryByText('Poodle')).not.toBeInTheDocument();
      expect(getByText('Cats')).toBeInTheDocument();
      expect(queryByText('Burmese')).not.toBeInTheDocument();
      expect(getByText('Fish')).toBeInTheDocument();
      expect(queryByText('Freshwater')).not.toBeInTheDocument();
    });

    // Test category intercation: click "Fish"
    await waitFor(() => {
      userEvent.click(getByRole('button', { name: 'Cats' }));
    });

    // Has no Cat filter (primary)
    expect(getByText('Cat')).toBeInTheDocument();

    expect(getByText('Dogs')).toBeInTheDocument();
    expect(queryByText('Poodle')).not.toBeInTheDocument();
    expect(getByText('Cats')).toBeInTheDocument();
    // Subcategories of Cats should be visible
    expect(queryByText('Burmese')).toBeInTheDocument();
    expect(queryByText('Egyptian mau')).toBeInTheDocument();
    expect(getByText('Fish')).toBeInTheDocument();
    expect(queryByText('Freshwater')).not.toBeInTheDocument();
    expect(queryByText('Saltwater')).not.toBeInTheDocument();
  });
});

describe('Duck', () => {
  const defaultConfig = getConfig('map');

  const config = {
    ...defaultConfig,
    categoryConfiguration: {
      categories: [...defaultConfig.categories.categories],
      categoryLevelKeys: ['categoryLevel1', 'categoryLevel2', 'categoryLevel3'],
      key: 'categoryLevel',
      scope: 'public',
    },
    listing: {
      ...defaultConfig.listingFields,
      ...defaultConfig.listingTypes,
    },
    accessControl: { marketplace: { private: true } },
  };
  // Shared parameters for viewing rights loadData tests
  const fakeResponse = resource => ({ data: { data: resource, include: [] } });
  const sdkFn = response => jest.fn(() => Promise.resolve(response));
  const currentUser = createCurrentUser('userId');

  it('loadData() for full viewing rights user loads listings', () => {
    const getState = () => ({
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    });

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      listings: { query: sdkFn(fakeResponse([l1, l2])) },
      authInfo: sdkFn({}),
    };

    const dispatch = createFakeDispatch(getState, sdk);

    const searchParams = getSearchParams(config);
    const listingFields = config?.listing?.listingFields;
    const sanitizeConfig = { listingFields };

    // Tests the actions that get dispatched to the Redux store when SearchPage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update this test accordingly!
    return loadData(null, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        searchListingsRequest(searchParams),
        addMarketplaceEntities(fakeResponse([l1, l2]), sanitizeConfig),
        searchListingsSuccess(fakeResponse([l1, l2])),
      ]);
    });
  });

  it('loadData() for restricted viewing rights user does not load listings', () => {
    currentUser.effectivePermissionSet.attributes.read = 'permissions/deny';

    const getState = () => ({
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    });

    const sdk = {};

    const dispatch = createFakeDispatch(getState, sdk);

    // Tests the actions that get dispatched to the Redux store when SearchPage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update this test accordingly!
    return loadData(null, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([]);
    });
  });
});
