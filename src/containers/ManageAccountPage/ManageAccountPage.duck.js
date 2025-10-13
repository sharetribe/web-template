import { storableError } from '../../util/errors';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { logout } from '../../ducks/auth.duck';
import { deleteUserAccount } from '../../util/api';

// ================ Action types ================ //

export const DELETE_ACCOUNT_REQUEST = 'app/ManageAccountPage/DELETE_ACCOUNT_REQUEST';
export const DELETE_ACCOUNT_SUCCESS = 'app/ManageAccountPage/DELETE_ACCOUNT_SUCCESS';
export const DELETE_ACCOUNT_ERROR = 'app/ManageAccountPage/DELETE_ACCOUNT_ERROR';

export const RESET_PASSWORD_REQUEST = 'app/ManageAccountPage/RESET_PASSWORD_REQUEST';
export const RESET_PASSWORD_SUCCESS = 'app/ManageAccountPage/RESET_PASSWORD_SUCCESS';
export const RESET_PASSWORD_ERROR = 'app/ManageAccountPage/RESET_PASSWORD_ERROR';

// ================ Reducer ================ //

const initialState = {
  deleteAccountError: null,
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
    case DELETE_ACCOUNT_ERROR:
      return { ...state, deleteAccountInProgress: false, deleteAccountError: payload };

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
export const deleteAccountError = error => {
  console.log('error:  ' + JSON.stringify(error, null, 4));
  ({
    type: DELETE_ACCOUNT_ERROR,
    payload: error,
    error: true,
  });
};

export const resetPasswordRequest = () => ({ type: RESET_PASSWORD_REQUEST });

export const resetPasswordSuccess = () => ({ type: RESET_PASSWORD_SUCCESS });

export const resetPasswordError = e => ({
  type: RESET_PASSWORD_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const deleteAccount = currentPassword => (dispatch, getState, sdk) => {
  // Get current password and use it to delete the user account
  dispatch(deleteAccountRequest());

  return deleteUserAccount({ currentPassword })
    .then(() => {
      dispatch(deleteAccountSuccess());
      return;
    })
    .catch(e => {
      dispatch(deleteAccountError(storableError(storableError(e))));
      throw e;
    })
    .then(() => {
      // TODO: logout + clear cache
      return dispatch(logout());
    });
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
