/**
 * Walks up from the trigger to find the nearest ancestor that clips vertical overflow (a scroll
 * container like a Modal's scroll layer, or any other `overflow: auto/scroll/hidden` ancestor).
 * Falls back to a full-viewport-sized boundary when no such ancestor exists.
 *
 * @param {HTMLElement} element the trigger element to walk up from
 * @returns {{top: number, bottom: number}} the boundary's vertical extent
 */
export const getScrollBoundary = element => {
  let node = element?.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') {
      return node.getBoundingClientRect();
    }
    node = node.parentElement;
  }
  return { top: 0, bottom: window.innerHeight };
};

/**
 * Moves the highlight among enabled options only (skips the disabled placeholder), clamped at
 * either end rather than wrapping around.
 *
 * @param {'up'|'down'} direction
 * @param {Array<number>} enabledIndices indices (into the full options array) of enabled options
 * @param {number} highlightedIndex the currently highlighted option's index, or -1
 * @returns {number} the next highlighted index (unchanged if there are no enabled options)
 */
export const moveHighlight = (direction, enabledIndices, highlightedIndex) => {
  if (enabledIndices.length === 0) {
    return highlightedIndex;
  }
  const currentPos = enabledIndices.indexOf(highlightedIndex);
  const nextPos =
    direction === 'up'
      ? Math.max(currentPos - 1, 0)
      : currentPos === -1
      ? 0
      : Math.min(currentPos + 1, enabledIndices.length - 1);
  return enabledIndices[nextPos];
};

/**
 * Finds the type-ahead target for the given accumulated query, matching native <select> behavior:
 * searches only enabled options, case-insensitively, by whether their label starts with the
 * query. A repeated single character (e.g. "111") is collapsed to one character and cycles to
 * the next match after the current highlight, so repeated presses step through every option
 * sharing that character. Any other query jumps to its first match. Returns -1 for no match.
 *
 * @param {string} query the accumulated type-ahead search string
 * @param {Array<{value: string, label: ReactNode, disabled: boolean}>} options
 * @param {Array<number>} enabledIndices indices (into `options`) of enabled options
 * @param {number} highlightedIndex the currently highlighted option's index, or -1
 * @returns {number} the matching option's index, or -1 if nothing matches
 */
export const findTypeaheadMatch = (query, options, enabledIndices, highlightedIndex) => {
  const normalizedQuery = query.toLowerCase();
  const isRepeatedSingleChar =
    normalizedQuery.length > 1 && [...normalizedQuery].every(char => char === normalizedQuery[0]);
  const effectiveQuery = isRepeatedSingleChar ? normalizedQuery[0] : normalizedQuery;
  const matches = enabledIndices.filter(i =>
    String(options[i].label)
      .toLowerCase()
      .startsWith(effectiveQuery)
  );
  if (matches.length === 0) {
    return -1;
  }
  if (isRepeatedSingleChar) {
    const currentPos = matches.indexOf(highlightedIndex);
    return matches[(currentPos + 1) % matches.length];
  }
  return matches[0];
};
