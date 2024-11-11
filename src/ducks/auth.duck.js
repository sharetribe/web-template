import * as log from '../util/log';
import { storableError } from '../util/errors';
import { clearCurrentUser, fetchCurrentUser } from './user.duck';
import { createUserWithIdp } from '../util/api';

const authenticated = authInfo => authInfo?.isAnonymous === false;
const loggedInAs = authInfo => authInfo?.isLoggedInAs === true;

// ================ Action types ================ //

export const AUTH_INFO_REQUEST = 'app/auth/AUTH_INFO_REQUEST';
export const AUTH_INFO_SUCCESS = 'app/auth/AUTH_INFO_SUCCESS';

export const LOGIN_REQUEST = 'app/auth/LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'app/auth/LOGIN_SUCCESS';
export const LOGIN_ERROR = 'app/auth/LOGIN_ERROR';

export const LOGOUT_REQUEST = 'app/auth/LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'app/auth/LOGOUT_SUCCESS';
export const LOGOUT_ERROR = 'app/auth/LOGOUT_ERROR';

export const SIGNUP_REQUEST = 'app/auth/SIGNUP_REQUEST';
export const SIGNUP_SUCCESS = 'app/auth/SIGNUP_SUCCESS';
export const SIGNUP_ERROR = 'app/auth/SIGNUP_ERROR';

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

  // login
  loginError: null,
  loginInProgress: false,

  // logout
  logoutError: null,
  logoutInProgress: false,

  // signup
  signupError: null,
  signupInProgress: false,

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

    case LOGIN_REQUEST:
      return {
        ...state,
        loginInProgress: true,
        loginError: null,
        logoutError: null,
        signupError: null,
      };
    case LOGIN_SUCCESS:
      return { ...state, loginInProgress: false, isAuthenticated: true };
    case LOGIN_ERROR:
      return { ...state, loginInProgress: false, loginError: payload };

    case LOGOUT_REQUEST:
      return { ...state, logoutInProgress: true, loginError: null, logoutError: null };
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

    case SIGNUP_REQUEST:
      return { ...state, signupInProgress: true, loginError: null, signupError: null };
    case SIGNUP_SUCCESS:
      return { ...state, signupInProgress: false };
    case SIGNUP_ERROR:
      return { ...state, signupInProgress: false, signupError: payload };

    case CONFIRM_REQUEST:
      return { ...state, confirmInProgress: true, loginError: null, confirmError: null };
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
  const { loginInProgress, logoutInProgress, signupInProgress, confirmInProgress } = state.auth;
  return loginInProgress || logoutInProgress || signupInProgress || confirmInProgress;
};

// ================ Action creators ================ //

export const authInfoRequest = () => ({ type: AUTH_INFO_REQUEST });
export const authInfoSuccess = info => ({ type: AUTH_INFO_SUCCESS, payload: info });

export const loginRequest = () => ({ type: LOGIN_REQUEST });
export const loginSuccess = () => ({ type: LOGIN_SUCCESS });
export const loginError = error => ({ type: LOGIN_ERROR, payload: error, error: true });

export const logoutRequest = () => ({ type: LOGOUT_REQUEST });
export const logoutSuccess = () => ({ type: LOGOUT_SUCCESS });
export const logoutError = error => ({ type: LOGOUT_ERROR, payload: error, error: true });

export const signupRequest = () => ({ type: SIGNUP_REQUEST });
export const signupSuccess = () => ({ type: SIGNUP_SUCCESS });
export const signupError = error => ({ type: SIGNUP_ERROR, payload: error, error: true });

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

export const login = (username, password) => (dispatch, getState, sdk) => {
  if (authenticationInProgress(getState())) {
    return Promise.reject(new Error('Login or logout already in progress'));
  }
  dispatch(loginRequest());

  // Note that the thunk does not reject when the login fails, it
  // just dispatches the login error action.
  return sdk
    .login({ username, password })
    .then(() => dispatch(fetchCurrentUser({ afterLogin: true })))
    .then(() => dispatch(loginSuccess()))
    .catch(e => dispatch(loginError(storableError(e))));
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

export const signup = params => (dispatch, getState, sdk) => {
  if (authenticationInProgress(getState())) {
    return Promise.reject(new Error('Login or logout already in progress'));
  }
  dispatch(signupRequest());
  // Note: params are already structured on AuthenticationPage (handleSubmitSignup)

  // We must login the user if signup succeeds since the API doesn't
  // do that automatically.
  return sdk.currentUser
    .create(params)
    .then(() => dispatch(signupSuccess()))
    .then(() => dispatch(login(params.email, params.password)))
    .catch(e => {
      dispatch(signupError(storableError(e)));
      log.error(e, 'signup-failed', {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
      });
    });
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
