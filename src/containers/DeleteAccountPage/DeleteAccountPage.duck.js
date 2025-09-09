import merge from 'lodash/merge';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { fetchCurrentUser, currentUserShowSuccess } from '../../ducks/user.duck';

// ================ Action types ================ //

export const DELETE_ACCOUNT_REQUEST = 'app/DeleteAccountPage/DELETE_ACCOUNT_REQUEST';
export const DELETE_ACCOUNT_SUCCESS = 'app/DeleteAccountPage/DELETE_ACCOUNT_SUCCESS';

export const RESET_PASSWORD_REQUEST = 'app/DeleteAccountPage/RESET_PASSWORD_REQUEST';
export const RESET_PASSWORD_SUCCESS = 'app/DeleteAccountPage/RESET_PASSWORD_SUCCESS';
export const RESET_PASSWORD_ERROR = 'app/DeleteAccountPage/RESET_PASSWORD_ERROR';

// ================ Reducer ================ //

const initialState = {
  deleteAccountInProgress: false,
  accountDeletionConfirmed: false,
  resetPasswordInProgress: false,
  resetPasswordError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case DELETE_ACCOUNT_REQUEST:
      return {
        ...state,
        deleteAccountInProgress: true,
        accountDeletionConfirmed: false,
      };
    case DELETE_ACCOUNT_SUCCESS:
      return { ...state, deleteAccountInProgress: false, accountDeletionConfirmed: true };

    case RESET_PASSWORD_REQUEST:
      return { ...state, resetPasswordInProgress: true, resetPasswordError: null };
    case RESET_PASSWORD_SUCCESS:
      return { ...state, resetPasswordInProgress: false };
    case RESET_PASSWORD_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return { ...state, resetPasswordInProgress: false, resetPasswordError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const deleteAccountRequest = () => ({ type: DELETE_ACCOUNT_REQUEST });
export const deleteAccountSuccess = () => ({ type: DELETE_ACCOUNT_SUCCESS });

export const resetPasswordRequest = () => ({ type: RESET_PASSWORD_REQUEST });

export const resetPasswordSuccess = () => ({ type: RESET_PASSWORD_SUCCESS });

export const resetPasswordError = e => ({
  type: RESET_PASSWORD_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const deleteAccount = params => (dispatch, getState, sdk) => {
  // Get current password and use it to delete the user account
  dispatch(deleteAccountRequest());
  const {
    /* currentPassword */
  } = params;

  console.log('deleteAccount() called');

  return;

  /* return sdk.currentUser
    .delete({ currentPassword: currentPassword })
    .then(() => dispatch(deleteAccountSuccess()))
    .catch(e => {
      dispatch(deleteAccountError(storableError(storableError(e))));
      // This is thrown so that form can be cleared
      // after a timeout on deleteAccount submit handler
      throw e;
    }); */
};

export const resetPassword = email => (dispatch, getState, sdk) => {
  dispatch(resetPasswordRequest());
  return sdk.passwordReset
    .request({ email })
    .then(() => dispatch(resetPasswordSuccess()))
    .catch(e => dispatch(resetPasswordError(storableError(e))));
};

export const loadData = () => {
  // Since verify email happens in separate tab, current user's data might be updated
  return fetchCurrentUser();
};
