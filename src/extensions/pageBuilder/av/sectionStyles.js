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
});

// CTA tokens recognized in `section.sectionName`. Order in BASE_MAP matters:
// the first matching base token wins.
const buildSectionCtaBaseMap = css => ({
  sectionCtaBtnBlue: css.ctaButtonBlue,
  sectionCtaBtnLightBlue: css.ctaButtonLightBlue,
  sectionCtaBtnPurple: css.ctaButtonPurple,
  sectionCtaBtnPink: css.ctaButtonPink,
  sectionCtaBtnYellow: css.ctaButtonYellow,
});

const buildCtaModifierMap = css => ({
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
// object that AV section components consume.
export const parseSectionCustomOptions = sectionName => {
  const customOption = {};
  if (!sectionName) return customOption;

  customOption.isBlueTitle = sectionName.includes('- BlueTitle');
  customOption.isLarge = sectionName.includes('- Large');
  customOption.isMedium = sectionName.includes('- Medium');
  customOption.isFullH = sectionName.includes('- FullH');
  customOption.isFullW = sectionName.includes('- FullW');
  customOption.isShortC = sectionName.includes('- ShortContent');
  customOption.isSmallerT = sectionName.includes('- SmallerTitle');
  customOption.isMediumT = sectionName.includes('- SmallTitle');

  customOption.hasPaddings = sectionName.includes('- Paddings');
  customOption.hasNoPaddings = /- NoPaddings(?![XY])/.test(sectionName);
  customOption.hasNoPaddingsX = sectionName.includes('- NoPaddingsX');
  customOption.hasNoPaddingsY = sectionName.includes('- NoPaddingsY');

  customOption.isHeadingH = sectionName.includes('- Heading2');
  customOption.isTwoThirdsCols = sectionName.includes('- 2/3 cols');
  customOption.isShortHero = sectionName.includes('- ShortHero');
  customOption.isCenterTitleText = sectionName.includes('- CenterTitleText');
  customOption.isWhiteTitle = sectionName.includes('- WhiteTitle');
  customOption.isSmallSubTitles = sectionName.includes('- SmallSubTitles');
  customOption.isLargeDesc = sectionName.includes('- LargeDesc');
  customOption.isCenterDescText = sectionName.includes('- CenterDescText');
  customOption.isAvFeature = sectionName.includes('- AvFeature');
  customOption.isReverseFeature = sectionName.includes('- ReverseFeature');
  customOption.hasTextGray = sectionName.includes('- TextGray');

  customOption.hasStar = sectionName.includes('- Star');
  if (customOption.hasStar) {
    const starPos = sectionName.indexOf('- Star');
    customOption.starDeco = parseInt(sectionName.substring(starPos + 6, starPos + 7));
  }

  return customOption;
};
