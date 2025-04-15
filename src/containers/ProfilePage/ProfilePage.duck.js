import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { PROFILE_PAGE_PENDING_APPROVAL_VARIANT, parse } from '../../util/urlHelpers';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import {
  hasPermissionToViewData,
  isUserAuthorized,
  isCreativeSellerApproved,
} from '../../util/userHelpers';
import { LISTING_TAB_TYPES } from '../../util/types';
import { RESULT_PAGE_SIZE } from '../ManageListingsPage/ManageListingsPage.duck';

const { UUID } = sdkTypes;
const isCurrentUser = (userId, cu) => userId?.uuid === cu?.id?.uuid;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/ProfilePage/SET_INITIAL_STATE';

export const SHOW_USER_REQUEST = 'app/ProfilePage/SHOW_USER_REQUEST';
export const SHOW_USER_SUCCESS = 'app/ProfilePage/SHOW_USER_SUCCESS';
export const SHOW_USER_ERROR = 'app/ProfilePage/SHOW_USER_ERROR';

export const QUERY_CREATIVE_PROFILE_REQUEST = 'app/ProfilePage/QUERY_CREATIVE_PROFILE_REQUEST';
export const QUERY_CREATIVE_PROFILE_SUCCESS = 'app/ProfilePage/QUERY_CREATIVE_PROFILE_SUCCESS';
export const QUERY_CREATIVE_PROFILE_ERROR = 'app/ProfilePage/QUERY_CREATIVE_PROFILE_ERROR';

export const QUERY_LISTINGS_REQUEST = 'app/ProfilePage/QUERY_LISTINGS_REQUEST';
export const QUERY_LISTINGS_SUCCESS = 'app/ProfilePage/QUERY_LISTINGS_SUCCESS';
export const QUERY_LISTINGS_ERROR = 'app/ProfilePage/QUERY_LISTINGS_ERROR';

export const QUERY_REVIEWS_REQUEST = 'app/ProfilePage/QUERY_REVIEWS_REQUEST';
export const QUERY_REVIEWS_SUCCESS = 'app/ProfilePage/QUERY_REVIEWS_SUCCESS';
export const QUERY_REVIEWS_ERROR = 'app/ProfilePage/QUERY_REVIEWS_ERROR';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  userShowInProgress: false,
  userShowError: null,
  creativeProfileListingId: null,
  queryCreativeProfileInProgress: false,
  queryCreativeProfileError: null,
  pagination: null,
  queryParams: {},
  queryInProgress: false,
  queryListingsError: null,
  currentPageResultIds: [],
  queryReviewsInProgress: false,
  queryReviewsError: null,
  reviews: [],
};

