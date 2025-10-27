import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { PROFILE_PAGE_PENDING_APPROVAL_VARIANT } from '../../util/urlHelpers';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';

const { UUID } = sdkTypes;

// ================ Async Thunks ================ //

///////////////
// Show User //
///////////////
const showUserPayloadCreator = ({ userId, config }, { dispatch, rejectWithValue, extra: sdk }) => {
  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const userFields = config?.user?.userFields;
      const sanitizeConfig = { userFields };
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      return response;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const showUserThunk = createAsyncThunk('ProfilePage/showUser', showUserPayloadCreator);

// Backward compatible wrapper for the thunk
export const showUser = (userId, config) => dispatch => {
  return dispatch(showUserThunk({ userId, config }));
};

/////////////////////////
// Query User Listings //
/////////////////////////
const queryUserListingsPayloadCreator = (
  { userId, config, ownProfileOnly = false },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  const queryParams = {
    include: ['author', 'images'],
    'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
  };

  const listingsPromise = ownProfileOnly
    ? sdk.ownListings.query({
        states: ['published'],
        ...queryParams,
      })
    : sdk.listings.query({
        author_id: userId,
        ...queryParams,
      });

  return listingsPromise
    .then(response => {
      // Pick only the id and type properties from the response listings
      const listings = response.data.data;
      const listingRefs = listings
        .filter(l => l => !l.attributes.deleted && l.attributes.state === 'published')
        .map(({ id, type }) => ({ id, type }));
      dispatch(addMarketplaceEntities(response));
      return { listingRefs, response };
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryUserListingsThunk = createAsyncThunk(
  'ProfilePage/queryUserListings',
  queryUserListingsPayloadCreator
);

// Backward compatible wrapper for the thunk
export const queryUserListings = (userId, config, ownProfileOnly = false) => dispatch => {
  return dispatch(queryUserListingsThunk({ userId, config, ownProfileOnly }));
};

//////////////////////////
// Query User's Reviews //
//////////////////////////
const queryUserReviewsPayloadCreator = ({ userId }, { rejectWithValue, extra: sdk }) => {
  return sdk.reviews
    .query({
      subject_id: userId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      return reviews;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryUserReviewsThunk = createAsyncThunk(
  'ProfilePage/queryUserReviews',
  queryUserReviewsPayloadCreator
);

// Backward compatible wrapper for the thunk
export const queryUserReviews = userId => dispatch => {
  return dispatch(queryUserReviewsThunk({ userId }));
};

// ================ Slice ================ //

const initialState = {
  userId: null,
  userListingRefs: [],
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
};

const profilePageSlice = createSlice({
  name: 'ProfilePage',
  initialState,
  reducers: {
    setInitialState: () => initialState,
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // showUser cases
      .addCase(showUserThunk.pending, (state, action) => {
        state.userShowError = null;
        state.userId = action.meta.arg.userId;
      })
      .addCase(showUserThunk.fulfilled, state => {
        // No state changes needed on success
      })
      .addCase(showUserThunk.rejected, (state, action) => {
        state.userShowError = storableError(action.payload);
      })
      // queryUserListings cases
      .addCase(queryUserListingsThunk.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        // Empty listings only when user id changes
        state.userListingRefs = userId === state.userId ? state.userListingRefs : [];
        state.queryListingsError = null;
      })
      .addCase(queryUserListingsThunk.fulfilled, (state, action) => {
        state.userListingRefs = action.payload.listingRefs;
      })
      .addCase(queryUserListingsThunk.rejected, (state, action) => {
        state.userListingRefs = [];
        state.queryListingsError = storableError(action.payload);
      })
      // queryUserReviews cases
      .addCase(queryUserReviewsThunk.pending, state => {
        state.queryReviewsError = null;
      })
      .addCase(queryUserReviewsThunk.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(queryUserReviewsThunk.rejected, (state, action) => {
        state.reviews = [];
        state.queryReviewsError = action.payload;
      });
  },
});

export const { setInitialState, setUserId } = profilePageSlice.actions;
export default profilePageSlice.reducer;

// ================ Load data ================ //

const isCurrentUser = (userId, cu) => userId?.uuid === cu?.id?.uuid;

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = new UUID(params.id);
  const isPreviewForCurrentUser = params.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;
  const currentUser = getState()?.user?.currentUser;
  const fetchCurrentUserOptions = {
    updateHasListings: false,
    updateNotifications: false,
  };

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  if (isPreviewForCurrentUser) {
    return dispatch(fetchCurrentUser(fetchCurrentUserOptions)).then(() => {
      if (isCurrentUser(userId, currentUser) && isUserAuthorized(currentUser)) {
        // Scenario: 'active' user somehow tries to open a link for "variant" profile
        return Promise.all([
          dispatch(showUser(userId, config)),
          dispatch(queryUserListings(userId, config)),
          dispatch(queryUserReviews(userId)),
        ]);
      } else if (isCurrentUser(userId, currentUser)) {
        // Handle a scenario, where user (in pending-approval state)
        // tries to see their own profile page.
        // => just set userId to state
        return dispatch(setUserId(userId));
      } else {
        return Promise.resolve({});
      }
    });
  }

  // Fetch data for plain profile page.
  // Note 1: returns 404s if user is not 'active'.
  // Note 2: In private marketplace mode, this page won't fetch data if the user is unauthorized
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
  // On a private marketplace, show active (approved) current user's own page
  // even if they don't have viewing rights
  const canFetchOwnProfileOnly =
    isPrivateMarketplace &&
    isAuthorized &&
    hasNoViewingRights &&
    isCurrentUser(userId, currentUser);

  if (!canFetchData) {
    return Promise.resolve();
  } else if (canFetchOwnProfileOnly) {
    return Promise.all([
      dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
      dispatch(queryUserListings(userId, config, canFetchOwnProfileOnly)),
      dispatch(setUserId(userId)),
    ]);
  }

  return Promise.all([
    dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
    dispatch(showUser(userId, config)),
    dispatch(queryUserListings(userId, config)),
    dispatch(queryUserReviews(userId)),
  ]);
};
