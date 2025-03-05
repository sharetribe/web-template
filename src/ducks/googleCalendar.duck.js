import { showErrorToast } from '../util/toast';
import { StatusCode } from '../util/enums';
import { storableError } from '../util/errors';
import { getAuthURL } from '../util/api';
// ================ Action types ================ //

export const GOOGLE_AUTH_REQUEST = 'app/googleCalendar/GOOGLE_AUTH_REQUEST';
export const GOOGLE_AUTH_SUCCESS = 'app/googleCalendar/GOOGLE_AUTH_SUCCESS';
export const GOOGLE_AUTH_ERROR = 'app/googleCalendar/GOOGLE_AUTH_ERROR';

// ================ Reducer ================ //

const initialState = {
  authInProgress: false,
  authError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case GOOGLE_AUTH_REQUEST:
      return {
        ...state,
        authInProgress: true,
        authError: null,
      };
    case GOOGLE_AUTH_SUCCESS:
      return {
        ...state,
        authInProgress: false,
        authError: null,
      };
    case GOOGLE_AUTH_ERROR:
      return {
        ...state,
        authInProgress: false,
        authError: payload,
      };
    default:
      return state;
  }
}

// ================ Selectors ================ //

export const googleAuthSelector = state => {
  const { authInProgress, authError } = state.googleCalendar;
  return {
    authInProgress,
    authError,
  };
};

// ================ Action creators ================ //

export const googleAuthRequest = () => ({ type: GOOGLE_AUTH_REQUEST });
export const googleAuthSuccess = () => ({ type: GOOGLE_AUTH_SUCCESS });

export const googleAuthError = payload => ({
  type: GOOGLE_AUTH_ERROR,
  payload,
});

// ================ Thunks ================ //
export const InitiateGoogleAuth = () => async (dispatch, _getState, sdk) => {
  try {
    dispatch(googleAuthRequest());
    const response = await getAuthURL();
    const authUrl = response.data;
    if (response.statusCode === StatusCode.SUCCESS && typeof window !== 'undefined') {
      // Open the URL in a new tab
      // window.open(authUrl);
      window.location.href = authUrl;
      dispatch(googleAuthSuccess(response));
    }
  } catch (error) {
    dispatch(googleAuthRequest(storableError(error)));
    showErrorToast('Something went wrong. Please try again later.');
  }
};
