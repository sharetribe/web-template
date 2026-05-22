import reducer, {
  queryListedRequest,
  queryListedSuccess,
  queryListedError,
} from './IndividualDashboardPage.duck';

describe('IndividualDashboardPage duck reducer', () => {
  it('has sensible defaults', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      listedCount: null,
      queryInProgress: false,
      queryError: null,
    });
  });

  it('sets in-progress on request', () => {
    const state = reducer(undefined, queryListedRequest());
    expect(state.queryInProgress).toBe(true);
    expect(state.queryError).toBeNull();
  });

  it('stores the listed count on success', () => {
    const state = reducer(reducer(undefined, queryListedRequest()), queryListedSuccess(3));
    expect(state.queryInProgress).toBe(false);
    expect(state.listedCount).toBe(3);
  });

  it('stores the error on failure', () => {
    const error = { type: 'error', name: 'Error', message: 'nope' };
    const state = reducer(reducer(undefined, queryListedRequest()), queryListedError(error));
    expect(state.queryInProgress).toBe(false);
    expect(state.queryError).toEqual(error);
  });
});
