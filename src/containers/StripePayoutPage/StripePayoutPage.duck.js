import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pick } from '../../util/common';
import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Async thunks ================ //

const savePayoutDetailsPayloadCreator = (
  { values },
  { dispatch, extra: sdk, rejectWithValue }
) => {
  return sdk.currentUser
    .updateProfile(
      { privateData: { manualPayoutDetails: values } },
      { expand: true }
    )
    .then(() => dispatch(fetchCurrentUser()))
    .catch(() => rejectWithValue('Failed to save payout details'));
};

export const savePayoutDetailsThunk = createAsyncThunk(
  'StripePayoutPage/savePayoutDetails',
  savePayoutDetailsPayloadCreator
);

export const savePayoutDetails = values => dispatch =>
  dispatch(savePayoutDetailsThunk({ values })).unwrap();

// ================ Slice ================ //

const initialState = {
  payoutDetailsSaveInProgress: false,
  payoutDetailsSaved: false,
};

const stripePayoutPageSlice = createSlice({
  name: 'StripePayoutPage',
  initialState,
  reducers: {
    setInitialValues: (state, action) => ({
      ...initialState,
      ...pick(action.payload, Object.keys(initialState)),
    }),
  },
  extraReducers: builder => {
    builder
      .addCase(savePayoutDetailsThunk.pending, state => {
        state.payoutDetailsSaveInProgress = true;
        state.payoutDetailsSaved = false;
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

export const { setInitialValues } = stripePayoutPageSlice.actions;
export default stripePayoutPageSlice.reducer;

// ================ Load Data ================ //

export const loadData = () => (dispatch) => {
  dispatch(setInitialValues());
  return dispatch(fetchCurrentUser({ updateHasListings: false, updateNotifications: false }));
};