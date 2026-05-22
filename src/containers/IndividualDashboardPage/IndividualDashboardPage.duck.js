import { createSlice } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { summarizeOwnTransactions } from '../../util/transactionMetrics';

// ================ Slice ================ //

const initialState = {
  listedCount: null,
  listings: [],
  soldCount: null,
  purchasedCount: null,
  totalRevenue: null,
  currency: null,
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
      const { count, listings, soldCount, purchasedCount, totalRevenue, currency } = action.payload;
      state.queryInProgress = false;
      state.listedCount = count;
      state.listings = listings;
      state.soldCount = soldCount;
      state.purchasedCount = purchasedCount;
      state.totalRevenue = totalRevenue;
      state.currency = currency;
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
  return Promise.all([
    sdk.ownListings.query({ page: 1, perPage: 100 }),
    sdk.transactions.query({ only: 'sale', perPage: 100 }),
    sdk.transactions.query({ only: 'order', perPage: 100 }),
  ])
    .then(([listingsResp, salesResp, ordersResp]) => {
      const listings = (listingsResp.data.data || []).map(l => ({
        id: l.id.uuid,
        title: l.attributes.title,
      }));
      const metrics = summarizeOwnTransactions(salesResp.data.data, ordersResp.data.data);
      dispatch(
        queryListedSuccess({
          count: listingsResp.data.meta.totalItems,
          listings,
          ...metrics,
        })
      );
    })
    .catch(e => dispatch(queryListedError(storableError(e))));
};
