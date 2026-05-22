import { createSlice } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';

// ================ Slice ================ //

const initialState = {
  listedCount: null,
  queryInProgress: false,
  queryError: null,
};

const individualDashboardPageSlice = createSlice({
  name: 'IndividualDashboardPage',
  initialState,
  reducers: {
    queryListedRequest: state => {
      state.queryInProgress = true;
      state.queryError = null;
    },
    queryListedSuccess: (state, action) => {
      state.queryInProgress = false;
      state.listedCount = action.payload;
    },
    queryListedError: (state, action) => {
      state.queryInProgress = false;
      state.queryError = action.payload;
    },
  },
});

export const {
  queryListedRequest,
  queryListedSuccess,
  queryListedError,
} = individualDashboardPageSlice.actions;
export default individualDashboardPageSlice.reducer;

// ================ Thunks ================ //

// Count the current user's own listings (their own data, via the authenticated Marketplace SDK).
// SSR-friendly: registered as the page's loadData. Teams/sports come from the current user entity
// already in the store, so they don't need a fetch here.
export const loadData = () => (dispatch, getState, sdk) => {
  dispatch(queryListedRequest());
  return sdk.ownListings
    .query({ page: 1, perPage: 1 })
    .then(response => dispatch(queryListedSuccess(response.data.meta.totalItems)))
    .catch(e => dispatch(queryListedError(storableError(e))));
};
