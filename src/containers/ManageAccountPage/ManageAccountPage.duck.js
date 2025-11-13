import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { logout } from '../../ducks/auth.duck';
import { deleteUserAccount } from '../../util/api';

// ================ Async Thunks ================ //

////////////////////
// Delete Account //
////////////////////

export const deleteAccountThunk = createAsyncThunk(
  'ManageAccountPage/deleteAccount',
  (currentPassword, { dispatch, rejectWithValue }) => {
    return deleteUserAccount({ currentPassword })
      .then(() => {
        dispatch(markAccountDeleted());
        return dispatch(logout());
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

// Backward compatible wrapper for the deleteAccount thunk
export const deleteAccount = actionPayload => dispatch => {
  return dispatch(deleteAccountThunk(actionPayload)).unwrap();
};

////////////////////
// Reset Password //
////////////////////

export const resetPasswordThunk = createAsyncThunk(
  'ManageAccountPage/resetPassword',
  (email, { extra: sdk, rejectWithValue }) => {
    return sdk.passwordReset.request({ email }).catch(e => {
      return rejectWithValue(storableError(e));
    });
  }
);

// Backward compatible wrapper for the resetPassword thunk
// Note: we unwrap the thunk so that the promise chain can be listened on presentational components.
export const resetPassword = actionPayload => dispatch => {
  return dispatch(resetPasswordThunk(actionPayload)).unwrap();
};

// ================ Slice ================ //

const manageAccountPageSlice = createSlice({
  name: 'ManageAccountPage',
  initialState: {
    deleteAccountError: null,
    deleteAccountInProgress: false,
    accountDeletionConfirmed: false,
    accountMarkedDeleted: false,
    resetPasswordInProgress: false,
    resetPasswordError: null,
  },
  reducers: {
    markAccountDeleted: state => {
      state.accountMarkedDeleted = true;
    },
  },
  extraReducers: builder => {
    builder
      // deleteAccount cases
      .addCase(deleteAccountThunk.pending, state => {
        state.deleteAccountInProgress = true;
        state.accountDeletionConfirmed = false;
      })
      .addCase(deleteAccountThunk.fulfilled, state => {
        state.deleteAccountInProgress = false;
        state.accountDeletionConfirmed = true;
      })
      .addCase(deleteAccountThunk.rejected, (state, action) => {
        state.deleteAccountInProgress = false;
        state.deleteAccountError = action.payload;
      })
      // resetPassword cases
      .addCase(resetPasswordThunk.pending, state => {
        state.resetPasswordInProgress = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPasswordThunk.fulfilled, state => {
        state.resetPasswordInProgress = false;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.resetPasswordInProgress = false;
        state.resetPasswordError = action.payload;
      });
  },
});

export const { markAccountDeleted } = manageAccountPageSlice.actions;

export default manageAccountPageSlice.reducer;
