import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';

// ================ Async thunk ================ //

export const resetPasswordThunk = createAsyncThunk(
  'PasswordResetPage/resetPassword',
  ({ email, passwordResetToken, newPassword }, { extra: sdk, rejectWithValue }) => {
    const params = { email, passwordResetToken, newPassword };
    return sdk.passwordReset.reset(params).catch(e => {
      return rejectWithValue(storableError(e));
    });
  }
);
// Backward compatible wrapper for the thunk
// Note: we unwrap the thunk so that the promise chain can be listened on presentational components.
export const resetPassword = (email, passwordResetToken, newPassword) => dispatch => {
  return dispatch(resetPasswordThunk({ email, passwordResetToken, newPassword })).unwrap();
};

// ================ Slice ================ //

const passwordResetSlice = createSlice({
  name: 'PasswordResetPage',
  initialState: {
    resetPasswordInProgress: false,
    resetPasswordError: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
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

export default passwordResetSlice.reducer;
