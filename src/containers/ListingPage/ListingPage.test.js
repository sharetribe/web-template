import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createUser,
  createCurrentUser,
  createListing,
  createOwnListing,
  createReview,
} from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
  createFakeDispatch,
  dispatchedActions,
} from '../../util/testHelpers';

import { storableError } from '../../util/errors';

import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
  LISTING_STATE_CLOSED,
} from '../../util/types';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

import {
  showListingRequest,
  showListingError,
  showListing,
  loadData,
  setInitialValues,
  fetchReviewsRequest,
  fetchReviewsSuccess,
} from './ListingPage.duck';

import ActionBarMaybe from './ActionBarMaybe';
import { currentUserShowRequest, currentUserShowSuccess } from '../../ducks/user.duck';
import { authInfoRequest, authInfoSuccess } from '../../ducks/auth.duck';

const { UUID } = sdkTypes;
const { screen, waitFor, within } = testingLibrary;
const noop = () => null;

const listingTypes = [
  {
    id: 'sell-bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
  },
  {
    id: 'rent-bicycles-nightly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'night',
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
    },
    showConfig: {
      label: 'Cat',
      isDetail: true,
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
    enumOptions: [
      { option: 'feat_1', label: 'Feat 1' },
      { option: 'feat_2', label: 'Feat 2' },
      { option: 'feat_3', label: 'Feat 3' },
    ],
    filterConfig: {
      indexForSearch: true,
    },
    showConfig: {
      label: 'Amenities',
      searchMode: 'has_all',
      group: 'secondary',
    },
  },
];

const getConfig = variantType => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingTypes: {
      listingTypes,
    },
    listingFields: {
      listingFields,
    },
    categories: { categories },
    layout: {
      ...hostedConfig.layout,
      listingPage: { variantType },
    },
  };
};

const id = 'listing1';
const slug = 'listing1-title';
const publicData = {
  listingType: 'sell-bicycles', // Ensure listing field can be tied to listing type
  transactionProcessAlias: 'default-purchase/release-1',
  unitType: 'item',
  categoryLevel1: 'cats', // Ensure listing field can be tied to category
  cat: 'cat_1',
};
const listing1 = createListing(id, { publicData }, { author: createUser('user-1') });
const listing1Own = createOwnListing(id, {}, { author: createCurrentUser('user-1') });
const review = createReview(
  'review-id',
  {
    createdAt: new Date(Date.UTC(2023, 5, 19, 11, 34)),
    rating: 4,
    type: 'ofProvider',
    content: 'It was awesome!',
  },
  { author: createUser('reviewerA'), listing: listing1 }
);

// We'll initialize the store with relevant listing data
const initialState = {
  ListingPage: {
    id: listing1.id,
    showListingError: null,
    reviews: [review],
    fetchReviewsError: null,
    monthlyTimeSlots: {
      // '2022-03': {
      //   timeSlots: [],
      //   fetchTimeSlotsError: null,
      //   fetchTimeSlotsInProgress: null,
      // },
    },
    lineItems: null,
    fetchLineItemsInProgress: false,
    fetchLineItemsError: null,
    sendInquiryInProgress: false,
    sendInquiryError: null,
    inquiryModalOpenForListingId: null,
  },
  marketplaceData: {
    entities: {
      listing: {
        listing1,
      },
      ownListing: {
        listing1: listing1Own,
      },
    },
  },
};

