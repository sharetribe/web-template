import { injectAvFilters } from './avFilters';

// Minimal intl stub — injectAvFilters only needs formatMessage for the label.
const intl = { formatMessage: ({ id }) => id };

describe('injectAvFilters', () => {
  it('returns the list unchanged when there are no size filters', () => {
    const filters = [{ key: 'price' }, { key: 'color' }];
    expect(injectAvFilters(filters, intl)).toEqual(filters);
  });

  it('collapses the per-region size filters into a single grouped_sizes filter', () => {
    const standard = { key: 'standard_sizes', scope: 'public' };
    const us = { key: 'us_sizes', scope: 'public' };
    const filters = [{ key: 'price' }, { key: 'brand' }, { key: 'category' }, standard, us];

    const result = injectAvFilters(filters, intl);

    // Individual size filters are removed...
    expect(result.find(f => f.key === 'standard_sizes')).toBeUndefined();
    expect(result.find(f => f.key === 'us_sizes')).toBeUndefined();

    // ...and replaced by one grouped parent filter.
    const grouped = result.find(f => f.key === 'grouped_sizes');
    expect(grouped).toBeDefined();
    expect(grouped.schemaType).toBe('grouped_enum');
    expect(grouped.scope).toBe('public');
    expect(grouped.filterConfig.filterType).toBe('GroupedSelectMultipleFilter');
    expect(grouped.filterConfig.label).toBe('SearchPage.groupedSizesLabel');
    expect(grouped.childFilters.map(f => f.key)).toEqual(['standard_sizes', 'us_sizes']);

    // Non-size filters are preserved.
    expect(result.map(f => f.key)).toEqual(
      expect.arrayContaining(['price', 'brand', 'category', 'grouped_sizes'])
    );
  });

  it('does not mutate the caller-supplied array', () => {
    const mx = { key: 'mx_sizes', scope: 'public' };
    const filters = [{ key: 'price' }, mx];
    const snapshot = [...filters];

    injectAvFilters(filters, intl);

    expect(filters).toEqual(snapshot);
    expect(filters).toContain(mx);
  });

  it('tolerates an empty or undefined filter list', () => {
    expect(injectAvFilters([], intl)).toEqual([]);
    expect(injectAvFilters(undefined, intl)).toEqual([]);
  });
});