export default function profilePageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };

    case SHOW_USER_REQUEST:
      return {
        ...state,
        userShowInProgress: true,
        userShowError: null,
      };
    case SHOW_USER_SUCCESS:
      return {
        ...state,
        userId: payload.userId,
        userShowInProgress: false,
      };
    case SHOW_USER_ERROR:
      return { ...state, userShowInProgress: false, userShowError: payload };

    case QUERY_CREATIVE_PROFILE_REQUEST:
      return {
        ...state,
        queryCreativeProfileInProgress: true,
        queryCreativeProfileError: null,
      };
    case QUERY_CREATIVE_PROFILE_SUCCESS:
      return {
        ...state,
        creativeProfileListingId: payload.data.data.id,
        queryCreativeProfileInProgress: false,
      };
    case QUERY_CREATIVE_PROFILE_ERROR:
      return {
        ...state,
        queryCreativeProfileInProgress: false,
        queryCreativeProfileError: payload,
      };

    case QUERY_LISTINGS_REQUEST:
      return {
        ...state,
        currentPageResultIds: [],
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryListingsError: null,
      };
    case QUERY_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: payload.listingRefs,
        pagination: payload.meta,
        queryInProgress: false,
      };
    case QUERY_LISTINGS_ERROR:
      return { ...state, queryInProgress: false, queryListingsError: payload };

    case QUERY_REVIEWS_REQUEST:
      return {
        ...state,
        queryReviewsInProgress: true,
        queryReviewsError: null,
        reviews: [],
      };
    case QUERY_REVIEWS_SUCCESS:
      return {
        ...state,
        reviews: payload,
        queryReviewsInProgress: false,
      };
    case QUERY_REVIEWS_ERROR:
      return { ...state, queryReviewsInProgress: false, queryReviewsError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialState = () => ({
  type: SET_INITIAL_STATE,
});

export const showUserRequest = () => ({
  type: SHOW_USER_REQUEST,
});
export const showUserSuccess = userId => ({
  type: SHOW_USER_SUCCESS,
  payload: { userId },
});
export const showUserError = e => ({
  type: SHOW_USER_ERROR,
  error: true,
  payload: e,
});

export const queryCreativeProfileRequest = () => ({
  type: QUERY_CREATIVE_PROFILE_REQUEST,
});
export const queryCreativeProfileSuccess = data => ({
  type: QUERY_CREATIVE_PROFILE_SUCCESS,
  payload: data,
});
export const queryCreativeProfileError = e => ({
  type: QUERY_CREATIVE_PROFILE_ERROR,
  error: true,
  payload: e,
});

export const queryListingsRequest = queryParams => ({
  type: QUERY_LISTINGS_REQUEST,
  payload: { queryParams },
});
export const queryListingsSuccess = data => ({
  type: QUERY_LISTINGS_SUCCESS,
  payload: data,
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

export const queryUserListings = (userId, initQueryParams, config, ownProfileOnly = false) => (
  dispatch,
  getState,
  sdk
) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;
  const queryParams = {
    ...initQueryParams,
    include: ['author', 'images'],
    'fields.image': [
      // Scaled variants for large images
      'variants.scaled-xlarge',

      // Cropped variants for listing thumbnail images
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
  };
  dispatch(queryListingsRequest(queryParams));
  const { perPage, pub_listingId, ...rest } = queryParams;
  const listingType = queryParams.pub_listingType;
  const validListingType = !!listingType && listingType !== LISTING_TAB_TYPES.REVIEWS;
  const validCategoryType = !!queryParams.pub_categoryLevel1;
  const validRequestParams = validListingType || validCategoryType;
  const withImageLimit = listingType !== LISTING_TAB_TYPES.PORTFOLIO;
  const params = { ...rest, perPage, ...(withImageLimit ? { 'limit.images': 1 } : {}) };

  if (!validRequestParams) return;
  const listingsPromise = ownProfileOnly
    ? sdk.ownListings.query({
        states: ['published'],
        ...params,
      })
    : sdk.listings.query({
        author_id: userId,
        ...params,
      });
  return listingsPromise
    .then(response => {
      const meta = response.data.meta;
      // Pick only the id and type properties from the response listings
      const listings = response.data.data;
      const listingRefs = listings
        .filter(l => l => !l.attributes.deleted && l.attributes.state === 'published')
        .map(({ id, type }) => ({ id, type }));
      dispatch(addMarketplaceEntities(response));
      dispatch(queryListingsSuccess({ meta, listingRefs }));
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
  dispatch(showUserRequest());
  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const userProfile = response?.data?.data?.attributes?.profile || {};
      const { metadata } = userProfile;
      const profileListingId = metadata?.profileListingId;
      const withCreativeProfile = isCreativeSellerApproved(userProfile);
      if (withCreativeProfile) {
        dispatch(requestShowCreativeProfile(profileListingId, config));
      }
      const userFields = config?.user?.userFields;
      const sanitizeConfig = { userFields };
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      dispatch(showUserSuccess(userId));
      return response;
    })
    .catch(e => dispatch(showUserError(storableError(e))));
};

export function requestShowCreativeProfile(creativeProfileListingId, config) {
  return (dispatch, getState, sdk) => {
    dispatch(queryCreativeProfileRequest());
    const params = {
      id: creativeProfileListingId,
      include: ['author'],
    };
    return sdk.listings
      .show(params)
      .then(data => {
        const listingFields = config?.listing?.listingFields;
        const sanitizeConfig = { listingFields };
        dispatch(addMarketplaceEntities(data, sanitizeConfig));
        dispatch(queryCreativeProfileSuccess(data));
        return data;
      })
      .catch(e => {
        dispatch(queryCreativeProfileError(storableError(e)));
      });
  };
}

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = new UUID(params.id);
  const isPreviewForCurrentUser = params.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;
  const currentUser = getState()?.user?.currentUser;
  const fetchCurrentUserOptions = {
    updateHasListings: false,
    updateNotifications: false,
  };
  const originalQueryParams = parse(search);
  const page = originalQueryParams.page || 1;
  const queryParams = {
    ...originalQueryParams,
    page,
    perPage: RESULT_PAGE_SIZE,
  };
  dispatch(setInitialState());
  if (isPreviewForCurrentUser) {
    return dispatch(fetchCurrentUser(fetchCurrentUserOptions)).then(() => {
      if (isCurrentUser(userId, currentUser) && isUserAuthorized(currentUser)) {
        // Scenario: 'active' user somehow tries to open a link for "variant" profile
        return Promise.all([
          dispatch(showUser(userId, config)),
          dispatch(queryUserListings(userId, queryParams, config)),
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
      dispatch(queryUserListings(userId, queryParams, config, canFetchOwnProfileOnly)),
      dispatch(showUserRequest(userId)),
    ]);
  }
  return Promise.all([
    dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
    dispatch(showUser(userId, config)),
    dispatch(queryUserListings(userId, queryParams, config)),
    dispatch(queryUserReviews(userId)),
  ]);
};
