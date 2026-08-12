import {
  optionsFromChildren,
  getScrollBoundary,
  moveHighlight,
  findTypeaheadMatch,
} from './FieldSelectPopup.helpers';

describe('FieldSelectPopup helpers', () => {
  describe('optionsFromChildren(children)', () => {
    it('maps <option> elements into { value, label, disabled } objects, preserving order', () => {
      const children = [
        <option value="09:00">9:00 AM</option>,
        <option value="09:15">9:15 AM</option>,
      ];
      expect(optionsFromChildren(children)).toEqual([
        { value: '09:00', label: '9:00 AM', disabled: false },
        { value: '09:15', label: '9:15 AM', disabled: false },
      ]);
    });

    it('marks an option with the disabled prop as disabled: true', () => {
      const children = [
        <option disabled value="">
          Choose start time
        </option>,
      ];
      expect(optionsFromChildren(children)).toEqual([
        { value: '', label: 'Choose start time', disabled: true },
      ]);
    });

    it('filters out non-<option> children', () => {
      const children = [
        <option value="09:00">9:00 AM</option>,
        <span>not an option</span>,
        null,
        false,
      ];
      expect(optionsFromChildren(children)).toEqual([
        { value: '09:00', label: '9:00 AM', disabled: false },
      ]);
    });

    it('accepts a single <option> passed directly, not wrapped in an array', () => {
      expect(optionsFromChildren(<option value="09:00">9:00 AM</option>)).toEqual([
        { value: '09:00', label: '9:00 AM', disabled: false },
      ]);
    });

    it('returns an empty array when there are no children', () => {
      expect(optionsFromChildren(undefined)).toEqual([]);
      expect(optionsFromChildren(null)).toEqual([]);
      expect(optionsFromChildren([])).toEqual([]);
    });

    it('coerces a missing disabled prop to false rather than undefined', () => {
      const [option] = optionsFromChildren([<option value="09:00">9:00 AM</option>]);
      expect(option.disabled).toBe(false);
    });
  });

  describe('getScrollBoundary(element)', () => {
    afterEach(() => {
      document.body.innerHTML = '';
      document.body.style.overflowY = '';
    });

    // Builds a chain of nested <div>s appended to document.body, one per entry in `overflowYs`,
    // outermost first, and returns them in the same order, so the last entry is the "trigger"
    // to pass to getScrollBoundary.
    const appendChain = overflowYs => {
      let parent = document.body;
      return overflowYs.map(overflowY => {
        const node = document.createElement('div');
        if (overflowY) {
          node.style.overflowY = overflowY;
        }
        parent.appendChild(node);
        parent = node;
        return node;
      });
    };

    it('falls back to the viewport when no ancestor clips vertical overflow', () => {
      window.innerHeight = 800;
      const [trigger] = appendChain([undefined]).slice(-1);
      expect(getScrollBoundary(trigger)).toEqual({ top: 0, bottom: 800 });
    });

    it("returns the nearest ancestor's rect when it has overflow-y: auto", () => {
      const [ancestor, trigger] = appendChain(['auto', undefined]);
      jest.spyOn(ancestor, 'getBoundingClientRect').mockReturnValue({ top: 10, bottom: 200 });
      expect(getScrollBoundary(trigger)).toEqual({ top: 10, bottom: 200 });
    });

    it("returns the nearest ancestor's rect when it has overflow-y: scroll", () => {
      const [ancestor, trigger] = appendChain(['scroll', undefined]);
      jest.spyOn(ancestor, 'getBoundingClientRect').mockReturnValue({ top: 5, bottom: 300 });
      expect(getScrollBoundary(trigger)).toEqual({ top: 5, bottom: 300 });
    });

    it("returns the nearest ancestor's rect when it has overflow-y: hidden", () => {
      const [ancestor, trigger] = appendChain(['hidden', undefined]);
      jest.spyOn(ancestor, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 400 });
      expect(getScrollBoundary(trigger)).toEqual({ top: 0, bottom: 400 });
    });

    it("returns the nearer ancestor's rect, not a farther one, when multiple ancestors clip overflow", () => {
      const [outer, nearer, trigger] = appendChain(['auto', 'scroll', undefined]);
      jest.spyOn(outer, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 1000 });
      jest.spyOn(nearer, 'getBoundingClientRect').mockReturnValue({ top: 50, bottom: 250 });
      expect(getScrollBoundary(trigger)).toEqual({ top: 50, bottom: 250 });
    });

    it('never checks document.body itself, even when it has a qualifying overflow-y', () => {
      window.innerHeight = 600;
      document.body.style.overflowY = 'auto';
      const [trigger] = appendChain([undefined]);
      expect(getScrollBoundary(trigger)).toEqual({ top: 0, bottom: 600 });
    });

    it('falls back to the viewport when the element has no parent (e.g. detached from the DOM)', () => {
      window.innerHeight = 700;
      const detached = document.createElement('div');
      expect(getScrollBoundary(detached)).toEqual({ top: 0, bottom: 700 });
    });

    it('falls back to the viewport when no element is given', () => {
      window.innerHeight = 700;
      expect(getScrollBoundary(undefined)).toEqual({ top: 0, bottom: 700 });
    });
  });

  describe('moveHighlight(direction, enabledIndices, highlightedIndex)', () => {
    it('returns highlightedIndex unchanged when there are no enabled options', () => {
      expect(moveHighlight('down', [], -1)).toBe(-1);
      expect(moveHighlight('up', [], 2)).toBe(2);
    });

    it('moves to the first enabled option when nothing is highlighted yet, for either direction', () => {
      expect(moveHighlight('down', [1, 2, 3], -1)).toBe(1);
      expect(moveHighlight('up', [1, 2, 3], -1)).toBe(1);
    });

    it('moves down to the next enabled index, skipping gaps left by disabled options', () => {
      expect(moveHighlight('down', [1, 3, 5], 1)).toBe(3);
      expect(moveHighlight('down', [1, 3, 5], 3)).toBe(5);
    });

    it('moves up to the previous enabled index, skipping gaps left by disabled options', () => {
      expect(moveHighlight('up', [1, 3, 5], 5)).toBe(3);
      expect(moveHighlight('up', [1, 3, 5], 3)).toBe(1);
    });

    it('clamps at the last enabled index instead of wrapping around', () => {
      expect(moveHighlight('down', [1, 3, 5], 5)).toBe(5);
    });

    it('clamps at the first enabled index instead of wrapping around', () => {
      expect(moveHighlight('up', [1, 3, 5], 1)).toBe(1);
    });

    it('is a no-op in both directions when there is only one enabled option', () => {
      expect(moveHighlight('down', [2], 2)).toBe(2);
      expect(moveHighlight('up', [2], 2)).toBe(2);
    });

    it('treats a highlightedIndex that is no longer enabled the same as "nothing highlighted"', () => {
      // e.g. the previously-highlighted option became disabled since the last render.
      expect(moveHighlight('down', [1, 3, 5], 2)).toBe(1);
      expect(moveHighlight('up', [1, 3, 5], 2)).toBe(1);
    });
  });

  describe('findTypeaheadMatch(query, options, enabledIndices, highlightedIndex)', () => {
    const options = [
      { value: '', label: '9 - Choose start time', disabled: true },
      { value: '09:00', label: '9:00 AM', disabled: false },
      { value: '09:15', label: '9:15 AM', disabled: false },
      { value: '09:30', label: '9:30 AM', disabled: false },
      { value: '13:00', label: '1:00 PM', disabled: false },
      { value: '12:00', label: '12:00 PM', disabled: false },
    ];
    // Excludes the disabled placeholder at index 0.
    const enabledIndices = [1, 2, 3, 4, 5];

    it('returns the index of the enabled option whose label starts with the query', () => {
      expect(findTypeaheadMatch('9:1', options, enabledIndices, -1)).toBe(2);
    });

    it('matches case-insensitively', () => {
      const caseOptions = [{ value: 'am', label: 'AM', disabled: false }];
      expect(findTypeaheadMatch('a', caseOptions, [0], -1)).toBe(0);
    });

    it('returns -1 when no enabled option matches', () => {
      expect(findTypeaheadMatch('z', options, enabledIndices, -1)).toBe(-1);
    });

    it('excludes disabled options even when their label also matches the query', () => {
      // The placeholder's own label ("9 - Choose start time") also starts with "9", but index 0
      // is not in enabledIndices, so it must never be returned.
      expect(findTypeaheadMatch('9', options, enabledIndices, -1)).toBe(1);
    });

    it('a genuine multi-character, non-repeated query always returns the first match, never cycles', () => {
      expect(findTypeaheadMatch('1', options, enabledIndices, 4)).toBe(4);
      expect(findTypeaheadMatch('12', options, enabledIndices, 4)).toBe(5);
    });

    it('collapses a repeated single character into that one character before matching', () => {
      // "999" would (almost) never match a real label literally. Collapsed to "9" it matches
      // every "9..." option, same as a query of just "9".
      expect(findTypeaheadMatch('999', options, enabledIndices, -1)).toBe(1);
    });

    it('cycles to the next match (not the first) when the query is a repeated character', () => {
      expect(findTypeaheadMatch('99', options, enabledIndices, 1)).toBe(2);
      expect(findTypeaheadMatch('99', options, enabledIndices, 2)).toBe(3);
    });

    it('wraps from the last match back to the first on repeated-character cycling', () => {
      expect(findTypeaheadMatch('99', options, enabledIndices, 3)).toBe(1);
    });

    it('lands on the first match when repeated-character cycling starts from a non-matching highlight', () => {
      expect(findTypeaheadMatch('99', options, enabledIndices, -1)).toBe(1);
      // Index 4 ("1:00 PM") is highlighted but isn't itself a "9..." match.
      expect(findTypeaheadMatch('99', options, enabledIndices, 4)).toBe(1);
    });

    it('never treats a single-character query as a repeat, even called again with the same highlight', () => {
      expect(findTypeaheadMatch('9', options, enabledIndices, 1)).toBe(1);
      expect(findTypeaheadMatch('9', options, enabledIndices, 1)).toBe(1);
    });

    it('returns -1 when there are no enabled options to search, regardless of query', () => {
      expect(findTypeaheadMatch('9', options, [], -1)).toBe(-1);
    });
  });
});
