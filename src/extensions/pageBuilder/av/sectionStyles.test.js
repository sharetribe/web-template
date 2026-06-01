'use strict';

import { parseSectionCustomOptions, parseSectionCtaClass } from './sectionStyles';

// Minimal css mock: each key maps to its own name so classNames output is readable
const css = new Proxy({}, { get: (_, prop) => prop });

describe('parseSectionCustomOptions', () => {
  it('returns empty object for null/undefined sectionName', () => {
    expect(parseSectionCustomOptions(null)).toEqual({});
    expect(parseSectionCustomOptions(undefined)).toEqual({});
    expect(parseSectionCustomOptions('')).toEqual({});
  });

  it('sets isBlueTitle for "- BlueTitle" token', () => {
    expect(parseSectionCustomOptions('My Section - BlueTitle').isBlueTitle).toBe(true);
  });

  it('sets isLarge for "- Large" token', () => {
    expect(parseSectionCustomOptions('Hero - Large').isLarge).toBe(true);
  });

  it('sets isMedium for "- Medium" token', () => {
    expect(parseSectionCustomOptions('Hero - Medium').isMedium).toBe(true);
  });

  it('sets isFullH for "- FullH" token', () => {
    expect(parseSectionCustomOptions('Hero - FullH').isFullH).toBe(true);
  });

  it('sets isFullW for "- FullW" token', () => {
    expect(parseSectionCustomOptions('Hero - FullW').isFullW).toBe(true);
  });

  it('sets isShortC for "- ShortContent" token', () => {
    expect(parseSectionCustomOptions('Section - ShortContent').isShortC).toBe(true);
  });

  it('sets isSmallerT for "- SmallerTitle" token', () => {
    expect(parseSectionCustomOptions('Section - SmallerTitle').isSmallerT).toBe(true);
  });

  it('sets isMediumT for "- SmallTitle" token', () => {
    expect(parseSectionCustomOptions('Section - SmallTitle').isMediumT).toBe(true);
  });

  it('sets hasPaddings for "- Paddings" token', () => {
    expect(parseSectionCustomOptions('Section - Paddings').hasPaddings).toBe(true);
  });

  it('sets hasNoPaddings for "- NoPaddings" but not for "- NoPaddingsX"', () => {
    expect(parseSectionCustomOptions('Section - NoPaddings').hasNoPaddings).toBe(true);
    expect(parseSectionCustomOptions('Section - NoPaddingsX').hasNoPaddings).toBe(false);
    expect(parseSectionCustomOptions('Section - NoPaddingsY').hasNoPaddings).toBe(false);
  });

  it('sets hasNoPaddingsX for "- NoPaddingsX" token', () => {
    expect(parseSectionCustomOptions('Section - NoPaddingsX').hasNoPaddingsX).toBe(true);
  });

  it('sets hasNoPaddingsY for "- NoPaddingsY" token', () => {
    expect(parseSectionCustomOptions('Section - NoPaddingsY').hasNoPaddingsY).toBe(true);
  });

  it('sets isShortHero for "- ShortHero" token', () => {
    expect(parseSectionCustomOptions('Hero - ShortHero').isShortHero).toBe(true);
  });

  it('sets isCenterTitleText for "- CenterTitleText" token', () => {
    expect(parseSectionCustomOptions('Section - CenterTitleText').isCenterTitleText).toBe(true);
  });

  it('sets isWhiteTitle for "- WhiteTitle" token', () => {
    expect(parseSectionCustomOptions('Section - WhiteTitle').isWhiteTitle).toBe(true);
  });

  it('sets isAvFeature for "- AvFeature" token', () => {
    expect(parseSectionCustomOptions('Section - AvFeature').isAvFeature).toBe(true);
  });

  it('sets isReverseFeature for "- ReverseFeature" token', () => {
    expect(parseSectionCustomOptions('Section - ReverseFeature').isReverseFeature).toBe(true);
  });

  it('sets hasTextGray for "- TextGray" token', () => {
    expect(parseSectionCustomOptions('Section - TextGray').hasTextGray).toBe(true);
  });

  it('sets isHeadingH for "- Heading2" token', () => {
    expect(parseSectionCustomOptions('Section - Heading2').isHeadingH).toBe(true);
  });

  it('does not set isLarge when only "- LargeDesc" is present', () => {
    const result = parseSectionCustomOptions('Section - LargeDesc');
    expect(result.isLarge).toBe(false);
    expect(result.isLargeDesc).toBe(true);
  });

  it('handles multiple tokens in one sectionName', () => {
    const result = parseSectionCustomOptions('Hero - Large - CenterTitleText - WhiteTitle');
    expect(result.isLarge).toBe(true);
    expect(result.isCenterTitleText).toBe(true);
    expect(result.isWhiteTitle).toBe(true);
    expect(result.isBlueTitle).toBe(false);
  });

  it('does not set flags for absent tokens', () => {
    const result = parseSectionCustomOptions('Plain Section');
    expect(result.isLarge).toBe(false);
    expect(result.isFullH).toBe(false);
  });
});

describe('parseSectionCtaClass', () => {
  it('returns null for null/undefined sectionName', () => {
    expect(parseSectionCtaClass(null, css)).toBeNull();
    expect(parseSectionCtaClass(undefined, css)).toBeNull();
  });

  it('returns null when no CTA token present', () => {
    expect(parseSectionCtaClass('Section - Large', css)).toBeNull();
  });

  it('returns ctaButtonBlue class for "- sectionCtaBtnBlue" token', () => {
    const result = parseSectionCtaClass('Section - sectionCtaBtnBlue', css);
    expect(result).toContain('ctaButtonBlue');
  });

  it('returns ctaButtonPink class for "- sectionCtaBtnPink" token', () => {
    const result = parseSectionCtaClass('Section - sectionCtaBtnPink', css);
    expect(result).toContain('ctaButtonPink');
  });

  it('includes modifier classes alongside base class', () => {
    const result = parseSectionCtaClass('Section - sectionCtaBtnBlue - roundedFull', css);
    expect(result).toContain('ctaButtonBlue');
    expect(result).toContain('roundedFull');
  });

  it('prepends ctaButton when only modifier tokens are present', () => {
    const result = parseSectionCtaClass('Section - roundedFull', css);
    expect(result).toContain('ctaButton');
    expect(result).toContain('roundedFull');
  });

  it('only picks the first base color token', () => {
    const result = parseSectionCtaClass('Section - sectionCtaBtnBlue - sectionCtaBtnPink', css);
    expect(result).toContain('ctaButtonBlue');
    expect(result).not.toContain('ctaButtonPink');
  });
});
