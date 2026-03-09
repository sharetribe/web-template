import { createSlice } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';

const initialState = {
  data: [],
  trends: [],
  meta: {},
  isLoading: false,
  error: null,
  filters: {
    keyword: '',
    category: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    perPage: 20,
  },
};

const priceTrackerSlice = createSlice({
  name: 'PriceTrackerPage',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    fetchPriceTrackerRequest: state => {
      state.isLoading = true;
      state.error = null;
    },
    fetchPriceTrackerSuccess: (state, action) => {
      state.isLoading = false;
      state.data = action.payload.data;
      state.trends = action.payload.trends;
      state.meta = action.payload.meta;
    },
    fetchPriceTrackerError: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setFilters,
  fetchPriceTrackerRequest,
  fetchPriceTrackerSuccess,
  fetchPriceTrackerError,
} = priceTrackerSlice.actions;

export default priceTrackerSlice.reducer;

// Thunk to fetch price tracker data
export const fetchPriceTrackerData = filters => async (dispatch, getState) => {
  dispatch(fetchPriceTrackerRequest());

  try {
    const queryParams = new URLSearchParams({
      keyword: filters.keyword || '',
      category: filters.category || '',
      page: filters.page || 1,
      perPage: filters.perPage || 20,
      sortBy: filters.sortBy || 'date',
      sortOrder: filters.sortOrder || 'desc',
    });

    const response = await fetch(`/api/price-tracker?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    dispatch(fetchPriceTrackerSuccess(data));
  } catch (error) {
    dispatch(fetchPriceTrackerError(storableError(error)));
  }
};

// Selector functions
export const selectPriceTrackerData = state => state.PriceTrackerPage.data;
export const selectPriceTrackerTrends = state => state.PriceTrackerPage.trends;
export const selectPriceTrackerMeta = state => state.PriceTrackerPage.meta;
export const selectPriceTrackerIsLoading = state => state.PriceTrackerPage.isLoading;
export const selectPriceTrackerError = state => state.PriceTrackerPage.error;
export const selectPriceTrackerFilters = state => state.PriceTrackerPage.filters;

// Load data for server-side rendering
export const loadData = (params, search) => async (dispatch, getState) => {
  // Initial load with default filters
  const filters = {
    keyword: '',
    category: '',
    page: 1,
    perPage: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  };

  return dispatch(fetchPriceTrackerData(filters));
};
