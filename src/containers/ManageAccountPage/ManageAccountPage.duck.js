import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { setCurrentUser } from '../../ducks/user.duck';
import { logout } from '../../ducks/auth.duck';
import { denormalisedResponseEntities } from '../../util/data';
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

////////////////////
// Update Profile //
////////////////////

export const updateProfileThunk = createAsyncThunk(
  'ManageAccountPage/updatePassword',
  (actionPayload, { dispatch, rejectWithValue, extra: sdk }) => {
    const queryParams = {
      expand: true,
    };

    return sdk.currentUser
      .updateProfile(actionPayload, queryParams)
      .then(response => {
        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
        }
        const currentUser = entities[0];

        // Update current user in state.user.currentUser through user.duck.js
        dispatch(setCurrentUser(currentUser));
        return response;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

// Backward compatible wrapper for the updateProfile thunk
export const updateProfile = actionPayload => dispatch => {
  return dispatch(updateProfileThunk(actionPayload));
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
    updateProfileInProgress: false,
    updateProfileError: null,
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
      })
      // updateProfile cases
      .addCase(updateProfileThunk.pending, state => {
        state.updateProfileInProgress = true;
        state.updateProfileError = null;
      })
      .addCase(updateProfileThunk.fulfilled, state => {
        state.updateProfileInProgress = false;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.updateProfileInProgress = false;
        state.updateProfileError = action.payload;
      });
  },
});

export const { markAccountDeleted } = manageAccountPageSlice.actions;

export default manageAccountPageSlice.reducer;
