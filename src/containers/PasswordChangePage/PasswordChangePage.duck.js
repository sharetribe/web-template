import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';

// ================ Async thunks ================ //

export const changePasswordThunk = createAsyncThunk(
  'PasswordChangePage/changePassword',
  ({ newPassword, currentPassword }, { extra: sdk, rejectWithValue }) => {
    return sdk.currentUser.changePassword({ newPassword, currentPassword }).catch(e => {
      return rejectWithValue(storableError(storableError(e)));
    });
  }
);
// Backward compatible wrapper for the changePassword thunk
// Note: we unwrap the thunk so that the promise chain can be listened on presentational components.
export const changePassword = params => dispatch => {
  const { newPassword, currentPassword } = params;
  return dispatch(changePasswordThunk({ newPassword, currentPassword })).unwrap();
};

export const resetPasswordThunk = createAsyncThunk(
  'PasswordChangePage/resetPassword',
  ({ email }, { extra: sdk, rejectWithValue }) => {
    return sdk.passwordReset.request({ email }).catch(e => {
      return rejectWithValue(storableError(e));
    });
  }
);
// Backward compatible wrapper for the resetPassword thunk
// Note: we unwrap the thunk so that the promise chain can be listened on presentational components.
export const resetPassword = email => dispatch => {
  return dispatch(resetPasswordThunk({ email })).unwrap();
};

// ================ Slice ================ //

const passwordChangeSlice = createSlice({
  name: 'PasswordChangePage',
  initialState: {
    changePasswordError: null,
    changePasswordInProgress: false,
    passwordChanged: false,
    resetPasswordInProgress: false,
    resetPasswordError: null,
  },
  reducers: {
    changePasswordClear: state => {
      state.changePasswordError = null;
      state.changePasswordInProgress = false;
      state.passwordChanged = false;
      state.resetPasswordInProgress = false;
      state.resetPasswordError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Change password cases
      .addCase(changePasswordThunk.pending, state => {
        state.changePasswordInProgress = true;
        state.changePasswordError = null;
        state.passwordChanged = false;
      })
      .addCase(changePasswordThunk.fulfilled, state => {
        state.changePasswordInProgress = false;
        state.passwordChanged = true;
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.changePasswordInProgress = false;
        state.changePasswordError = action.payload;
      })
      // Reset password cases
      .addCase(resetPasswordThunk.pending, state => {
        state.resetPasswordInProgress = true;
        state.resetPasswordError = null;
      })
      .addCase(resetPasswordThunk.fulfilled, state => {
        state.resetPasswordInProgress = false;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.resetPasswordInProgress = false;
        state.resetPasswordError = action.payload;
      });
  },
});

export const { changePasswordClear } = passwordChangeSlice.actions;

export default passwordChangeSlice.reducer;
