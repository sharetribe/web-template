import { pickFieldOptions } from './PageBuilder.helpers';

describe('PageBuilder.helpers', () => {
  describe('pickFieldOptions()', () => {
    it('returns an empty object when options are empty', () => {
      expect(pickFieldOptions()).toEqual({});
      expect(pickFieldOptions({})).toEqual({});
    });

    it('keeps fieldComponents and fetchPriority only', () => {
      const fieldComponents = { custom: {} };
      expect(
        pickFieldOptions({
          fieldComponents,
          fetchPriority: 'high',
          defaultClasses: { title: 'x' },
          featuredListings: {},
        })
      ).toEqual({ fieldComponents, fetchPriority: 'high' });
    });

    it('omits fetchPriority when falsy', () => {
      expect(pickFieldOptions({ fetchPriority: null })).toEqual({});
    });
  });
});