describe('ListingPage variants', () => {
  const commonProps = {
    params: { id, slug },
    scrollingDisabled: false,
    onManageDisableScrolling: noop,
    callSetInitialValues: noop,
    onFetchTransactionLineItems: noop,
    onSendInquiry: noop,
    onInitializeCardPaymentData: noop,
    onFetchTimeSlots: noop,
  };

  it('has hero section in coverPhoto mode', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('coverPhoto');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const listingRouteConfig = routeConfiguration.find(conf => conf.name === 'ListingPage');
    const ListingPage = listingRouteConfig.component;

    const { getByPlaceholderText, getByRole, queryAllByRole, getByText } = render(
      <ListingPage {...props} />,
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

      // Has hero (coverPhoto) section
      expect(screen.getByTestId('hero')).toBeInTheDocument();
      expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();

      // Has order title (rendered for )
      const orderTitle = queryAllByRole('heading', { name: 'ListingPage.orderTitle' });
      expect(orderTitle).toHaveLength(3);

      // Has details section title and selected category info
      expect(getByRole('heading', { name: 'ListingPage.detailsTitle' })).toBeInTheDocument();
      expect(getByText('Cat')).toBeInTheDocument();
      expect(getByText('Cat 1')).toBeInTheDocument();

      // Has details location title
      expect(getByRole('heading', { name: 'ListingPage.locationTitle' })).toBeInTheDocument();

      // Has details reviews title
      const reviewsTitle = getByRole('heading', { name: 'ListingPage.reviewsTitle' });
      expect(reviewsTitle).toBeInTheDocument();
      const sectionReviews = within(reviewsTitle.parentNode.parentNode);
      expect(sectionReviews.getByText('It was awesome!')).toBeInTheDocument();
      expect(sectionReviews.getByText('reviewerA display name')).toBeInTheDocument();
      expect(sectionReviews.getByText('June 2023')).toBeInTheDocument();
      expect(sectionReviews.getAllByTitle('4/5')).toHaveLength(2);

      // Has details provider/author title
      expect(getByRole('heading', { name: 'ListingPage.aboutProviderTitle' })).toBeInTheDocument();
      // Has link to provider's profile
      expect(getByRole('link', { name: 'UserCard.viewProfileLink' })).toBeInTheDocument();
      // Has button to contact provider
      expect(getByRole('button', { name: 'UserCard.contactUser' })).toBeInTheDocument();
    });
  });

  it('has carousel on carousel mode', async () => {
    // Select correct SearchPage variant according to route configuration
    const config = getConfig('carousel');
    const routeConfiguration = getRouteConfiguration(config.layout);
    const props = { ...commonProps };
    const listingRouteConfig = routeConfiguration.find(conf => conf.name === 'ListingPage');
    const ListingPage = listingRouteConfig.component;

    const { getByPlaceholderText, getByRole, queryAllByRole, getByText } = render(
      <ListingPage {...props} />,
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

      // Does not have hero (coverPhoto) section on carousel mode
      expect(screen.getByTestId('carousel')).toBeInTheDocument();
      expect(screen.queryByTestId('hero')).not.toBeInTheDocument();

      // Has order title (rendered for )
      const orderTitle = queryAllByRole('heading', { name: 'ListingPage.orderTitle' });
      expect(orderTitle).toHaveLength(3);

      // Has details section title and selected category info
      expect(getByRole('heading', { name: 'ListingPage.detailsTitle' })).toBeInTheDocument();
      expect(getByText('Cat')).toBeInTheDocument();
      expect(getByText('Cat 1')).toBeInTheDocument();

      // Has details location title
      expect(getByRole('heading', { name: 'ListingPage.locationTitle' })).toBeInTheDocument();

      // Has details reviews title
      const reviewsTitle = getByRole('heading', { name: 'ListingPage.reviewsTitle' });
      expect(reviewsTitle).toBeInTheDocument();
      const sectionReviews = within(reviewsTitle.parentNode.parentNode);
      expect(sectionReviews.getByText('It was awesome!')).toBeInTheDocument();
      expect(sectionReviews.getByText('reviewerA display name')).toBeInTheDocument();
      expect(sectionReviews.getByText('June 2023')).toBeInTheDocument();
      expect(sectionReviews.getAllByTitle('4/5')).toHaveLength(2);

      // Has details provider/author title
      expect(getByRole('heading', { name: 'ListingPage.aboutProviderTitle' })).toBeInTheDocument();
      // Has link to provider's profile
      expect(getByRole('link', { name: 'UserCard.viewProfileLink' })).toBeInTheDocument();
      // Has button to contact provider
      expect(getByRole('button', { name: 'UserCard.contactUser' })).toBeInTheDocument();
    });
  });
});

