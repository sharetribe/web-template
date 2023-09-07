import { addMarketplaceEntities } from '../../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../../ducks/user.duck';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../../util/data';
import { storableError } from '../../../util/errors';
import { getUserAdmin,updateUsersAdmin } from '../../../util/api';
import * as log from '../../../util/log';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/CommissionPage/SET_INITIAL_STATE';

export const QUERY_USER_SUCCESS = 'app/CommissionPage/QUERY_USER_SUCCESS';
export const QUERY_USER_ERROR = 'app/CommissionPage/QUERY_USER_ERROR';

export const UPDATE_COMMISSION_REQUEST = 'app/CommissionPage/UPDATE_COMMISSION_REQUEST';
export const UPDATE_COMMISSION_SUCCESS = 'app/CommissionPage/UPDATE_COMMISSION_SUCCESS';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  users: [],
  commission: 0,
  userName: '',
  userShowError: null,
  queryListingsError: null,
  updateInProgress: false,
  updateSuccess: false
};

export default function CommissionPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;

//   console.log('CommissionPageReducer');
//   console.log(action);

  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };

    case QUERY_USER_SUCCESS:
      const userName = payload.userData.attributes.profile.displayName;
      const userId = payload.userData.id.uuid;
      const commission = payload.userData.attributes.profile.metadata.commission ? payload.userData.attributes.profile.metadata.commission:0;
      return { ...state, userName, userId, commission };
    case QUERY_USER_ERROR:
      return { ...state, userListingRefs: [], queryListingsError: payload };

    case UPDATE_COMMISSION_REQUEST:
    return {
        ...state,
        updateInProgress: true,
        updateSuccess: false
    };

    case UPDATE_COMMISSION_SUCCESS:
    return {
        ...state,
        updateInProgress: false,
        updateSuccess: true
    };
    

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialState = () => ({
  type: SET_INITIAL_STATE,
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

// SDK method: sdk.currentUser.updateProfile
export const updateCommissionRequest = params => ({
    type: UPDATE_COMMISSION_REQUEST,
    payload: { params },
  });

export const updateCommissionSuccess = updateResult => ({
    type: UPDATE_COMMISSION_SUCCESS,
    payload: { updateResult },
  });

// ================ Thunks ================ //


export const queryUser = id => (dispatch, getState, sdk) => {
  
  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  // dispatch(setInitialState());

  let params = {id};

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

export const updateCommission = actionPayload => {
  return (dispatch, getState, sdk) => {
    dispatch(updateCommissionRequest());

    return updateUsersAdmin(actionPayload)
    .then(res => {
      return res;
    })
    .then(response => {
      // dispatch(addMarketplaceEntities(response));
      dispatch(updateCommissionSuccess(response));
    })
    .catch(e => {
      log.error(e, 'create-user-with-idp-failed', { actionPayload });
    });
  };
};


export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = params.id;

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(queryUser(userId)),
  ]);
};


