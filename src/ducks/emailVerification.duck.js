import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../util/errors';
import { fetchCurrentUser } from './user.duck';

// ================ Async Thunk ================ //

export const verifyEmail = createAsyncThunk(
  'emailVerification/verifyEmail',
  (verificationToken, { dispatch, rejectWithValue, extra: sdk }) => {
    return sdk.currentUser
      .verifyEmail({ verificationToken })
      .then(() => {
        // Dispatch fetchCurrentUser after successful verification
        dispatch(fetchCurrentUser({ enforce: true }));
        return true;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  },
  {
    condition: (verificationToken, { getState }) => {
      const state = getState();
      if (state.emailVerification.verificationInProgress) {
        return false; // Don't dispatch if verification is already in progress
      }
      return true;
    },
  }
);

// Backward compatible wrapper for the thunk
export const verify = verificationToken => (dispatch, getState, sdk) => {
  return dispatch(verifyEmail(verificationToken));
};

// ================ Slice ================ //

const emailVerificationSlice = createSlice({
  name: 'emailVerification',
  initialState: {
    isVerified: false,
    verificationError: null,
    verificationInProgress: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(verifyEmail.pending, state => {
        state.verificationInProgress = true;
        state.verificationError = null;
      })
      .addCase(verifyEmail.fulfilled, state => {
        state.verificationInProgress = false;
        state.isVerified = true;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.verificationInProgress = false;
        state.verificationError = action.payload;
      });
  },
});

export default emailVerificationSlice.reducer;
