import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import pick from 'lodash/pick';
import {
  createStripeAccount,
  updateStripeAccount,
  fetchStripeAccount,
} from '../../ducks/stripeConnectAccount.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Async thunks ================ //

const savePayoutDetailsPayloadCreator = (
  { values, isUpdateCall },
  { dispatch, extra: sdk, rejectWithValue }
) => {
  const upsertThunk = isUpdateCall ? updateStripeAccount : createStripeAccount;

  return dispatch(upsertThunk(values, { expand: true }))
    .then(response => {
      return response;
    })
    .catch(() => {
      return rejectWithValue('Failed to save payout details');
    });
};
export const savePayoutDetailsThunk = createAsyncThunk(
  'StripePayoutPage/savePayoutDetails',
  savePayoutDetailsPayloadCreator
);
// Backward compatible wrapper function
export const savePayoutDetails = (values, isUpdateCall) => dispatch => {
  return dispatch(savePayoutDetailsThunk({ values, isUpdateCall })).unwrap();
};

// ================ Slice ================ //

const initialState = {
  payoutDetailsSaveInProgress: false,
  payoutDetailsSaved: false,
  fromReturnURL: false,
};

const stripePayoutPageSlice = createSlice({
  name: 'StripePayoutPage',
  initialState,
  reducers: {
    setInitialValues: (state, action) => {
      return { ...initialState, ...pick(action.payload, Object.keys(initialState)) };
    },
  },
  extraReducers: builder => {
    builder
      // Save Payout Details cases
      .addCase(savePayoutDetailsThunk.pending, state => {
        state.payoutDetailsSaveInProgress = true;
      })
      .addCase(savePayoutDetailsThunk.fulfilled, state => {
        state.payoutDetailsSaveInProgress = false;
        state.payoutDetailsSaved = true;
      })
      .addCase(savePayoutDetailsThunk.rejected, state => {
        state.payoutDetailsSaveInProgress = false;
      });
  },
});

// Export the action creators
export const { setInitialValues } = stripePayoutPageSlice.actions;

export default stripePayoutPageSlice.reducer;

// ================ Load Data ================ //

export const loadData = () => (dispatch, getState, sdk) => {
  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialValues());
  const fetchCurrentUserOptions = {
    updateHasListings: false,
    updateNotifications: false,
  };

  return dispatch(fetchCurrentUser(fetchCurrentUserOptions)).then(response => {
    const currentUser = getState().user.currentUser;
    if (currentUser && currentUser.stripeAccount) {
      dispatch(fetchStripeAccount());
    }
    return response;
  });
};
