import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';

// ================ Async Thunks ================ //

export const recoverPassword = createAsyncThunk(
  'passwordRecoveryPage/recoverPassword',
  ({ email }, { rejectWithValue, extra: sdk }) => {
    return sdk.passwordReset
      .request({ email })
      .then(() => ({ email }))
      .catch(e => rejectWithValue({ error: storableError(e), email }));
  }
);

// ================ Slice ================ //

const passwordRecoveryPageSlice = createSlice({
  name: 'passwordRecoveryPage',
  initialState: {
    initialEmail: null,
    submittedEmail: null,
    recoveryError: null,
    recoveryInProgress: false,
    passwordRequested: false,
  },
  reducers: {
    retypePasswordRecoveryEmail: state => {
      state.initialEmail = state.submittedEmail;
      state.submittedEmail = null;
      state.passwordRequested = false;
    },
    clearPasswordRecoveryError: state => {
      state.recoveryError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(recoverPassword.pending, state => {
        state.submittedEmail = null;
        state.recoveryInProgress = true;
        state.recoveryError = null;
      })
      .addCase(recoverPassword.fulfilled, (state, action) => {
        const { email } = action.payload;
        state.submittedEmail = email;
        state.initialEmail = email;
        state.recoveryInProgress = false;
        state.passwordRequested = true;
      })
      .addCase(recoverPassword.rejected, (state, action) => {
        const { error, email } = action.payload;
        state.recoveryInProgress = false;
        state.recoveryError = error;
        state.initialEmail = email;
      });
  },
});

export const {
  retypePasswordRecoveryEmail,
  clearPasswordRecoveryError,
} = passwordRecoveryPageSlice.actions;

export default passwordRecoveryPageSlice.reducer;
