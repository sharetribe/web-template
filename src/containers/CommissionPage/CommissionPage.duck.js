import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { getUsersAdmin, getListingAdmin } from '../../util/api';
import * as log from '../../util/log';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/CommissionPage/SET_INITIAL_STATE';

export const SHOW_USER_REQUEST = 'app/CommissionPage/SHOW_USER_REQUEST';
export const SHOW_USER_SUCCESS = 'app/CommissionPage/SHOW_USER_SUCCESS';
export const SHOW_USER_ERROR = 'app/CommissionPage/SHOW_USER_ERROR';

export const QUERY_USERS_SUCCESS = 'app/CommissionPage/QUERY_USERS_SUCCESS';
export const QUERY_LISTINGS_ERROR = 'app/CommissionPage/QUERY_LISTINGS_ERROR';

export const QUERY_LISTING_SUCCESS = 'app/CommissionPage/QUERY_LISTING_SUCCESS';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  users: [],
  userShowError: null,
  queryListingsError: null,
};

export default function CommissionPageReducer(state = initialState, action = {}) {
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

    case QUERY_USERS_SUCCESS:
      console.log('QUERY_USERS_SUCCESS');
      console.log(payload);
      return { ...state, users: payload.usersRefs };
    case QUERY_LISTINGS_ERROR:
      return { ...state, userListingRefs: [], queryListingsError: payload };
    case QUERY_LISTING_SUCCESS:
      return { ...state, listingData:payload };
    

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

export const queryListingsSuccess = listingRefs => ({
  type: QUERY_LISTINGS_SUCCESS,
  payload: { listingRefs },
});

export const queryUsersSuccess = usersRefs => ({
  type: QUERY_USERS_SUCCESS,
  payload: { usersRefs },
});

export const queryListingsError = e => ({
  type: QUERY_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const queryReviewsRequest = () => ({
  type: QUERY_REVIEWS_REQUEST,
});

export const queryListingSuccess = listingData => ({
  type: QUERY_LISTING_SUCCESS,
  payload: listingData,
});


// ================ Thunks ================ //


export const showUser = userId => (dispatch, getState, sdk) => {
  dispatch(showUserRequest(userId));
  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(showUserSuccess());
      return response;
    })
    .catch(e => dispatch(showUserError(storableError(e))));
};

export const queryUsers = search => (dispatch, getState, sdk) => {
  
  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  // dispatch(setInitialState());

  let params = {'asdas':'afssaf'};

  return getUsersAdmin(params)
  .then(res => {
    return res;
  })
  .then(response => {
    // dispatch(addMarketplaceEntities(response));
    dispatch(queryUsersSuccess(response));
  })
  .catch(e => {
    log.error(e, 'create-user-with-idp-failed', { params });
  });

};

export const queryListings = search => (dispatch, getState, sdk) => {
  
  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  // dispatch(setInitialState());

  let params = {'asdas':'afssaf'};

  return getListingAdmin(params)
  .then(res => {
    return res;
  })
  .then(response => {
    // dispatch(addMarketplaceEntities(response));
    dispatch(queryListingSuccess(response));
  })
  .catch(e => {
    log.error(e, 'create-user-with-idp-failed', { params });
  });

};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = new UUID(params.id);

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(showUser(userId)),
    dispatch(queryUsers(userId)),
    dispatch(queryListings(userId)),
  ]);
};


