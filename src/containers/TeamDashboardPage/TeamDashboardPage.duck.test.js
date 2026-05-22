import reducer, {
  fetchStatsRequest,
  fetchStatsSuccess,
  fetchStatsError,
} from './TeamDashboardPage.duck';

describe('TeamDashboardPage duck reducer', () => {
  it('has sensible defaults', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      stats: null,
      fetchInProgress: false,
      fetchError: null,
    });
  });

  it('sets in-progress on request', () => {
    const state = reducer(undefined, fetchStatsRequest());
    expect(state.fetchInProgress).toBe(true);
    expect(state.fetchError).toBeNull();
  });

  it('stores stats on success', () => {
    const stats = { teamName: 'Seattle Little League', memberCount: 1, listedCount: 2 };
    const state = reducer(reducer(undefined, fetchStatsRequest()), fetchStatsSuccess(stats));
    expect(state.fetchInProgress).toBe(false);
    expect(state.stats).toEqual(stats);
  });

  it('stores the error on failure', () => {
    const error = { type: 'error', name: 'Error', message: 'nope' };
    const state = reducer(reducer(undefined, fetchStatsRequest()), fetchStatsError(error));
    expect(state.fetchInProgress).toBe(false);
    expect(state.fetchError).toEqual(error);
  });
});
