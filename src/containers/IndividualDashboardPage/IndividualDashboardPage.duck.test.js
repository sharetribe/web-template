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
      soldCount: null,
      purchasedCount: null,
      totalRevenue: null,
      currency: null,
      queryInProgress: false,
      queryError: null,
    });
  });

  it('sets in-progress on request', () => {
    const state = reducer(undefined, queryListedRequest());
    expect(state.queryInProgress).toBe(true);
    expect(state.queryError).toBeNull();
  });

  it('stores listings and transaction metrics on success', () => {
    const payload = {
      count: 2,
      listings: [{ id: 'a', title: 'Glove' }, { id: 'b', title: 'Bat' }],
      soldCount: 1,
      purchasedCount: 3,
      totalRevenue: 4500,
      currency: 'USD',
    };
    const state = reducer(reducer(undefined, queryListedRequest()), queryListedSuccess(payload));
    expect(state.queryInProgress).toBe(false);
    expect(state.listedCount).toBe(2);
    expect(state.listings).toEqual(payload.listings);
    expect(state.soldCount).toBe(1);
    expect(state.purchasedCount).toBe(3);
    expect(state.totalRevenue).toBe(4500);
    expect(state.currency).toBe('USD');
  });

  it('stores the error on failure', () => {
    const error = { type: 'error', name: 'Error', message: 'nope' };
    const state = reducer(reducer(undefined, queryListedRequest()), queryListedError(error));
    expect(state.queryInProgress).toBe(false);
    expect(state.queryError).toEqual(error);
  });
});
