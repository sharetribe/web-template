import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { getSupportedProcessesInfo, INQUIRY_PROCESS_NAME } from '../../transactions/transaction';
import {
  buildFilteredQueryParams,
  getCompletedTransitions,
  getRefundedTransitions,
} from '../../transactions/transactionHelpers';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import * as log from '../../util/log';

const PAGE_SIZE = 10;

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const paymentProcessNames = () =>
  getSupportedProcessesInfo()
    .filter(p => p.name !== INQUIRY_PROCESS_NAME)
    .map(p => p.name);

const myBalancePageSlice = createSlice({
  name: 'MyBalancePage',
  initialState: {
    fetchInProgress: false,
    fetchError: null,
    pagination: null,
    transactionRefs: [],
    summaryFetchInProgress: false,
    summaryLoaded: false,
    completedTotalAmount: 0,
    pendingTotalAmount: 0,
    cancelledCount: 0,
    currentMonthCompletedAmount: 0,
    currentMonthPendingAmount: 0,
    currentMonthCancelledCount: 0,
    currency: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // Main transaction list
      .addCase(loadTransactionsThunk.pending, state => {
        state.fetchInProgress = true;
        state.fetchError = null;
      })
      .addCase(loadTransactionsThunk.fulfilled, (state, action) => {
        const transactions = action.payload.data.data;
        state.fetchInProgress = false;
        state.transactionRefs = entityRefs(transactions);
        state.pagination = action.payload.data.meta;
      })
      .addCase(loadTransactionsThunk.rejected, (state, action) => {
        log.error(action.payload || action.error, 'my-balance-fetch-failed');
        state.fetchInProgress = false;
        state.fetchError = action.payload;
      })
      // Summary totals
      .addCase(fetchSummaryThunk.pending, state => {
        state.summaryFetchInProgress = true;
      })
      .addCase(fetchSummaryThunk.fulfilled, (state, action) => {
        const {
          completedTotalAmount,
          pendingTotalAmount,
          cancelledCount,
          currentMonthCompletedAmount,
          currentMonthPendingAmount,
          currentMonthCancelledCount,
          currency,
        } = action.payload;
        state.summaryFetchInProgress = false;
        state.summaryLoaded = true;
        state.completedTotalAmount = completedTotalAmount;
        state.pendingTotalAmount = pendingTotalAmount;
        state.cancelledCount = cancelledCount;
        state.currentMonthCompletedAmount = currentMonthCompletedAmount;
        state.currentMonthPendingAmount = currentMonthPendingAmount;
        state.currentMonthCancelledCount = currentMonthCancelledCount;
        state.currency = currency;
      })
      .addCase(fetchSummaryThunk.rejected, (state, action) => {
        log.error(action.payload || action.error, 'my-balance-summary-failed');
        state.summaryFetchInProgress = false;
      });
  },
});

export default myBalancePageSlice.reducer;

// Shared query config for transaction includes/fields
const txQueryConfig = {
  only: 'sale',
  include: [
    'listing',
    'provider',
    'provider.profileImage',
    'customer',
    'customer.profileImage',
    'booking',
  ],
  'fields.transaction': [
    'processName',
    'lastTransition',
    'lastTransitionedAt',
    'payinTotal',
    'payoutTotal',
    'lineItems',
  ],
  'fields.listing': ['title', 'availabilityPlan', 'publicData.listingType'],
  'fields.user': ['profile.displayName', 'profile.abbreviatedName', 'deleted', 'banned'],
  'fields.image': ['variants.square-small', 'variants.square-small2x'],
};

// Thunk: load paginated, filtered transaction list
const loadTransactionsPayloadCreator = ({ search }, { dispatch, rejectWithValue, extra: sdk }) => {
  const searchParams = parse(search);
  const { page = 1 } = searchParams;
  const processNames = paymentProcessNames();
  const filterParams = buildFilteredQueryParams(searchParams, { only: 'sale' });

  const apiQueryParams = {
    ...txQueryConfig,
    processNames: filterParams.processNames || processNames,
    page,
    perPage: PAGE_SIZE,
  };

  // Apply filter-specific params
  if (filterParams.lastTransitions) {
    apiQueryParams.lastTransitions = filterParams.lastTransitions;
  }
  if (filterParams.createdAtStart) {
    apiQueryParams.createdAtStart = filterParams.createdAtStart;
  }
  if (filterParams.createdAtEnd) {
    apiQueryParams.createdAtEnd = filterParams.createdAtEnd;
  }

  return sdk.transactions
    .query(apiQueryParams)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      return response;
    })
    .catch(e => rejectWithValue(storableError(e)));
};

export const loadTransactionsThunk = createAsyncThunk(
  'MyBalancePage/loadTransactions',
  loadTransactionsPayloadCreator
);

// Thunk: fetch summary totals from the server endpoint, which paginates fully.
// The server scopes results to the authenticated user via the cookie SDK.
const fetchSummaryPayloadCreator = async (_, { rejectWithValue }) => {
  const params = new URLSearchParams({
    completed: getCompletedTransitions().join(','),
    refunded: getRefundedTransitions().join(','),
    processNames: paymentProcessNames().join(','),
  });
  try {
    const res = await fetch(`/api/my-balance/summary?${params.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return rejectWithValue(storableError(new Error(body.error || `summary_failed_${res.status}`)));
    }
    const body = await res.json();
    return body;
  } catch (e) {
    return rejectWithValue(storableError(e));
  }
};

export const fetchSummaryThunk = createAsyncThunk(
  'MyBalancePage/fetchSummary',
  fetchSummaryPayloadCreator
);

export const loadData = (params, search) => (dispatch, getState) => {
  const promises = [dispatch(loadTransactionsThunk({ search }))];
  // Summary is invariant of pagination/filter — only fetch once per session.
  // Skip on SSR: fetch() to a same-origin path needs an absolute URL in Node, and
  // the summary is per-user/personalized, so it doesn't help SSR cache or SEO.
  const isClient = typeof window !== 'undefined';
  if (isClient && !getState().MyBalancePage.summaryLoaded) {
    promises.push(dispatch(fetchSummaryThunk()));
  }
  return Promise.all(promises);
};
