import {
  getRecommendedListingIds,
  getSelectionsSections,
  getTagListingsSections,
  hasCustomSections,
  isSelectionsSectionId,
  isTagListingsSectionId,
  isSelectedCatsSectionId,
} from './sections';

describe('landingPage AV sections helpers', () => {
  it('detects selection section ids by prefix', () => {
    expect(isSelectionsSectionId('av-selections')).toBe(true);
    expect(isSelectionsSectionId('av-selections-1')).toBe(true);
    expect(isSelectionsSectionId('hero')).toBe(false);
  });

  it('detects tag listings section ids by prefix', () => {
    expect(isTagListingsSectionId('av-tag-listings')).toBe(true);
    expect(isTagListingsSectionId('av-tag-listings-hot')).toBe(true);
    expect(isTagListingsSectionId('av-selections')).toBe(false);
    expect(isTagListingsSectionId('hero')).toBe(false);
  });

  it('detects selected cats section ids by prefix', () => {
    expect(isSelectedCatsSectionId('av-selected-cats')).toBe(true);
    expect(isSelectedCatsSectionId('av-selected-cats-main')).toBe(true);
    expect(isSelectedCatsSectionId('av-selections')).toBe(false);
    expect(isSelectedCatsSectionId('hero')).toBe(false);
  });

  it('extracts recommended and selection listing ids', () => {
    const pageData = {
      sections: [
        {
          sectionId: 'av-recommendeds',
          blocks: [{ blockName: 'id-r1' }, { blockName: 'id-r2' }],
        },
        {
          sectionId: 'av-selections-1',
          blocks: [{ blockName: 'id-s1' }],
        },
      ],
    };

    expect(getRecommendedListingIds(pageData)).toEqual(['id-r1', 'id-r2']);
    expect(getSelectionsSections(pageData)).toEqual({
      'av-selections-1': ['id-s1'],
    });
  });

  it('extracts tag listings sections with first blockName as filter value', () => {
    const pageData = {
      sections: [
        {
          sectionId: 'av-tag-listings-hot',
          blocks: [{ blockName: 'tag:hot-list' }, { blockName: 'ignored' }],
        },
        {
          sectionId: 'av-tag-listings-cat',
          blocks: [{ blockName: 'cat:blazers' }],
        },
        {
          sectionId: 'av-tag-listings-plain',
          blocks: [{ blockName: 'summer' }],
        },
        // section with no blocks should be skipped
        {
          sectionId: 'av-tag-listings-empty',
          blocks: [],
        },
      ],
    };

    expect(getTagListingsSections(pageData)).toEqual({
      'av-tag-listings-hot': 'tag:hot-list',
      'av-tag-listings-cat': 'cat:blazers',
      'av-tag-listings-plain': 'summer',
    });
  });

  it('getTagListingsSections returns empty object when no tag sections', () => {
    const pageData = {
      sections: [
        { sectionId: 'av-recommendeds' },
        { sectionId: 'av-selections-1', blocks: [{ blockName: 'id' }] },
      ],
    };
    expect(getTagListingsSections(pageData)).toEqual({});
  });

  it('returns whether custom AV sections exist', () => {
    expect(hasCustomSections({ sections: [{ sectionId: 'other' }] })).toBe(false);
    expect(hasCustomSections({ sections: [{ sectionId: 'av-tag-listings-x' }] })).toBe(true);
    expect(hasCustomSections({ sections: [{ sectionId: 'av-selected-cats' }] })).toBe(true);
  });
});
