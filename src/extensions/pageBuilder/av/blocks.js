// AV BlockBuilder helpers: block components map, blockName parsers, and the
// large `createBlockCustomProps` switch that walks block.blockName tokens and
// pulls intl-keyed copy into block props.
//
// `css` is the SectionBuilder.module.css object passed in by the caller (CSS
// Modules resolve at import time in the consumer file).

import classNames from 'classnames';

// Avoids MISSING_TRANSLATION console errors for empty/absent keys.
const fmt = (intl, id, def = '') => {
  const val = intl?.messages?.[id];
  if (!val) return def;
  return intl.formatMessage({ id, defaultMessage: def }) || def;
};

// ---- Block components ----

let cachedBlockComponents;

export const getAvBlockComponents = () => {
  if (cachedBlockComponents) return cachedBlockComponents;

  const BlockPriceSelector = require('../../../containers/PageBuilder/BlockBuilder/BlockPriceSelector')
    .default;
  const BlockInstagramFeed = require('../../../containers/PageBuilder/BlockBuilder/BlockInstagramFeed/BlockInstagramFeed')
    .default;
  const BlockMarkdownTable = require('../../../containers/PageBuilder/BlockBuilder/BlockMarkdownTable/BlockMarkdownTable')
    .default;
  const BlockBrevoForm = require('../../../containers/PageBuilder/BlockBuilder/BlockBrevoForm/BlockBrevoForm')
    .default;

  cachedBlockComponents = {
    blockPriceSelector: { component: BlockPriceSelector },
    blockInstagramFeed: { component: BlockInstagramFeed },
    blockMarkdownTable: { component: BlockMarkdownTable },
    blockBrevoForm: { component: BlockBrevoForm },
  };
  return cachedBlockComponents;
};

// `blockId` shorthands let CMS authors use a fixed block id and skip the
// blockType field entirely. (blockName is unused now but kept in the signature
// so the BlockBuilder call site stays untouched.)
export const getEffectiveBlockType = (blockId, blockName, fallbackType) => {
  if (blockId === 'av-insta-feed') return 'blockInstagramFeed';
  if (blockId?.startsWith('av-table-')) return 'blockMarkdownTable';
  if (blockId === 'av-contact-form') return 'blockBrevoForm';
  return fallbackType;
};

// ---- CTA token parsers ----

const buildBlockCtaBaseMap = css => ({
  blockCtaBtnBlue: css.ctaButtonBlue,
  blockCtaBtnLightBlue: css.ctaButtonLightBlue,
  blockCtaBtnPurple: css.ctaButtonPurple,
  blockCtaBtnPink: css.ctaButtonPink,
  blockCtaBtnYellow: css.ctaButtonYellow,
});

