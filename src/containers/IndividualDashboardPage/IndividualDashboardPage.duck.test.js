import reducer, {
  queryListedRequest,
  queryListedSuccess,
  queryListedError,
} from './IndividualDashboardPage.duck';

describe('IndividualDashboardPage duck reducer', () => {
  it('has sensible defaults', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      listedCount: null,
      listings: [],
      queryInProgress: false,
      queryError: null,
    });
  });

  it('sets in-progress on request', () => {
    const state = reducer(undefined, queryListedRequest());
    expect(state.queryInProgress).toBe(true);
    expect(state.queryError).toBeNull();
  });

  it('stores the listed count and listings on success', () => {
    const payload = { count: 2, listings: [{ id: 'a', title: 'Glove' }, { id: 'b', title: 'Bat' }] };
    const state = reducer(reducer(undefined, queryListedRequest()), queryListedSuccess(payload));
    expect(state.queryInProgress).toBe(false);
    expect(state.listedCount).toBe(2);
    expect(state.listings).toEqual(payload.listings);
  });

  it('stores the error on failure', () => {
    const error = { type: 'error', name: 'Error', message: 'nope' };
    const state = reducer(reducer(undefined, queryListedRequest()), queryListedError(error));
    expect(state.queryInProgress).toBe(false);
    expect(state.queryError).toEqual(error);
  });
});
