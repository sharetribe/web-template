import { addMarketplaceEntities } from '../../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../../util/data';
import { storableError } from '../../../util/errors';
import { getUserAdmin } from '../../../util/api';
import * as log from '../../../util/log';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/CommissionPage/SET_INITIAL_STATE';

export const SHOW_USER_REQUEST = 'app/CommissionPage/SHOW_USER_REQUEST';
export const SHOW_USER_SUCCESS = 'app/CommissionPage/SHOW_USER_SUCCESS';
export const SHOW_USER_ERROR = 'app/CommissionPage/SHOW_USER_ERROR';

export const QUERY_USER_SUCCESS = 'app/CommissionPage/QUERY_USER_SUCCESS';
export const QUERY_USER_ERROR = 'app/CommissionPage/QUERY_USER_ERROR';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  users: [],
  commission: 0,
  userName: '',
  userShowError: null,
  queryListingsError: null,
};

export default function CommissionPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;

//   console.log('CommissionPageReducer');
//   console.log(action);

  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };
    case SHOW_USER_REQUEST:
      return { ...state, userShowError: null, userId: payload.userId };
    case SHOW_USER_SUCCESS:
      return state;
    case SHOW_USER_ERROR:
      return { ...state, userShowError: payload };

    case QUERY_USER_SUCCESS:
      console.log('QUERY_USERS_SUCCESS');
      console.log(payload);
      const userName = payload.userData.attributes.profile.displayName;
      const commission = payload.userData.attributes.profile.metadata.comission ? payload.userData.attributes.profile.metadata.comission:0;
      return { ...state, userName, commission };
    case QUERY_USER_ERROR:
      return { ...state, userListingRefs: [], queryListingsError: payload };
    

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

export const queryUserSuccess = userData => ({
  type: QUERY_USER_SUCCESS,
  payload: { userData },
});

export const queryUserError = e => ({
  type: QUERY_USER_ERROR,
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

export const queryUser = search => (dispatch, getState, sdk) => {
  
  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  // dispatch(setInitialState());

  let params = {'search':search};

  return getUserAdmin(params)
  .then(res => {
    return res;
  })
  .then(response => {
    // dispatch(addMarketplaceEntities(response));
    dispatch(queryUserSuccess(response));
  })
  .catch(e => {
    log.error(e, 'create-user-with-idp-failed', { params });
  });

};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = new UUID(params.id);

  console.log(params);

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(showUser(userId)),
    dispatch(queryUser(userId)),
  ]);
};


