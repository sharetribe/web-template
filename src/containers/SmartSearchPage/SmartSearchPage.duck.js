import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { smartSearch } from '../../util/api';
import { parse } from '../../util/urlHelpers';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

import {
  PER_PAGE,
  decodeState,
  encodeState,
  normalizeSearchParams,
  requestKey,
} from './SmartSearchPage.helpers';

// ================ Async Thunks ================ //

//////////////////
// Smart search //
//////////////////
const smartSearchPayloadCreator = ({ params, config }, { dispatch, rejectWithValue }) => {
  const { q, s, page, sort } = params;
  const {
    variantPrefix = 'listing-card',
    aspectWidth = 1,
    aspectHeight = 1,
  } = config.layout.listingImage;

  const body = {
    q: q || null,
    state: decodeState(s),
    page,
    perPage: PER_PAGE,
    sort,
    image: { variantPrefix, aspectWidth, aspectHeight },
  };

  return smartSearch(body)
    .then(response => {
      const listingFields = config?.listing?.listingFields;
      // addMarketplaceEntities expects the shape of an SDK response
      dispatch(addMarketplaceEntities({ data: response.listings }, { listingFields }));
      return response;
    })
    .catch(e => {
      return rejectWithValue({ code: e.code || 'INTERNAL_ERROR', message: e.message || null });
    });
};

export const smartSearchThunk = createAsyncThunk(
  'SmartSearchPage/smartSearch',
  smartSearchPayloadCreator
);

// ================ Slice ================ //

const initialState = {
  searchInProgress: false,
  searchError: null,
  // Request that produced the current results
  currentRequestKey: null,
  // URL the page writes after a response; loading it again doesn't need a new request
  responseUrlKey: null,
  searchState: null,
  resultIds: [],
  resultMeta: {},
  relaxation: { auto: null, suggestions: [] },
  notices: [],
  total: { best: 0, related: 0 },
  page: 1,
  totalPages: 0,
  sort: 'relevance',
};

const smartSearchPageSlice = createSlice({
  name: 'SmartSearchPage',
  initialState,
  reducers: {
    clearResults: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(smartSearchThunk.pending, (state, action) => {
        state.searchInProgress = true;
        state.searchError = null;
        state.currentRequestKey = requestKey(action.meta.arg.params);
      })
      .addCase(smartSearchThunk.fulfilled, (state, action) => {
        const { params } = action.meta.arg;
        // Ignore responses of requests that were replaced by a newer one
        if (state.currentRequestKey !== requestKey(params)) {
          return;
        }
        const response = action.payload;
        state.searchInProgress = false;
        state.searchState = response.state;
        state.resultIds = response.results.map(r => r.id);
        state.resultMeta = response.results.reduce(
          (acc, r) => ({ ...acc, [r.id.uuid]: { tier: r.tier, reason: r.reason } }),
          {}
        );
        state.relaxation = response.relaxation || { auto: null, suggestions: [] };
        state.notices = response.notices || [];
        state.total = response.total || { best: 0, related: 0 };
        state.page = response.page || 1;
        state.totalPages = response.totalPages || 0;
        state.sort = params.sort;
        state.responseUrlKey = requestKey({
          q: undefined,
          s: encodeState(response.state),
          page: state.page,
          sort: params.sort,
        });
      })
      .addCase(smartSearchThunk.rejected, (state, action) => {
        if (state.currentRequestKey !== requestKey(action.meta.arg.params)) {
          return;
        }
        state.searchInProgress = false;
        state.searchError = action.payload || { code: 'INTERNAL_ERROR' };
      });
  },
});

export const { clearResults } = smartSearchPageSlice.actions;

export default smartSearchPageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => (dispatch, getState) => {
  // The search runs through this app's own API, which is called from the browser only
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const searchParams = normalizeSearchParams(parse(search));
  if (!searchParams.q && !decodeState(searchParams.s)) {
    dispatch(clearResults());
    return Promise.resolve();
  }

  // After each response the page writes the new state to the URL; that needs no new request
  const { responseUrlKey, currentRequestKey, searchError } = getState().SmartSearchPage;
  const key = requestKey(searchParams);
  const isSameRequest = key === currentRequestKey && !searchError;
  if (key === responseUrlKey || isSameRequest) {
    return Promise.resolve();
  }

  return dispatch(smartSearchThunk({ params: searchParams, config }));
};
