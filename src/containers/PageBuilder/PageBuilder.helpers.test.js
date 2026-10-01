import {
  LAZY_IMAGES_FROM_SECTION_INDEX,
  isLazyImagesSection,
  pickFieldOptions,
} from './PageBuilder.helpers';

describe('PageBuilder.helpers', () => {
  describe('isLazyImagesSection()', () => {
    it('returns false for section indexes before LAZY_IMAGES_FROM_SECTION_INDEX', () => {
      for (let i = 0; i < LAZY_IMAGES_FROM_SECTION_INDEX; i++) {
        expect(isLazyImagesSection(i)).toEqual(false);
      }
    });

    it('returns true for indexes at or after LAZY_IMAGES_FROM_SECTION_INDEX', () => {
      expect(isLazyImagesSection(LAZY_IMAGES_FROM_SECTION_INDEX)).toEqual(true);
      expect(isLazyImagesSection(LAZY_IMAGES_FROM_SECTION_INDEX + 5)).toEqual(true);
    });

    it('returns false for non-number indexes', () => {
      expect(isLazyImagesSection(undefined)).toEqual(false);
      expect(isLazyImagesSection(null)).toEqual(false);
    });
  });

  describe('pickFieldOptions()', () => {
    it('returns an empty object when options are empty', () => {
      expect(pickFieldOptions()).toEqual({});
      expect(pickFieldOptions({})).toEqual({});
    });

    it('keeps fieldComponents, fetchPriority, and lazyImages only', () => {
      const fieldComponents = { custom: {} };
      expect(
        pickFieldOptions({
          fieldComponents,
          fetchPriority: 'high',
          lazyImages: true,
          defaultClasses: { title: 'x' },
          featuredListings: {},
        })
      ).toEqual({ fieldComponents, fetchPriority: 'high', lazyImages: true });
    });

    it('omits fetchPriority and lazyImages when falsy', () => {
      expect(pickFieldOptions({ fetchPriority: null, lazyImages: false })).toEqual({});
    });
  });
});
