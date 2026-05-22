import { createSlice } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { fetchTeamStats } from '../../util/api';

// ================ Slice ================ //

const initialState = {
  stats: null,
  fetchInProgress: false,
  fetchError: null,
};

const teamDashboardPageSlice = createSlice({
  name: 'TeamDashboardPage',
  initialState,
  reducers: {
    fetchStatsRequest: state => {
      state.fetchInProgress = true;
      state.fetchError = null;
    },
    fetchStatsSuccess: (state, action) => {
      state.fetchInProgress = false;
      state.stats = action.payload;
    },
    fetchStatsError: (state, action) => {
      state.fetchInProgress = false;
      state.fetchError = action.payload;
    },
  },
});

export const { fetchStatsRequest, fetchStatsSuccess, fetchStatsError } = teamDashboardPageSlice.actions;
export default teamDashboardPageSlice.reducer;

// ================ Thunks ================ //

/**
 * Fetch the team dashboard metrics for the authenticated team account.
 * Fetched client-side (authed, user-specific content), not via SSR loadData.
 */
export const loadTeamStats = () => dispatch => {
  dispatch(fetchStatsRequest());
  return fetchTeamStats()
    .then(stats => dispatch(fetchStatsSuccess(stats)))
    .catch(e => dispatch(fetchStatsError(storableError(e))));
};