const buildBlockCtaModifierMap = css => ({
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

// Short-name tokens used inside cta1Style / cta2Style intl strings,
// e.g. "blue roundedFull solid".
const buildCtaStyleBaseMap = css => ({
  blue: css.ctaButtonBlue,
  lightBlue: css.ctaButtonLightBlue,
  purple: css.ctaButtonPurple,
  pink: css.ctaButtonPink,
  yellow: css.ctaButtonYellow,
  primary: css.ctaButtonPrimary,
  secondary: css.ctaButtonSecondary,
});

export const parseCtaStyleString = (styleStr, css) => {
  if (!styleStr?.trim()) return null;
  const baseMap = buildCtaStyleBaseMap(css);
  const modMap = buildBlockCtaModifierMap(css);
  const tokens = styleStr.trim().split(/\s+/);
  const classes = [];
  let hasBase = false;
  for (const token of tokens) {
    if (baseMap[token]) {
      classes.push(baseMap[token]);
      hasBase = true;
    } else if (modMap[token]) {
      classes.push(modMap[token]);
    }
  }
  if (!hasBase && classes.length) classes.unshift(css.ctaButton);
  return classes.length ? classNames(classes.filter(Boolean)) : null;
};

// Tokens written as "token ::" inside block.blockName,
// e.g. "blockCtaBtnBlue :: rounded :: dashed ::".
//
// Returns the base color class (or null when the block specifies only
// modifiers) and the list of modifier classes separately, so the caller can
// LAYER block modifiers onto a section-inherited base color instead of
// clobbering it. Position/border/font modifiers only set CSS vars and never
// imply a base color, so a modifier-only block (e.g. "ctaBtnCenter ::") keeps
// whatever base the section's `- SectionCtaBtn*` token provided.
export const parseBlockCtaClass = (blockName, css) => {
  if (!blockName) return null;
  const baseMap = buildBlockCtaBaseMap(css);
  const modMap = buildBlockCtaModifierMap(css);
  const tokens = [...blockName.matchAll(/(\S+)\s*::/g)].map(m => m[1]);
  if (!tokens.length) return null;
  let baseClass = null;
  const modifierClasses = [];
  for (const token of tokens) {
    if (baseMap[token]) {
      baseClass = baseMap[token];
    } else if (modMap[token]) {
      modifierClasses.push(modMap[token]);
    }
  }
  if (!baseClass && !modifierClasses.length) return null;
  return { baseClass, modifierClasses };
};

// Merge a parsed block CTA override onto the CTA class the section already
// supplies (`inheritedClass`, e.g. the blue from a `- SectionCtaBtnBlue` token).
// The block's own color token replaces the inherited base; modifiers always
// layer on top. Falls back to the neutral `css.ctaButton` only when nothing is
// inherited so a modifier-only block still renders a real button.
export const mergeBlockCtaClass = (override, inheritedClass, css) => {
  if (!override) return inheritedClass || null;
  const base = override.baseClass || inheritedClass || css.ctaButton;
  return classNames(base, ...override.modifierClasses) || null;
};

// ---- Per-block customProps ----

const getDefaultClassesForBlock = css => ({
  ctaButtonPrimary: css.ctaButtonPrimary,
  ctaButtonSecondary: css.ctaButtonSecondary,
});

// Walks block.blockName for "token ::" flags and returns the prop map that
// BlockBuilder spreads onto the rendered Block component. Each token here is
// documented in docs/operator-guide.md §5.2.
export const createBlockCustomProps = (block, intl, css) => {
  const DEFAULT_CLASSES = getDefaultClassesForBlock(css);
  const blockCustomProps = {};

  blockCustomProps.ctaButtonPrimaryClass = DEFAULT_CLASSES.ctaButtonPrimary;
  blockCustomProps.ctaButtonSecondaryClass = DEFAULT_CLASSES.ctaButtonSecondary;

  // 2Buttons :: — a two-button row below the block content.
  if (block.blockName?.includes('2Buttons ::')) {
    const tb = 'TwoButtons.' + block.blockId;
    const cta1ClassName = parseCtaStyleString(fmt(intl, tb + '.cta1Style'), css);
    const cta2ClassName = parseCtaStyleString(fmt(intl, tb + '.cta2Style'), css);
    blockCustomProps.twoButtons = {
      titleEyebrow: fmt(intl, tb + '.titleEyebrow'),
      callToAction1: {
        fieldType: 'internalButtonLink',
        href: fmt(intl, tb + '.cta1Link', 'Hello'),
        content: fmt(intl, tb + '.cta1Text', 'Hello'),
      },
      callToAction2: {
        fieldType: 'internalButtonLink',
        href: fmt(intl, tb + '.cta2Link', 'Hello'),
        content: fmt(intl, tb + '.cta2Text', 'Hello'),
      },
      ...(cta1ClassName ? { cta1ClassName } : {}),
      ...(cta2ClassName ? { cta2ClassName } : {}),
    };
  }

  // Layout / text style flags.
  // mediaTitle :: — render media between the title and the rest of the content.
  if (block.blockName?.includes('mediaTitle ::')) blockCustomProps.hasMediaTitle = true;
  // smallerTitles :: — mirror of the section-name token "- SmallerTitles".
  if (block.blockName?.includes('smallerTitles ::')) blockCustomProps.hasSmallerTitles = true;
  // blueTitle :: — mirror of "- BlueTitle"; colors only this block's own title.
  if (block.blockName?.includes('blueTitle ::')) blockCustomProps.hasBlueTitle = true;
  // fullLinks :: — keep links in the block's body P elements whole (never break a
  // word/URL mid-character; `word-break: keep-all`). A too-long link overflows at
  // full size rather than being split.
  if (block.blockName?.includes('fullLinks ::')) blockCustomProps.hasFullLinks = true;
  // imgTop :: — anchor cropped block media to the top (object-position: top)
  // instead of the default center.
  if (block.blockName?.includes('imgTop ::')) blockCustomProps.hasImgTop = true;
  if (block.blockName?.includes('icon img ::')) blockCustomProps.hasIconImg = true;
  if (block.blockName?.includes('social links ::')) blockCustomProps.hasSocialLinks = true;
  if (block.blockName?.includes('newsletter form ::')) {
    blockCustomProps.hasNewsletterForm = true;
    blockCustomProps.disclaimerText = fmt(intl, 'NewsletterForm.disclaimerText');
    blockCustomProps.okMsg = fmt(intl, 'NewsletterForm.successMessage');
    blockCustomProps.errorMsg = fmt(intl, 'NewsletterForm.errorMessage');
  }

  // photoSlider :: — 4-image carousel sourced from intl keys.
  if (block.blockName?.includes('photoSlider ::')) {
    const ps = 'PhotoSlider.' + block.blockId;
    blockCustomProps.sliderImages = [
      fmt(intl, ps + '.image_1'),
      fmt(intl, ps + '.image_2'),
      fmt(intl, ps + '.image_3'),
      fmt(intl, ps + '.image_4'),
    ];
  }

  return blockCustomProps;
};
