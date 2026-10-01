import { getPrioritySectionId } from './SectionBuilder.helpers';

describe('getPrioritySectionId()', () => {
  it('returns null for empty sections', () => {
    expect(getPrioritySectionId([])).toEqual(null);
    expect(getPrioritySectionId(null)).toEqual(null);
  });

  it('returns the first section id', () => {
    const sections = [
      { sectionId: 'hero-1', sectionType: 'hero' },
      { sectionId: 'article-1', sectionType: 'article' },
    ];
    expect(getPrioritySectionId(sections)).toEqual('hero-1');
  });
});
