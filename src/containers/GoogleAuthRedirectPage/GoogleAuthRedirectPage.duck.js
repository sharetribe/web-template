// ================ Action types ================ //

import { saveGoogleAuthToken } from '../../util/api';
import { CODE } from '../../util/constants';
import { getListingCurrentPathFromSessionStorage } from '../../util/editListingHelpers';
import { StatusCode } from '../../util/enums';

export const GOOGLE_AUTH_REQUEST = 'app/GoogleAuthRedirectPage/GOOGLE_AUTH_REQUEST';
export const GOOGLE_AUTH_SUCCESS = 'app/GoogleAuthRedirectPage/GOOGLE_AUTH_SUCCESS';
export const GOOGLE_AUTH_ERROR = 'app/GoogleAuthRedirectPage/GOOGLE_AUTH_ERROR';

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
  const { authInProgress, authError } = state.GoogleAuthRedirectPage;
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
export const handleGoogleAuthCode = code => async (dispatch, _getState, sdk) => {
  try {
    dispatch(googleAuthRequest());
    const currentPath = getListingCurrentPathFromSessionStorage();

    // Extract the listingId from the current path using a flexible regex
    const uuidRegex = /[0-9a-fA-F-]{36}/;
    const match = currentPath.match(uuidRegex);
    const listingId = match ? match[0] : null;
    const response = await saveGoogleAuthToken({ code, listingId });
    if (response.statusCode === StatusCode.SUCCESS && typeof window !== 'undefined') {
      window.location.href = `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}${currentPath}`;
      dispatch(googleAuthSuccess(response));
    }
  } catch (error) {
    dispatch(googleAuthRequest(storableError(error)));
    showErrorToast('Something went wrong. Please try again later.');
  }
};

export const loadData = (params, search, config) => async dispatch => {
  try {
    // Use URLSearchParams to parse the query string
    const queryParams = new URLSearchParams(search);
    const code = queryParams.get(CODE);
    if (code) {
      await dispatch(handleGoogleAuthCode(code));
    }
  } catch (error) {}
};
