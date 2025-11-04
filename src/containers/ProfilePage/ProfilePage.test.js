import React, { act } from 'react';
import '@testing-library/jest-dom';

import configureStore from '../../store';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createCurrentUser,
  createListing,
  createReview,
  createUser,
  fakeIntl,
  fakeViewport,
} from '../../util/testData';
import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import ProfilePage from './ProfilePage';

import reducer, { loadData, setInitialState } from './ProfilePage.duck';
import { storableError } from '../../util/errors';

const { UUID } = sdkTypes;

const { screen } = testingLibrary;

const logger = actions => () => {
  return next => action => {
    actions.push(action);
    // Call the next dispatch method in the middleware chain.
    return next(action);
  };
};

const attributes = {
  profile: {
    bio: 'I am a great cook!',
    publicData: {
      canCook: false,
      cuisine: 'italian',
      dietaryPreferences: ['vegan', 'gluten-free'],
      kitchenDescription: 'This is a kitchen description!',
      numberOfCookbooks: 10,
      userType: 'a',
      notShownInProfileAttribute: 'Do not show this in profile',
    },
  },
};

// Passing 'attributes' directly to createCurrentUser and createUser
// overrides the default attributes.profile values with the custom ones.
// This function first creates the default version and then appends extra attributes
// without overriding the defaults.
const createEnhancedUser = (userFn, id) => {
  const user = userFn(id);
  return {
    ...user,
    attributes: {
      ...user.attributes,
      profile: {
        ...user.attributes.profile,
        bio: attributes.profile.bio,
        publicData: attributes.profile.publicData,
      },
    },
  };
};

const userId = 'userId';

const getInitialState = () => {
  const currentUser = createEnhancedUser(createCurrentUser, userId);
  const user = createEnhancedUser(createUser, userId);
  const listing = createListing('l1');
  const review = createReview(
    'review-id',
    {
      createdAt: new Date(Date.UTC(2024, 2, 19, 11, 34)),
      content: 'Awesome!',
    },
    { author: createUser('reviewerA') }
  );
  return {
    ProfilePage: {
      userId: user.id,
      userListingRefs: [{ id: listing.id, type: 'listing' }],
      userShowError: null,
      queryListingsError: null,
      reviews: [review],
      queryReviewsError: null,
    },
    user: {
      currentUser,
      currentUserHasListings: false,
      sendVerificationEmailInProgress: false,
    },
    marketplaceData: {
      entities: {
        user: {
          userId: user,
        },
        listing: {
          l1: { ...listing, relationships: { author: user } },
        },
      },
    },
  };
};

describe('ProfilePage', () => {
  const config = getHostedConfiguration();

  const props = {
    scrollingDisabled: false,
    intl: fakeIntl,
    viewport: fakeViewport,
    params: {},
  };

  it('Check that user name and bio is shown correctly', async () => {
    await act(async () => {
      render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });
    expect(screen.getByText('ProfilePage.desktopHeading')).toBeInTheDocument();
    expect(screen.getByText('I am a great cook!')).toBeInTheDocument();
  });

  it('Check that custom user information is shown correctly', async () => {
    let rendered = {};
    await act(async () => {
      rendered = render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });
    const { getByRole } = rendered;
    // Show custom fields correctly
    expect(getByRole('heading', { name: 'ProfilePage.detailsTitle' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Dietary preferences' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Description of your kitchen' })).toBeInTheDocument();

    expect(screen.getByText('Favorite cuisine')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Can you cook?')).toBeInTheDocument();
    expect(screen.getByText('ProfilePage.detailNo')).toBeInTheDocument();
    expect(screen.getByText('How many cookbooks do you have')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('This is a kitchen description!')).toBeInTheDocument();

    // For attributes with displayInProfile: false, do not show the attribute
    expect(screen.queryByText('Not shown in profile')).toBeNull();
  });

  it('Check that listing information is shown correctly', async () => {
    await act(async () => {
      render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });

    expect(screen.getByText('ProfilePage.listingsTitle')).toBeInTheDocument();
    expect(screen.getByText('l1 title')).toBeInTheDocument();
    expect(screen.getByText('ListingCard.price')).toBeInTheDocument();
  });

  it('Check that review information is shown correctly', async () => {
    let rendered = {};
    await act(async () => {
      rendered = render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });
    const { getByRole } = rendered;

    expect(
      getByRole('heading', { name: 'ProfilePage.reviewsFromMyCustomersTitle' })
    ).toBeInTheDocument();

    expect(screen.getByText('Awesome!')).toBeInTheDocument();
    expect(screen.getByText('reviewerA display name')).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getAllByTitle('3/5')).toHaveLength(2);
  });
});

