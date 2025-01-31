import { storableError } from '../util/errors';
import { fetchCurrentUser } from './user.duck';

// ================ Action types ================ //

export const VERIFICATION_REQUEST = 'app/emailVerification/VERIFICATION_REQUEST';
export const VERIFICATION_SUCCESS = 'app/emailVerification/VERIFICATION_SUCCESS';
export const VERIFICATION_ERROR = 'app/emailVerification/VERIFICATION_ERROR';

// ================ Reducer ================ //

const initialState = {
  isVerified: false,

  // verification
  verificationError: null,
  verificationInProgress: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case VERIFICATION_REQUEST:
      return {
        ...state,
        verificationInProgress: true,
        verificationError: null,
      };
    case VERIFICATION_SUCCESS:
      return { ...state, verificationInProgress: false, isVerified: true };
    case VERIFICATION_ERROR:
      return { ...state, verificationInProgress: false, verificationError: payload };
    default:
      return state;
  }
}

// ================ Selectors ================ //

export const verificationInProgress = state => {
  return state.emailVerification.verificationInProgress;
};

// ================ Action creators ================ //

export const verificationRequest = () => ({ type: VERIFICATION_REQUEST });
export const verificationSuccess = () => ({ type: VERIFICATION_SUCCESS });
export const verificationError = error => ({
  type: VERIFICATION_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const verify = verificationToken => (dispatch, getState, sdk) => {
  if (verificationInProgress(getState())) {
    return Promise.reject(new Error('Email verification already in progress'));
  }
  dispatch(verificationRequest());

  // Note that the thunk does not reject when the verification fails, it
  // just dispatches the login error action.
  return sdk.currentUser
    .verifyEmail({ verificationToken })
    .then(() => dispatch(verificationSuccess()))
    .then(() => dispatch(fetchCurrentUser({ enforce: true })))
    .catch(e => dispatch(verificationError(storableError(e))));
};