describe('Duck', () => {
  const listingFields = [];
  const config = {
    layout: {
      listingImage: {
        aspectWidth: 400,
        aspectHeight: 400,
        variantPrefix: 'listing-card',
      },
    },
    listing: {
      listingFields,
    },
    accessControl: { marketplace: { private: true } },
  };

  it('showListing() success', () => {
    const id = new UUID('00000000-0000-0000-0000-000000000000');
    const dispatch = jest.fn(action => action);
    const response = { status: 200 };
    const show = jest.fn(() => Promise.resolve(response));
    const sdk = { listings: { show }, currentUser: { show } };

    return showListing(id, config)(dispatch, null, sdk).then(data => {
      expect(data).toEqual(response);
      expect(show.mock.calls).toEqual([
        [
          expect.objectContaining({
            id,
            'imageVariant.listing-card': 'w:400;h:400;fit:crop',
            'imageVariant.listing-card-2x': 'w:800;h:800;fit:crop',
            include: ['author', 'author.profileImage', 'images', 'currentStock'],
          }),
        ],
      ]);
      expect(dispatch.mock.calls).toEqual([
        [showListingRequest(id)],
        [expect.anything()], // fetchCurrentUser() call
        [addMarketplaceEntities(data, { listingFields })],
      ]);
    });
  });

  it('showListing() error', () => {
    const id = new UUID('00000000-0000-0000-0000-000000000000');
    const dispatch = jest.fn(action => action);
    const error = new Error('fail');
    const show = jest.fn(() => Promise.reject(error));
    const sdk = { listings: { show } };

    // Calling sdk.listings.show is expected to fail now

    return showListing(id, config)(dispatch, null, sdk).then(data => {
      expect(show.mock.calls).toEqual([
        [
          expect.objectContaining({
            id,
            'imageVariant.listing-card': 'w:400;h:400;fit:crop',
            'imageVariant.listing-card-2x': 'w:800;h:800;fit:crop',
            include: ['author', 'author.profileImage', 'images', 'currentStock'],
          }),
        ],
      ]);
      expect(dispatch.mock.calls).toEqual([
        [showListingRequest(id)],
        [expect.anything()], // fetchCurrentUser() call
        [showListingError(storableError(error))],
      ]);
    });
  });

  // Shared parameters for viewing rights loadData tests
  const fakeResponse = resource => ({ data: { data: resource, include: [] } });
  const sdkFn = response => jest.fn(() => Promise.resolve(response));

  const sanitizeConfig = { listingFields };

  it("loadData() for currentUser with full viewing rights loads someone else's listing", () => {
    const uuid = new UUID(id);
    const currentUser = createCurrentUser('currentUser');
    const getState = () => ({
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    });

    // For users with full viewing rights, ListingPage.showListing
    // uses listings.show endpoint
    const sdk = {
      listings: { show: sdkFn(fakeResponse(listing1)) },
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      authInfo: sdkFn({}),
      reviews: { query: sdkFn(fakeResponse(review)) },
    };

    const dispatch = createFakeDispatch(getState, sdk);

    // Tests the actions that get dispatched to the Redux store when ListingPage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id }, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        setInitialValues({ inquiryModalOpenForListingId: null, lineItems: null }),
        showListingRequest(uuid),
        currentUserShowRequest(),
        fetchReviewsRequest(uuid),
        currentUserShowSuccess(currentUser),
        addMarketplaceEntities(fakeResponse(listing1), sanitizeConfig),
        fetchReviewsSuccess([review]),
        authInfoRequest(),
        authInfoSuccess({}),
      ]);
    });
  });

  it("loadData() for currentUser with no viewing rights does not load someone else's listing", () => {
    const uuid = new UUID(id);
    const currentUser = createCurrentUser('currentUser');
    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';
    const getState = () => ({
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    });

    const error = new Error({ status: 403, message: 'forbidden' });

    // For viewing rights restricted users, ListingPage.showListing
    // users ownListings.show endpoint, which throws 403 when accessing
    // a listing that is not the current user's own
    const sdk = {
      ownListings: { show: jest.fn(() => Promise.reject(error)) },
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      authInfo: sdkFn({}),
    };

    const dispatch = createFakeDispatch(getState, sdk);

    // Tests the actions that get dispatched to the Redux store when ListingPage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id }, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        setInitialValues({ inquiryModalOpenForListingId: null, lineItems: null }),
        showListingRequest(uuid),
        currentUserShowRequest(),
        currentUserShowSuccess(currentUser),
        authInfoRequest(),
        showListingError(storableError(error)),
        authInfoSuccess({}),
      ]);
    });
  });

  it("loadData() for currentUser with no viewing rights loads the user's own listing", () => {
    const uuid = new UUID(id);
    const currentUser = createCurrentUser('currentUser');
    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';
    const getState = () => ({
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    });

    // For viewing rights restricted users, ListingPage.showListing
    // users ownListings.show endpoint, which fetches the user's
    // own listings successfully.
    const sdk = {
      ownListings: { show: sdkFn(fakeResponse(listing1Own)) },
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      authInfo: sdkFn({}),
    };

    const dispatch = createFakeDispatch(getState, sdk);

    // Tests the actions that get dispatched to the Redux store when ListingPage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id }, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        setInitialValues({ inquiryModalOpenForListingId: null, lineItems: null }),
        showListingRequest(uuid),
        currentUserShowRequest(),
        currentUserShowSuccess(currentUser),
        addMarketplaceEntities(fakeResponse(listing1Own), sanitizeConfig),
        authInfoRequest(),
        authInfoSuccess({}),
      ]);
    });
  });
});