describe('Duck', () => {
  const config = {
    ...getHostedConfiguration(),
    accessControl: { marketplace: { private: true } },
  };

  describe('reducer', () => {
    it('should have correct initial state', () => {
      const state = reducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        userId: null,
        userListingRefs: [],
        userShowError: null,
        queryListingsError: null,
        reviews: [],
        queryReviewsError: null,
      });
    });

    it('should handle setInitialState action', () => {
      // First set up a state with some data
      let state = reducer(undefined, { type: '@@INIT' });
      state = reducer(state, {
        type: 'ProfilePage/showUser/rejected',
        payload: storableError(new Error('Test error')),
      });
      state = reducer(state, {
        type: 'ProfilePage/queryUserListings/rejected',
        payload: storableError(new Error('Listings error')),
      });
      state = reducer(state, {
        type: 'ProfilePage/queryUserReviews/rejected',
        payload: storableError(new Error('Reviews error')),
      });

      // Now test setInitialState - it should reset to initial state
      state = reducer(state, setInitialState());

      expect(state).toEqual({
        userId: null,
        userListingRefs: [],
        userShowError: null,
        queryListingsError: null,
        reviews: [],
        queryReviewsError: null,
      });
    });

    it('should handle showUserThunk.pending', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const state = reducer(initialState, {
        type: 'ProfilePage/showUser/pending',
        meta: { arg: { userId: 'test-user-id', config } },
      });

      expect(state.userId).toBe('test-user-id');
      expect(state.userShowError).toBeNull();
    });

    it('should handle showUserThunk.rejected', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('Test error');
      const state = reducer(initialState, {
        type: 'ProfilePage/showUser/rejected',
        payload: storableError(error),
      });

      expect(state.userShowError).toEqual(storableError(error));
    });

    it('should handle queryUserListingsThunk.pending', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserListings/pending',
        meta: { arg: { userId: 'test-user-id' } },
      });

      expect(state.queryListingsError).toBeNull();
    });

    it('should handle queryUserListingsThunk.fulfilled', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const listingRefs = [{ id: 'listing1', type: 'listing' }];
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserListings/fulfilled',
        payload: { listingRefs, response: {} },
      });

      expect(state.userListingRefs).toEqual(listingRefs);
    });

    it('should handle queryUserListingsThunk.rejected', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('Listings error');
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserListings/rejected',
        payload: storableError(error),
      });

      expect(state.userListingRefs).toEqual([]);
      expect(state.queryListingsError).toEqual(storableError(error));
    });

    it('should handle queryUserReviewsThunk.pending', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserReviews/pending',
      });

      expect(state.queryReviewsError).toBeNull();
    });

    it('should handle queryUserReviewsThunk.fulfilled', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const reviews = [{ id: 'review1' }, { id: 'review2' }];
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserReviews/fulfilled',
        payload: reviews,
      });

      expect(state.reviews).toEqual(reviews);
    });

    it('should handle queryUserReviewsThunk.rejected', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('Reviews error');
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserReviews/rejected',
        payload: storableError(error),
      });

      expect(state.reviews).toEqual([]);
      expect(state.queryReviewsError).toEqual(storableError(error));
    });
  });

  // Shared parameters for viewing rights loadData tests
  const fakeResponse = resource => ({ data: { data: resource, include: [] } });
  const sdkFn = response => jest.fn(() => Promise.resolve(response));
  const forbiddenError = new Error({ status: 403, message: 'forbidden' });
  const errorSdkFn = error => jest.fn(() => Promise.reject(error));

  it("loadData() for full viewing rights user loads someone else's profile", () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    const { reviews, userListingRefs } = initialState.ProfilePage;
    const { l1: listing } = initialState.marketplaceData.entities.listing;
    const { userId: user } = initialState.marketplaceData.entities.user;

    const testInitialState = {
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    };

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      users: { show: sdkFn(fakeResponse(user)) },
      reviews: { query: sdkFn(fakeResponse(reviews)) },
      listings: { query: sdkFn(fakeResponse([listing])) },
      authInfo: sdkFn({}),
    };

    let actions = [];
    const store = configureStore({
      initialState: testInitialState,
      sdk,
      extraMiddlewares: [logger(actions)],
    });
    const dispatch = store.dispatch;
    const getState = store.getState;

    // This is now sanitizeConfig is parsed in the showUser thunk
    const userFields = config?.user?.userFields;
    const sanitizeConfig = { userFields };

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: userId }, null, config)(dispatch, getState, sdk).then(data => {
      const relevantActions = actions.filter(
        action => !action.type.startsWith('user/fetchCurrentUser/')
      );

      // Check that setInitialState is first
      expect(relevantActions[0]).toEqual(setInitialState());

      // Check that all pending actions are dispatched
      const pendingActions = relevantActions.filter(action => action.type.endsWith('/pending'));
      expect(pendingActions).toHaveLength(4); // showUser, queryUserListings, queryUserReviews, authInfo

      // Check that addMarketplaceEntities actions are dispatched
      const addEntitiesActions = relevantActions.filter(
        action => action.type === 'marketplaceData/addEntities'
      );
      expect(addEntitiesActions).toHaveLength(2); // user and listings

      // Check that all fulfilled actions are dispatched
      const fulfilledActions = relevantActions.filter(action => action.type.endsWith('/fulfilled'));
      expect(fulfilledActions).toHaveLength(4); // showUser, queryUserListings, queryUserReviews, authInfo

      // Verify specific action types are present
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/pending')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/pending')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/pending')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/pending')).toBe(true);
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/fulfilled')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/fulfilled')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/fulfilled')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/fulfilled')).toBe(true);
    });
  });

  it("loadData() for restricted viewing rights user does not load someone else's profile", () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';

    const testInitialState = {
      ...initialState,
      user: {
        ...initialState.user,
        currentUser,
      },
      auth: { isAuthenticated: true },
    };

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      users: { show: errorSdkFn(forbiddenError) },
      listings: { query: errorSdkFn(forbiddenError) },
      reviews: { query: errorSdkFn(forbiddenError) },
      authInfo: sdkFn({}),
    };

    let actions = [];
    const store = configureStore({
      initialState: testInitialState,
      sdk,
      extraMiddlewares: [logger(actions)],
    });
    const dispatch = store.dispatch;
    const getState = store.getState;
    const otherUserId = new UUID('otherUserId');

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: 'otherUserId' }, null, config)(dispatch, getState, sdk).then(data => {
      const relevantActions = actions.filter(
        action => !action.type.startsWith('user/fetchCurrentUser/')
      );

      // Check that setInitialState is first
      expect(relevantActions[0]).toEqual(setInitialState());

      // Check that all pending actions are dispatched
      const pendingActions = relevantActions.filter(action => action.type.endsWith('/pending'));
      expect(pendingActions).toHaveLength(4); // showUser, queryUserListings, queryUserReviews, authInfo

      // Check that all rejected actions are dispatched
      const rejectedActions = relevantActions.filter(action => action.type.endsWith('/rejected'));
      expect(rejectedActions).toHaveLength(3); // showUser, queryUserListings, queryUserReviews

      // Check that authInfo fulfilled is dispatched
      const fulfilledActions = relevantActions.filter(action => action.type.endsWith('/fulfilled'));
      expect(fulfilledActions).toHaveLength(1); // authInfo

      // Verify specific action types are present
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/pending')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/pending')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/pending')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/pending')).toBe(true);
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/rejected')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/rejected')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/rejected')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/fulfilled')).toBe(true);
    });
  });

  it('loadData() for restricted viewing rights user loads their own profile', () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    const { userListingRefs } = initialState.ProfilePage;
    const { l1: listing } = initialState.marketplaceData.entities.listing;

    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';

    const testInitialState = {
      ...initialState,
      user: {
        ...initialState.user,
        currentUser,
      },
      auth: { isAuthenticated: true },
    };

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      ownListings: { query: sdkFn(fakeResponse([listing])) },
      authInfo: sdkFn({}),
    };

    let actions = [];
    const store = configureStore({
      initialState: testInitialState,
      sdk,
      extraMiddlewares: [logger(actions)],
    });
    const dispatch = store.dispatch;
    const getState = store.getState;

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: userId }, null, config)(dispatch, getState, sdk).then(data => {
      const relevantActions = actions.filter(
        action => !action.type.startsWith('user/fetchCurrentUser/')
      );

      // Check that setInitialState is first
      expect(relevantActions[0]).toEqual(setInitialState());

      // Check that queryUserListings pending is dispatched
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/pending')
      ).toBe(true);

      // Check that setUserId is dispatched
      expect(relevantActions.some(action => action.type === 'ProfilePage/setUserId')).toBe(true);

      // Check that addMarketplaceEntities is dispatched
      expect(relevantActions.some(action => action.type === 'marketplaceData/addEntities')).toBe(
        true
      );

      // Check that authInfo pending and fulfilled are dispatched
      expect(relevantActions.some(action => action.type === 'auth/authInfo/pending')).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/fulfilled')).toBe(true);

      // Check that queryUserListings fulfilled is dispatched
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/fulfilled')
      ).toBe(true);
    });
  });
});
