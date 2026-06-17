'use strict';

import {
  getEffectiveBlockType,
  createBlockCustomProps,
  parseBlockCtaClass,
  mergeBlockCtaClass,
} from './blocks';

// Minimal css mock: each key maps to its own name so classNames output is readable.
const cssMock = new Proxy({}, { get: (_, prop) => prop });

describe('getEffectiveBlockType', () => {
  it('returns blockInstagramFeed for blockId "av-insta-feed"', () => {
    expect(getEffectiveBlockType('av-insta-feed', null, 'defaultBlock')).toBe('blockInstagramFeed');
  });

  it('returns blockMarkdownTable for blockId starting with "av-table-"', () => {
    expect(getEffectiveBlockType('av-table-pricing', null, 'defaultBlock')).toBe(
      'blockMarkdownTable'
    );
  });

  it('returns blockBrevoForm for blockId "av-contact-form"', () => {
    expect(getEffectiveBlockType('av-contact-form', null, 'defaultBlock')).toBe('blockBrevoForm');
  });

  it('returns blockWithCols for blockName containing "2 cols buttons ::"', () => {
    expect(getEffectiveBlockType('block-1', '2 cols buttons :: A :: B', 'defaultBlock')).toBe(
      'blockWithCols'
    );
  });

  it('returns fallbackType when no special blockId or blockName matches', () => {
    expect(getEffectiveBlockType('regular-block', 'Normal block', 'blockDefault')).toBe(
      'blockDefault'
    );
  });

  it('blockId shortcuts take priority over blockName shortcuts', () => {
    expect(getEffectiveBlockType('av-insta-feed', '2 cols buttons :: A', 'defaultBlock')).toBe(
      'blockInstagramFeed'
    );
  });

  it('handles null blockId and blockName gracefully', () => {
    expect(getEffectiveBlockType(null, null, 'blockDefault')).toBe('blockDefault');
  });

  it('handles undefined blockId and blockName gracefully', () => {
    expect(getEffectiveBlockType(undefined, undefined, 'blockDefault')).toBe('blockDefault');
  });
});

describe('createBlockCustomProps', () => {
  const intl = { formatMessage: () => '' };
  const css = {};

  it('sets hasSmallerTitles for blockName containing "smallerTitles ::"', () => {
    const props = createBlockCustomProps(
      { blockId: 'b1', blockName: 'smallerTitles ::' },
      intl,
      css
    );
    expect(props.hasSmallerTitles).toBe(true);
  });

  it('does not set hasSmallerTitles when the token is absent', () => {
    const props = createBlockCustomProps({ blockId: 'b1', blockName: 'smaller ::' }, intl, css);
    expect(props.hasSmallerTitles).toBeUndefined();
    expect(props.hasTextSmaller).toBe(true);
  });
});

describe('parseBlockCtaClass', () => {
  it('returns null for empty/absent blockName or no CTA tokens', () => {
    expect(parseBlockCtaClass(null, cssMock)).toBeNull();
    expect(parseBlockCtaClass('', cssMock)).toBeNull();
    expect(parseBlockCtaClass('just a name', cssMock)).toBeNull();
  });

  it('parses a base color token with no modifiers', () => {
    expect(parseBlockCtaClass('blockCtaBtnBlue ::', cssMock)).toEqual({
      baseClass: 'ctaButtonBlue',
      modifierClasses: [],
    });
  });

  it('parses a modifier-only token with no base color (does NOT inject a default base)', () => {
    expect(parseBlockCtaClass('ctaBtnCenter ::', cssMock)).toEqual({
      baseClass: null,
      modifierClasses: ['ctaBtnCenter'],
    });
  });

  it('parses base color + multiple modifiers', () => {
    expect(parseBlockCtaClass('blockCtaBtnPink :: rounded :: dashed ::', cssMock)).toEqual({
      baseClass: 'ctaButtonPink',
      modifierClasses: ['rounded', 'dashed'],
    });
  });
});

describe('mergeBlockCtaClass', () => {
  it('returns the inherited class when there is no override', () => {
    expect(mergeBlockCtaClass(null, 'ctaButtonBlue', cssMock)).toBe('ctaButtonBlue');
    expect(mergeBlockCtaClass(null, undefined, cssMock)).toBeNull();
  });

  it('keeps the inherited base color and layers a modifier-only override on top', () => {
    // The reported bug: "- SectionCtaBtnBlue" + block "ctaBtnCenter ::" must stay blue.
    const override = parseBlockCtaClass('ctaBtnCenter ::', cssMock);
    expect(mergeBlockCtaClass(override, 'ctaButtonBlue', cssMock)).toBe(
      'ctaButtonBlue ctaBtnCenter'
    );
  });

  it('lets a block color token replace the inherited base, still layering modifiers', () => {
    const override = parseBlockCtaClass('blockCtaBtnPink :: rounded ::', cssMock);
    expect(mergeBlockCtaClass(override, 'ctaButtonBlue', cssMock)).toBe('ctaButtonPink rounded');
  });

  it('falls back to the neutral ctaButton when nothing is inherited', () => {
    const override = parseBlockCtaClass('ctaBtnCenter ::', cssMock);
    expect(mergeBlockCtaClass(override, undefined, cssMock)).toBe('ctaButton ctaBtnCenter');
  });
});