describe('ActionBarMaybe', () => {
  it('shows users own listing status', () => {
    const listing = createListing('listing-published', {
      state: LISTING_STATE_PUBLISHED,
    });
    render(
      <ActionBarMaybe
        isOwnListing
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );

    expect(screen.getByText('ListingPage.ownListing')).toBeInTheDocument();
    expect(screen.getByText('ListingPage.editListing')).toBeInTheDocument();
  });

  it('shows users own pending listing status', () => {
    const listing = createListing('listing-published', {
      state: LISTING_STATE_PENDING_APPROVAL,
    });
    render(
      <ActionBarMaybe
        isOwnListing
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(screen.getByText('ListingPage.ownListingPendingApproval')).toBeInTheDocument();
    expect(screen.getByText('ListingPage.editListing')).toBeInTheDocument();
  });

  it('shows users own closed listing status', () => {
    const listing = createListing('listing-closed', {
      state: LISTING_STATE_CLOSED,
    });
    render(
      <ActionBarMaybe
        isOwnListing
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(screen.getByText('ListingPage.ownClosedListing')).toBeInTheDocument();
    expect(screen.getByText('ListingPage.editListing')).toBeInTheDocument();
  });

  it('shows closed listing status', () => {
    const listing = createListing('listing-closed', {
      state: LISTING_STATE_CLOSED,
    });
    render(
      <ActionBarMaybe
        isOwnListing={false}
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(screen.getByText('ListingPage.closedListing')).toBeInTheDocument();
  });

  it("is missing if listing is published but not user's own", () => {
    const listing = createListing('listing-published', {
      state: LISTING_STATE_PUBLISHED,
    });
    const actionBar = render(
      <ActionBarMaybe
        isOwnListing={false}
        listing={listing}
        editParams={{ id: 'id1', slug: 'asdf', type: 'edit', tab: 'details' }}
      />
    );
    expect(actionBar.asFragment().firstChild).toBeNull();
  });
});
