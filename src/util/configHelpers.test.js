import { moveListingFieldToEnd } from './configHelpers';

describe('moveListingFieldToEnd', () => {
  it('moves the requested field to the end while preserving other order', () => {
    const fields = [
      { key: 'color' },
      { key: 'tags' },
      { key: 'all_sizes' },
      { key: 'brand' },
    ];

    const reordered = moveListingFieldToEnd(fields, 'tags');

    expect(reordered.map(field => field.key)).toEqual(['color', 'all_sizes', 'brand', 'tags']);
  });

  it('returns the original array when the target key is missing', () => {
    const fields = [{ key: 'color' }, { key: 'all_sizes' }];

    expect(moveListingFieldToEnd(fields, 'tags')).toEqual(fields);
  });
});
