import * as log from '../util/log';
import { storableError } from '../util/errors';
import { clearCurrentUser, fetchCurrentUser } from './user.duck';
import { createUserWithIdp } from '../util/api';

const authenticated = authInfo => authInfo?.isAnonymous === false;
const loggedInAs = authInfo => authInfo?.isLoggedInAs === true;

// ================ Action types ================ //

export const AUTH_INFO_REQUEST = 'app/auth/AUTH_INFO_REQUEST';
export const AUTH_INFO_SUCCESS = 'app/auth/AUTH_INFO_SUCCESS';

export const LOGOUT_REQUEST = 'app/auth/LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'app/auth/LOGOUT_SUCCESS';
export const LOGOUT_ERROR = 'app/auth/LOGOUT_ERROR';

export const CONFIRM_REQUEST = 'app/auth/CONFIRM_REQUEST';
export const CONFIRM_SUCCESS = 'app/auth/CONFIRM_SUCCESS';
export const CONFIRM_ERROR = 'app/auth/CONFIRM_ERROR';

// Generic user_logout action that can be handled elsewhere
// E.g. src/reducers.js clears store as a consequence
export const USER_LOGOUT = 'app/USER_LOGOUT';

// ================ Reducer ================ //

const initialState = {
  isAuthenticated: false,

  // is marketplace operator logged in as a marketplace user
  isLoggedInAs: false,

  // scopes associated with current token
  authScopes: [],

  // auth info
  authInfoLoaded: false,

  // logout
  logoutError: null,
  logoutInProgress: false,

  // confirm (create use with idp)
  confirmError: null,
  confirmInProgress: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case AUTH_INFO_REQUEST:
      return state;
    case AUTH_INFO_SUCCESS:
      return {
        ...state,
        authInfoLoaded: true,
        isAuthenticated: authenticated(payload),
        isLoggedInAs: loggedInAs(payload),
        authScopes: payload.scopes,
      };

    case LOGOUT_REQUEST:
      return { ...state, logoutInProgress: true, logoutError: null };
    case LOGOUT_SUCCESS:
      return {
        ...state,
        logoutInProgress: false,
        isAuthenticated: false,
        isLoggedInAs: false,
        authScopes: [],
      };
    case LOGOUT_ERROR:
      return { ...state, logoutInProgress: false, logoutError: payload };

    case CONFIRM_REQUEST:
      return { ...state, confirmInProgress: true, confirmError: null };
    case CONFIRM_SUCCESS:
      return { ...state, confirmInProgress: false, isAuthenticated: true };
    case CONFIRM_ERROR:
      return { ...state, confirmInProgress: false, confirmError: payload };

    default:
      return state;
  }
}

// ================ Selectors ================ //

export const authenticationInProgress = state => {
  const { logoutInProgress, confirmInProgress } = state.auth;
  return logoutInProgress || confirmInProgress;
};

// ================ Action creators ================ //

export const authInfoRequest = () => ({ type: AUTH_INFO_REQUEST });
export const authInfoSuccess = info => ({ type: AUTH_INFO_SUCCESS, payload: info });

export const logoutRequest = () => ({ type: LOGOUT_REQUEST });
export const logoutSuccess = () => ({ type: LOGOUT_SUCCESS });
export const logoutError = error => ({ type: LOGOUT_ERROR, payload: error, error: true });

export const confirmRequest = () => ({ type: CONFIRM_REQUEST });
export const confirmSuccess = () => ({ type: CONFIRM_SUCCESS });
export const confirmError = error => ({ type: CONFIRM_ERROR, payload: error, error: true });

export const userLogout = () => ({ type: USER_LOGOUT });

// ================ Thunks ================ //

export const authInfo = () => (dispatch, getState, sdk) => {
  dispatch(authInfoRequest());
  return sdk
    .authInfo()
    .then(info => dispatch(authInfoSuccess(info)))
    .catch(e => {
      // Requesting auth info just reads the token from the token
      // store (i.e. cookies), and should not fail in normal
      // circumstances. If it fails, it's due to a programming
      // error. In that case we mark the operation done and dispatch
      // `null` success action that marks the user as unauthenticated.
      log.error(e, 'auth-info-failed');
      dispatch(authInfoSuccess(null));
    });
};

export const logout = () => (dispatch, getState, sdk) => {
  if (authenticationInProgress(getState())) {
    return Promise.reject(new Error('Login or logout already in progress'));
  }
  dispatch(logoutRequest());

  // Note that the thunk does not reject when the logout fails, it
  // just dispatches the logout error action.
  return sdk
    .logout()
    .then(() => {
      // The order of the dispatched actions
      dispatch(logoutSuccess());
      dispatch(clearCurrentUser());
      log.clearUserId();
      dispatch(userLogout());
    })
    .catch(e => dispatch(logoutError(storableError(e))));
};

export const signupWithIdp = params => (dispatch, getState, sdk) => {
  dispatch(confirmRequest());
  return createUserWithIdp(params)
    .then(res => {
      return dispatch(confirmSuccess());
    })
    .then(() => dispatch(fetchCurrentUser()))
    .catch(e => {
      log.error(e, 'create-user-with-idp-failed', { params });
      return dispatch(confirmError(storableError(e)));
    });
};
