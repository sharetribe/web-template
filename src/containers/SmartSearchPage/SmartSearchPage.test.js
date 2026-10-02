import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../util/sdkLoader';
import { createListing, createUser } from '../../util/testData';
import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import SmartSearchPage from './SmartSearchPage';
import reducer, { clearResults, loadData, smartSearchThunk } from './SmartSearchPage.duck';
import {
  addFilter,
  decodeState,
  encodeState,
  normalizeSearchParams,
  removeFilter,
  requestKey,
  toggleLockFilter,
  undoRelaxation,
} from './SmartSearchPage.helpers';

const { UUID } = sdkTypes;
const { screen } = testingLibrary;

const filter = (key, value, label, extra = {}) => ({
  key,
  value,
  label,
  mode: 'hard',
  locked: false,
  source: 'inferred',
  op: 'eq',
  ...extra,
});

const searchState = {
  q: 'vintage jacket for autumn, size L, under 60€',
  filters: [
    filter('size', 'l', 'Size L'),
    filter('price', { max: 6000 }, 'Under €60', { op: 'range' }),
  ],
  preferences: ['vintage', 'autumn'],
  removed: [],
  similarTo: null,
  terms: ['jacket'],
};

describe('SmartSearchPage helpers', () => {
  it('encodes and decodes the state for the URL', () => {
    const s = encodeState(searchState);
    expect(s).not.toMatch(/[+/=]/);
    expect(decodeState(s)).toEqual(searchState);
    expect(decodeState('not-valid')).toBeNull();
    expect(decodeState(undefined)).toBeNull();
  });

  it('edits the state like the contract describes', () => {
    const removed = removeFilter(searchState, searchState.filters[0]);
    expect(removed.filters.map(f => f.key)).toEqual(['price']);
    expect(removed.removed).toEqual(['size']);

    const added = addFilter(removed, { key: 'size', value: 'm', label: 'Size M' });
    expect(added.removed).toEqual([]);
    expect(added.filters.find(f => f.key === 'size')).toMatchObject({
      value: 'm',
      source: 'user',
      mode: 'hard',
      locked: false,
    });

    const locked = toggleLockFilter(searchState, searchState.filters[1]);
    expect(locked.filters[1]).toMatchObject({ locked: true, mode: 'hard' });

    const undone = undoRelaxation(removed, searchState.filters[0]);
    expect(undone.filters.find(f => f.key === 'size').locked).toBe(true);
  });

  it('normalises URL params', () => {
    expect(normalizeSearchParams({ q: '  shoes ', page: '2', sort: 'nope' })).toEqual({
      q: 'shoes',
      s: undefined,
      page: 2,
      sort: 'relevance',
    });
  });
});

describe('SmartSearchPage duck', () => {
  const params = normalizeSearchParams({ q: 'jacket' });
  const response = {
    state: searchState,
    results: [
      { id: new UUID('l2'), tier: 'best', reason: 'Retro bomber' },
      { id: new UUID('l1'), tier: 'related', reason: null },
    ],
    listings: { data: [], included: [] },
    total: { best: 1, related: 1 },
    page: 1,
    perPage: 24,
    totalPages: 1,
    relaxation: { auto: null, suggestions: [] },
    notices: [],
  };

  it('keeps the result order and the tier of each result', () => {
    const pending = reducer(undefined, {
      type: smartSearchThunk.pending.type,
      meta: { arg: { params } },
    });
    const state = reducer(pending, {
      type: smartSearchThunk.fulfilled.type,
      payload: response,
      meta: { arg: { params } },
    });
    expect(state.resultIds.map(id => id.uuid)).toEqual(['l2', 'l1']);
    expect(state.resultMeta.l1.tier).toBe('related');
    expect(state.searchState).toEqual(searchState);
    expect(state.responseUrlKey).toEqual(
      requestKey({ q: undefined, s: encodeState(searchState), page: 1, sort: 'relevance' })
    );
  });

  it('ignores a response to a request that was replaced', () => {
    const pending = reducer(undefined, {
      type: smartSearchThunk.pending.type,
      meta: { arg: { params: normalizeSearchParams({ q: 'newer' }) } },
    });
    const state = reducer(pending, {
      type: smartSearchThunk.fulfilled.type,
      payload: response,
      meta: { arg: { params } },
    });
    expect(state.resultIds).toEqual([]);
    expect(state.searchInProgress).toBe(true);
  });

  it('loadData clears results without a search and skips the URL written after a response', () => {
    const dispatch = jest.fn(action => action);
    const config = getHostedConfiguration();

    loadData({}, '', config)(dispatch, () => ({ SmartSearchPage: reducer(undefined, {}) }));
    expect(dispatch).toHaveBeenCalledWith(clearResults());

    dispatch.mockClear();
    const s = encodeState(searchState);
    const pageState = {
      ...reducer(undefined, {}),
      responseUrlKey: requestKey(normalizeSearchParams({ s })),
    };
    loadData({}, `?s=${s}`, config)(dispatch, () => ({ SmartSearchPage: pageState }));
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('SmartSearchPage', () => {
  const config = getHostedConfiguration();

  it('shows the empty state without a search', () => {
    render(<SmartSearchPage />, {
      initialState: { SmartSearchPage: reducer(undefined, {}) },
      config,
    });
    expect(screen.getByText('SmartSearchPage.emptyTitle')).toBeInTheDocument();
  });

  it('shows chips, preferences and both result sections', () => {
    const author = createUser('author');
    const l1 = createListing('l1', { title: 'Wool coat' }, { author });
    const l2 = createListing('l2', { title: 'Bronze bomber jacket L' }, { author });
    const pageState = {
      ...reducer(undefined, {}),
      searchState,
      resultIds: [l2.id, l1.id],
      resultMeta: {
        l2: { tier: 'best', reason: 'Retro bomber, mid-weight: good for autumn' },
        l1: { tier: 'related', reason: null },
      },
      relaxation: { auto: null, suggestions: [{ key: 'size', label: 'Size L', extra: 3 }] },
      total: { best: 1, related: 1 },
      totalPages: 1,
    };

    render(<SmartSearchPage />, {
      initialState: {
        SmartSearchPage: pageState,
        marketplaceData: {
          entities: {
            user: { author },
            listing: { l1: { ...l1, relationships: {} }, l2: { ...l2, relationships: {} } },
          },
        },
      },
      config,
    });

    expect(screen.getByText('Size L')).toBeInTheDocument();
    expect(screen.getByText('Under €60')).toBeInTheDocument();
    expect(screen.getByText('vintage')).toBeInTheDocument();
    expect(screen.getByText('SmartSearchPage.relaxationSuggestion')).toBeInTheDocument();
    expect(screen.getByText('SmartSearchPage.bestMatches')).toBeInTheDocument();
    expect(screen.getByText('SmartSearchPage.relatedMatches')).toBeInTheDocument();
    expect(screen.getByText('Bronze bomber jacket L')).toBeInTheDocument();
    expect(screen.getByText('Retro bomber, mid-weight: good for autumn')).toBeInTheDocument();
  });
});
