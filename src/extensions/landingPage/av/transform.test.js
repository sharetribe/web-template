import { transformCustomSections } from './transform';

describe('landingPage AV transform', () => {
  it('returns original data when extension is inactive', () => {
    const pageData = { sections: [{ sectionId: 'plain' }] };

    expect(transformCustomSections({ pageData, extensionData: { hasCustomSections: false } })).toBe(
      pageData
    );
    expect(
      transformCustomSections({ pageData: null, extensionData: { hasCustomSections: true } })
    ).toBeNull();
  });

  it('maps custom section types and injects listing data', () => {
    const pageData = {
      sections: [
        { sectionId: 'av-recommendeds' },
        { sectionId: 'av-selections-1' },
        { sectionId: 'plain' },
      ],
    };
    const extensionData = {
      hasCustomSections: true,
      listings: [{ id: 'rec-1' }],
      selectionsListings: { 'av-selections-1': [{ id: 'sel-1' }] },
      tagListingsSections: {},
    };

    const transformed = transformCustomSections({ pageData, extensionData });
    const [recommendeds, selections, plain] = transformed.sections;

    expect(recommendeds.sectionType).toBe('avRecommendeds');
    expect(recommendeds.listings).toEqual([{ id: 'rec-1' }]);

    expect(selections.sectionType).toBe('avSelections');
    expect(selections.listings).toEqual([{ id: 'sel-1' }]);

    expect(plain.sectionId).toBe('plain');
    expect(plain.sectionType).toBeUndefined();
  });

  it('maps avTagListings sections and injects filtered listings', () => {
    const pageData = {
      sections: [
        {
          sectionId: 'av-tag-listings-hot',
          blocks: [{ blockName: 'tag:hot-list' }],
        },
      ],
    };
    const extensionData = {
      hasCustomSections: true,
      listings: [],
      selectionsListings: {},
      tagListingsSections: {
        'av-tag-listings-hot': [{ id: 'listing-1' }, { id: 'listing-2' }],
      },
    };

    const transformed = transformCustomSections({ pageData, extensionData });
    const [tagSection] = transformed.sections;

    expect(tagSection.sectionType).toBe('avTagListings');
    expect(tagSection.listings).toEqual([{ id: 'listing-1' }, { id: 'listing-2' }]);
    // original blocks are preserved
    expect(tagSection.blocks).toEqual([{ blockName: 'tag:hot-list' }]);
  });

  it('falls back to empty listings array for unknown tag section id', () => {
    const pageData = {
      sections: [{ sectionId: 'av-tag-listings-x', blocks: [{ blockName: 'tag:summer' }] }],
    };
    const extensionData = {
      hasCustomSections: true,
      listings: [],
      selectionsListings: {},
      tagListingsSections: {},
    };

    const transformed = transformCustomSections({ pageData, extensionData });
    expect(transformed.sections[0].listings).toEqual([]);
  });

  it('maps avSelectedCats sections and preserves CMS blocks', () => {
    const mockBlocks = [
      { blockId: 'b1', blockName: 'blazers', media: { fieldType: 'image' } },
      {
        blockId: 'b2',
        blockName: 'dresses',
        title: { content: 'Dresses' },
        media: { fieldType: 'image' },
      },
    ];
    const pageData = {
      sections: [{ sectionId: 'av-selected-cats', blocks: mockBlocks }],
    };
    const extensionData = {
      hasCustomSections: true,
      listings: [],
      selectionsListings: {},
      tagListingsSections: {},
    };

    const transformed = transformCustomSections({ pageData, extensionData });
    const [catSection] = transformed.sections;

    expect(catSection.sectionType).toBe('avSelectedCats');
    // blocks are passed through unchanged for SectionSelectedCat to consume
    expect(catSection.blocks).toBe(mockBlocks);
    // no listings prop injected
    expect(catSection.listings).toBeUndefined();
  });

  it('resolves AVHero2 bgLink from messages; unset or "#" yields no link', () => {
    const makeIntl = messages => ({
      messages,
      formatMessage: ({ id, defaultMessage }) =>
        messages[id] != null ? messages[id] : defaultMessage,
    });
    const run = messages =>
      transformCustomSections({
        pageData: { sections: [{ sectionId: 'av-hero2-shop' }] },
        intl: makeIntl(messages),
        extensionData: {
          hasCustomSections: true,
          listings: [],
          selectionsListings: {},
          tagListingsSections: {},
        },
      }).sections[0];

    // Unset key → null (regression: previously react-intl returned the id, making
    // the whole hero a bogus "AVHero2.shop.bgLink" link).
    expect(run({}).bgLink).toBeNull();
    // Sentinel "#" → null
    expect(run({ 'AVHero2.shop.bgLink': '#' }).bgLink).toBeNull();
    // Real path → kept
    expect(run({ 'AVHero2.shop.bgLink': '/s' }).bgLink).toBe('/s');
  });
});
