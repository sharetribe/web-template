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

  // ── Layout / width ──
  it('sets isLarge for "- Large" token', () => {
    expect(parseSectionCustomOptions('Hero - Large').isLarge).toBe(true);
  });

  it('sets isFullW for "- FullW" token', () => {
    expect(parseSectionCustomOptions('Hero - FullW').isFullW).toBe(true);
  });

  it('sets isFullWHeader for "- FullWHeader" token', () => {
    expect(parseSectionCustomOptions('Section - FullWHeader').isFullWHeader).toBe(true);
    expect(parseSectionCustomOptions('Section - Large').isFullWHeader).toBe(false);
  });

  it('sets isShortHero for "- ShortHero" token', () => {
    expect(parseSectionCustomOptions('Hero - ShortHero').isShortHero).toBe(true);
  });

  it('sets isTwoThirdsCols for "- 2/3 cols" token', () => {
    expect(parseSectionCustomOptions('Section - 2/3 cols').isTwoThirdsCols).toBe(true);
  });

  it('sets isAvFeature for "- AvFeature" token', () => {
    expect(parseSectionCustomOptions('Section - AvFeature').isAvFeature).toBe(true);
  });

  it('sets isReverseFeature for "- ReverseFeature" token', () => {
    expect(parseSectionCustomOptions('Section - ReverseFeature').isReverseFeature).toBe(true);
  });

  // ── Title / text ──
  it('sets isBlueTitle for "- BlueTitle" token', () => {
    expect(parseSectionCustomOptions('My Section - BlueTitle').isBlueTitle).toBe(true);
  });

  it('sets isWhiteTitle for "- WhiteTitle" token', () => {
    expect(parseSectionCustomOptions('Section - WhiteTitle').isWhiteTitle).toBe(true);
  });

  it('sets isCenterTitleText for "- CenterTitleText" token', () => {
    expect(parseSectionCustomOptions('Section - CenterTitleText').isCenterTitleText).toBe(true);
  });

  it('sets isCenterDescText for "- CenterDescText" token', () => {
    expect(parseSectionCustomOptions('Section - CenterDescText').isCenterDescText).toBe(true);
  });

  it('sets isSmallerTitles for "- SmallerTitles" token', () => {
    expect(parseSectionCustomOptions('Section - SmallerTitles').isSmallerTitles).toBe(true);
  });

  it('does not set isLarge when only "- LargeDesc" is present', () => {
    const result = parseSectionCustomOptions('Section - LargeDesc');
    expect(result.isLarge).toBe(false);
    expect(result.isLargeDesc).toBe(true);
  });

  // ── Spacing ──
  it('sets hasNoPaddings for "- NoPaddings" but not for "- NoPaddingsX/Y"', () => {
    expect(parseSectionCustomOptions('Section - NoPaddings').hasNoPaddings).toBe(true);
    expect(parseSectionCustomOptions('Section - NoPaddingsX').hasNoPaddings).toBe(false);
    expect(parseSectionCustomOptions('Section - NoPaddingsY').hasNoPaddings).toBe(false);
  });

  it('sets hasSmallGapCols / hasSmallGapRows independently for their tokens', () => {
    const cols = parseSectionCustomOptions('Section - SmallGapCols');
    expect(cols.hasSmallGapCols).toBe(true);
    expect(cols.hasSmallGapRows).toBe(false);

    const rows = parseSectionCustomOptions('Section - SmallGapRows');
    expect(rows.hasSmallGapRows).toBe(true);
    expect(rows.hasSmallGapCols).toBe(false);

    const both = parseSectionCustomOptions('Section - SmallGapCols - SmallGapRows');
    expect(both.hasSmallGapCols).toBe(true);
    expect(both.hasSmallGapRows).toBe(true);
  });

  it('sets hasNoGapCols / hasNoGapRows independently for their tokens', () => {
    const cols = parseSectionCustomOptions('Section - NoGapCols');
    expect(cols.hasNoGapCols).toBe(true);
    expect(cols.hasNoGapRows).toBe(false);
    // The narrower "- NoGapCols" must not be triggered by "- SmallGapCols".
    expect(parseSectionCustomOptions('Section - SmallGapCols').hasNoGapCols).toBe(false);

    const rows = parseSectionCustomOptions('Section - NoGapRows');
    expect(rows.hasNoGapRows).toBe(true);
    expect(rows.hasNoGapCols).toBe(false);

    const both = parseSectionCustomOptions('Section - NoGapCols - NoGapRows');
    expect(both.hasNoGapCols).toBe(true);
    expect(both.hasNoGapRows).toBe(true);
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
    expect(result.isFullW).toBe(false);
    expect(result.isFullWHeader).toBe(false);
  });

  it('ignores removed tokens (no flag emitted)', () => {
    const result = parseSectionCustomOptions(
      'Section - Medium - FullH - ShortContent - SmallerTitle - SmallTitle' +
        ' - SmallSubTitles - TextGray - Paddings - NoPaddingsX - NoPaddingsY - Heading2'
    );
    expect(result.isMedium).toBeUndefined();
    expect(result.isFullH).toBeUndefined();
    expect(result.isShortC).toBeUndefined();
    expect(result.isSmallerT).toBeUndefined();
    expect(result.isMediumT).toBeUndefined();
    expect(result.isSmallSubTitles).toBeUndefined();
    expect(result.hasTextGray).toBeUndefined();
    expect(result.hasPaddings).toBeUndefined();
    expect(result.hasNoPaddingsX).toBeUndefined();
    expect(result.hasNoPaddingsY).toBeUndefined();
    expect(result.isHeadingH).toBeUndefined();
    // The kept "- NoPaddings" base must NOT trigger on the removed X/Y variants.
    expect(result.hasNoPaddings).toBe(false);
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

  it('returns ctaButtonBlue class for "- SectionCtaBtnBlue" token', () => {
    const result = parseSectionCtaClass('Section - SectionCtaBtnBlue', css);
    expect(result).toContain('ctaButtonBlue');
  });

  it('returns ctaButtonPink class for "- SectionCtaBtnPink" token', () => {
    const result = parseSectionCtaClass('Section - SectionCtaBtnPink', css);
    expect(result).toContain('ctaButtonPink');
  });

  it('includes modifier classes alongside base class', () => {
    const result = parseSectionCtaClass('Section - SectionCtaBtnBlue - RoundedFull', css);
    expect(result).toContain('ctaButtonBlue');
    expect(result).toContain('roundedFull');
  });

  it('prepends ctaButton when only modifier tokens are present', () => {
    const result = parseSectionCtaClass('Section - RoundedFull', css);
    expect(result).toContain('ctaButton');
    expect(result).toContain('roundedFull');
  });

  it('only picks the first base color token', () => {
    const result = parseSectionCtaClass('Section - SectionCtaBtnBlue - SectionCtaBtnPink', css);
    expect(result).toContain('ctaButtonBlue');
    expect(result).not.toContain('ctaButtonPink');
  });
});
