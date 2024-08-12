import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { PROFILE_PAGE_PENDING_APPROVAL_VARIANT } from '../../util/urlHelpers';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { isUserAuthorized } from '../../util/userHelpers';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/ProfilePage/SET_INITIAL_STATE';

export const SHOW_USER_REQUEST = 'app/ProfilePage/SHOW_USER_REQUEST';
export const SHOW_USER_SUCCESS = 'app/ProfilePage/SHOW_USER_SUCCESS';
export const SHOW_USER_ERROR = 'app/ProfilePage/SHOW_USER_ERROR';

export const QUERY_LISTINGS_REQUEST = 'app/ProfilePage/QUERY_LISTINGS_REQUEST';
export const QUERY_LISTINGS_SUCCESS = 'app/ProfilePage/QUERY_LISTINGS_SUCCESS';
export const QUERY_LISTINGS_ERROR = 'app/ProfilePage/QUERY_LISTINGS_ERROR';

export const QUERY_REVIEWS_REQUEST = 'app/ProfilePage/QUERY_REVIEWS_REQUEST';
export const QUERY_REVIEWS_SUCCESS = 'app/ProfilePage/QUERY_REVIEWS_SUCCESS';
export const QUERY_REVIEWS_ERROR = 'app/ProfilePage/QUERY_REVIEWS_ERROR';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  userListingRefs: [],
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
};

export default function profilePageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };
    case SHOW_USER_REQUEST:
      return { ...state, userShowError: null, userId: payload.userId };
    case SHOW_USER_SUCCESS:
      return state;
    case SHOW_USER_ERROR:
      return { ...state, userShowError: payload };

    case QUERY_LISTINGS_REQUEST:
      return {
        ...state,

        // Empty listings only when user id changes
        userListingRefs: payload.userId === state.userId ? state.userListingRefs : [],

        queryListingsError: null,
      };
    case QUERY_LISTINGS_SUCCESS:
      return { ...state, userListingRefs: payload.listingRefs };
    case QUERY_LISTINGS_ERROR:
      return { ...state, userListingRefs: [], queryListingsError: payload };
    case QUERY_REVIEWS_REQUEST:
      return { ...state, queryReviewsError: null };
    case QUERY_REVIEWS_SUCCESS:
      return { ...state, reviews: payload };
    case QUERY_REVIEWS_ERROR:
      return { ...state, reviews: [], queryReviewsError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialState = () => ({
  type: SET_INITIAL_STATE,
});

export const showUserRequest = userId => ({
  type: SHOW_USER_REQUEST,
  payload: { userId },
});

export const showUserSuccess = () => ({
  type: SHOW_USER_SUCCESS,
});

export const showUserError = e => ({
  type: SHOW_USER_ERROR,
  error: true,
  payload: e,
});

export const queryListingsRequest = userId => ({
  type: QUERY_LISTINGS_REQUEST,
  payload: { userId },
});

export const queryListingsSuccess = listingRefs => ({
  type: QUERY_LISTINGS_SUCCESS,
  payload: { listingRefs },
});

export const queryListingsError = e => ({
  type: QUERY_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const queryReviewsRequest = () => ({
  type: QUERY_REVIEWS_REQUEST,
});

export const queryReviewsSuccess = reviews => ({
  type: QUERY_REVIEWS_SUCCESS,
  payload: reviews,
});

export const queryReviewsError = e => ({
  type: QUERY_REVIEWS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const queryUserListings = (userId, config) => (dispatch, getState, sdk) => {
  dispatch(queryListingsRequest(userId));

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return sdk.listings
    .query({
      author_id: userId,
      include: ['author', 'images'],
      'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    })
    .then(response => {
      // Pick only the id and type properties from the response listings
      const listings = response.data.data;
      const listingRefs = listings
        .filter(l => l => !l.attributes.deleted && l.attributes.state === 'published')
        .map(({ id, type }) => ({ id, type }));
      dispatch(addMarketplaceEntities(response));
      dispatch(queryListingsSuccess(listingRefs));
      return response;
    })
    .catch(e => dispatch(queryListingsError(storableError(e))));
};

export const queryUserReviews = userId => (dispatch, getState, sdk) => {
  sdk.reviews
    .query({
      subject_id: userId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      dispatch(queryReviewsSuccess(reviews));
    })
    .catch(e => dispatch(queryReviewsError(e)));
};

export const showUser = (userId, config) => (dispatch, getState, sdk) => {
  dispatch(showUserRequest(userId));
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
      dispatch(showUserSuccess());
      return response;
    })
    .catch(e => dispatch(showUserError(storableError(e))));
};

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
        return dispatch(showUserRequest(userId));
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
  const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
  if (!canFetchData) {
    return Promise.resolve();
  }

  return Promise.all([
    dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
    dispatch(showUser(userId, config)),
    dispatch(queryUserListings(userId, config)),
    dispatch(queryUserReviews(userId)),
  ]);
};
