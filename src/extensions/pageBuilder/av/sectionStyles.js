// AV style helpers for SectionBuilder. Encapsulates the CSS class shortcuts
// added to DEFAULT_CLASSES and the sectionName token parsers, so SectionBuilder
// only needs a couple of import + call lines from this module.
//
// `css` here is the SectionBuilder.module.css object (passed in by the caller
// since CSS Modules resolve at import-time in the consumer file).

import classNames from 'classnames';

// Extra entries added to upstream DEFAULT_CLASSES to expose AV CSS hooks to
// section components.
export const getAvDefaultClassEntries = css => ({
  sectionDetailsH: css.sectionDetailsH,
  ctaButtonPrimary: css.ctaButtonPrimary,
  ctaButtonSecondary: css.ctaButtonSecondary,
  avCtaButton: css.avCtaButton,
  ctaButtonBlue: css.ctaButtonBlue,
  ctaButtonLightBlue: css.ctaButtonLightBlue,
  ctaButtonPurple: css.ctaButtonPurple,
  ctaButtonPink: css.ctaButtonPink,
  ctaButtonYellow: css.ctaButtonYellow,
  // modifiers
  roundedFull: css.roundedFull,
  rounded: css.rounded,
  square: css.square,
  dashed: css.dashed,
  solid: css.solid,
  noOutline: css.noOutline,
  headingFont: css.headingFont,
  bodyFont: css.bodyFont,
  accentFont: css.accentFont,
  ctaBtnCenter: css.ctaBtnCenter,
});

// CTA tokens recognized in `section.sectionName`. Order in BASE_MAP matters:
// the first matching base token wins.
const buildSectionCtaBaseMap = css => ({
  SectionCtaBtnBlue: css.ctaButtonBlue,
  SectionCtaBtnLightBlue: css.ctaButtonLightBlue,
  SectionCtaBtnPurple: css.ctaButtonPurple,
  SectionCtaBtnPink: css.ctaButtonPink,
  SectionCtaBtnYellow: css.ctaButtonYellow,
});

const buildCtaModifierMap = css => ({
  RoundedFull: css.roundedFull,
  Rounded: css.rounded,
  Square: css.square,
  Dashed: css.dashed,
  Solid: css.solid,
  NoOutline: css.noOutline,
  HeadingFont: css.headingFont,
  BodyFont: css.bodyFont,
  AccentFont: css.accentFont,
  CtaBtnCenter: css.ctaBtnCenter,
});

const hasToken = (str, token) => new RegExp(`- ${token}(?!\\w)`).test(str);

export const parseSectionCtaClass = (sectionName, css) => {
  if (!sectionName) return null;
  const baseMap = buildSectionCtaBaseMap(css);
  const modifierMap = buildCtaModifierMap(css);
  const classes = [];
  let hasBase = false;
  for (const [token, cls] of Object.entries(baseMap)) {
    if (hasToken(sectionName, token)) {
      classes.push(cls);
      hasBase = true;
      break;
    }
  }
  for (const [token, cls] of Object.entries(modifierMap)) {
    if (hasToken(sectionName, token)) classes.push(cls);
  }
  // When only layout modifiers are present, preserve the default button look.
  if (!hasBase && classes.length) classes.unshift(css.ctaButton);
  return classes.length ? classNames(classes.filter(Boolean)) : null;
};

// Parse all the `- Token` flags in section.sectionName into a customOption
// object that AV section components consume. Keep the keys grouped the same way
// they are documented in docs/operator-guide.md §5.1.
export const parseSectionCustomOptions = sectionName => {
  const customOption = {};
  if (!sectionName) return customOption;

  // Layout / width
  customOption.isLarge = hasToken(sectionName, 'Large');
  customOption.isFullW = hasToken(sectionName, 'FullW');
  customOption.isFullWHeader = hasToken(sectionName, 'FullWHeader');
  customOption.isShortHero = hasToken(sectionName, 'ShortHero');
  customOption.isTwoThirdsCols = hasToken(sectionName, '2/3 cols');
  customOption.isAvFeature = hasToken(sectionName, 'AvFeature');
  customOption.isReverseFeature = hasToken(sectionName, 'ReverseFeature');

  // Title / text
  customOption.isBlueTitle = hasToken(sectionName, 'BlueTitle');
  customOption.isWhiteTitle = hasToken(sectionName, 'WhiteTitle');
  customOption.isCenterTitleText = hasToken(sectionName, 'CenterTitleText');
  customOption.isCenterDescText = hasToken(sectionName, 'CenterDescText');
  customOption.isLargeDesc = hasToken(sectionName, 'LargeDesc');
  customOption.isSmallerTitles = hasToken(sectionName, 'SmallerTitles');

  // Spacing
  customOption.hasNoPaddings = hasToken(sectionName, 'NoPaddings');
  customOption.hasSmallGapCols = hasToken(sectionName, 'SmallGapCols');
  customOption.hasSmallGapRows = hasToken(sectionName, 'SmallGapRows');
  customOption.hasNoGapCols = hasToken(sectionName, 'NoGapCols');
  customOption.hasNoGapRows = hasToken(sectionName, 'NoGapRows');

  return customOption;
};
