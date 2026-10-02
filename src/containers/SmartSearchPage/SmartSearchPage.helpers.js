/**
 * Helpers for the smart search state (see Hackthon_case/CONTRACT.md, sections 6 and 8).
 * The frontend never builds a state from scratch: it edits the last state from the backend.
 */

export const DEFAULT_SORT = 'relevance';
export const SORT_OPTIONS = ['relevance', 'price-asc', 'price-desc', 'newest'];
export const PER_PAGE = 24;

// ================ URL ================ //

const toBase64Url = str => {
  const base64 =
    typeof window !== 'undefined' && window.btoa
      ? window.btoa(unescape(encodeURIComponent(str)))
      : Buffer.from(str, 'utf8').toString('base64');
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const fromBase64Url = str => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return typeof window !== 'undefined' && window.atob
    ? decodeURIComponent(escape(window.atob(padded)))
    : Buffer.from(padded, 'base64').toString('utf8');
};

/**
 * Encode a search state for the `s` URL parameter.
 *
 * @param {Object?} state
 * @returns {string|undefined}
 */
export const encodeState = state => (state ? toBase64Url(JSON.stringify(state)) : undefined);

/**
 * Decode the `s` URL parameter. Returns null for a missing or broken value.
 *
 * @param {string?} s
 * @returns {Object|null}
 */
export const decodeState = s => {
  if (!s || typeof s !== 'string') {
    return null;
  }
  try {
    const state = JSON.parse(fromBase64Url(s));
    return state && typeof state === 'object' && Array.isArray(state.filters) ? state : null;
  } catch (e) {
    return null;
  }
};

/**
 * Normalised URL search parameters of the smart search page.
 *
 * @param {Object} params parsed query string
 * @returns {{ q: string|undefined, s: string|undefined, page: number, sort: string }}
 */
export const normalizeSearchParams = ({ q, s, page, sort } = {}) => ({
  q: typeof q === 'string' && q.trim() ? q.trim() : undefined,
  s: typeof s === 'string' && s ? s : undefined,
  page: Math.max(1, Number(page) || 1),
  sort: SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SORT,
});

/**
 * Key that identifies a request, so the same request is not sent twice.
 *
 * @param {Object} params normalised search params
 * @returns {string}
 */
export const requestKey = ({ q, s, page, sort }) => JSON.stringify({ q, s, page, sort });

/**
 * URL query params for a search. `sort` and `page` are left out when they have default values.
 *
 * @param {Object} params
 * @returns {Object}
 */
export const toUrlParams = ({ q, s, page, sort }) => ({
  ...(q ? { q } : {}),
  ...(s ? { s } : {}),
  ...(page > 1 ? { page } : {}),
  ...(sort && sort !== DEFAULT_SORT ? { sort } : {}),
});

// ================ State edits (CONTRACT.md §6) ================ //

const withRemoved = (removed = [], key) => (removed.includes(key) ? removed : [...removed, key]);

/** Remove a chip: delete the filter and remember its key in `removed`. */
export const removeFilter = (state, filter) => ({
  ...state,
  filters: state.filters.filter(f => f.key !== filter.key),
  removed: withRemoved(state.removed, filter.key),
});

/** Lock a chip: it becomes a hard filter that the backend keeps. Toggling again unlocks it. */
export const toggleLockFilter = (state, filter) => ({
  ...state,
  filters: state.filters.map(f =>
    f.key === filter.key ? { ...f, locked: !f.locked, mode: 'hard' } : f
  ),
});

/** Add or change a filter from the "+ Add filter" menu. */
export const addFilter = (state, { key, value, label, op = 'eq' }) => ({
  ...state,
  filters: [
    ...state.filters.filter(f => f.key !== key),
    { key, value, label, mode: 'hard', locked: false, source: 'user', op },
  ],
  removed: (state.removed || []).filter(k => k !== key),
});

/** Remove a soft preference tag. */
export const removePreference = (state, preference) => ({
  ...state,
  preferences: (state.preferences || []).filter(p => p !== preference),
});

/** Undo an automatic relaxation: put the dropped filter back, locked. */
export const undoRelaxation = (state, filter) => ({
  ...state,
  filters: [...state.filters.filter(f => f.key !== filter.key), { ...filter, locked: true }],
});
