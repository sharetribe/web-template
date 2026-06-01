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

  const BlockWithCols = require('../../../containers/PageBuilder/BlockBuilder/BlockWithCols')
    .default;
  const BlockPriceSelector = require('../../../containers/PageBuilder/BlockBuilder/BlockPriceSelector')
    .default;
  const BlockInstagramFeed = require('../../../containers/PageBuilder/BlockBuilder/BlockInstagramFeed/BlockInstagramFeed')
    .default;
  const BlockMarkdownTable = require('../../../containers/PageBuilder/BlockBuilder/BlockMarkdownTable/BlockMarkdownTable')
    .default;
  const BlockBrevoForm = require('../../../containers/PageBuilder/BlockBuilder/BlockBrevoForm/BlockBrevoForm')
    .default;

  cachedBlockComponents = {
    blockWithCols: { component: BlockWithCols },
    blockPriceSelector: { component: BlockPriceSelector },
    blockInstagramFeed: { component: BlockInstagramFeed },
    blockMarkdownTable: { component: BlockMarkdownTable },
    blockBrevoForm: { component: BlockBrevoForm },
  };
  return cachedBlockComponents;
};

// `blockId` shorthands let CMS authors use a fixed block id and skip the
// blockType field entirely.
export const getEffectiveBlockType = (blockId, blockName, fallbackType) => {
  if (blockId === 'av-insta-feed') return 'blockInstagramFeed';
  if (blockId?.startsWith('av-table-')) return 'blockMarkdownTable';
  if (blockId === 'av-contact-form') return 'blockBrevoForm';
  if (blockName?.includes('2 cols buttons ::')) return 'blockWithCols';
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
export const parseBlockCtaClass = (blockName, css) => {
  if (!blockName) return null;
  const baseMap = buildBlockCtaBaseMap(css);
  const modMap = buildBlockCtaModifierMap(css);
  const tokens = [...blockName.matchAll(/(\S+)\s*::/g)].map(m => m[1]);
  if (!tokens.length) return null;
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

// ---- Per-block customProps ----

const getDefaultClassesForBlock = css => ({
  ctaButtonPrimary: css.ctaButtonPrimary,
  ctaButtonSecondary: css.ctaButtonSecondary,
});

// Walks block.blockName for "feature ::" tokens and returns the full prop map
// that BlockBuilder spreads onto the rendered Block component. Behavior is
// preserved verbatim from the previous inline implementation.
export const createBlockCustomProps = (block, intl, css) => {
  const DEFAULT_CLASSES = getDefaultClassesForBlock(css);
  const blockCustomProps = {};

  blockCustomProps.ctaButtonPrimaryClass = DEFAULT_CLASSES.ctaButtonPrimary;
  blockCustomProps.ctaButtonSecondaryClass = DEFAULT_CLASSES.ctaButtonSecondary;

  if (block.blockName?.includes('contact buttons ::')) {
    const cb = 'ContactButtons.' + block.blockId;
    blockCustomProps.contactButtons = {
      ctaButtonPrimaryClass: DEFAULT_CLASSES.ctaButtonPrimary,
      ctaButtonSecondaryClass: DEFAULT_CLASSES.ctaButtonSecondary,
      callToAction1: {
        fieldType: 'internalButtonLink',
        href: fmt(intl, cb + '.cta1Link', 'Hello'),
        content: fmt(intl, cb + '.cta1Text', 'Hello'),
      },
      callToAction2: {
        fieldType: 'internalButtonLink',
        href: fmt(intl, cb + '.cta2Link', 'Hello'),
        content: fmt(intl, cb + '.cta2Text', 'Hello'),
      },
      social: {
        fieldType: 'socialMediaLink',
        href: fmt(intl, cb + '.socialLink', 'Hello'),
        content: fmt(intl, cb + '.socialText', 'Hello'),
      },
    };
  }

  if (block.blockName?.includes('2 cols ::')) {
    const bc = 'BlueCols.' + block.blockId;
    blockCustomProps.blueCols = {
      col1Title: fmt(intl, bc + '.col1Title', ' '),
      col1Text: fmt(intl, bc + '.col1Text', ' '),
      col2Title: fmt(intl, bc + '.col2Title', ' '),
      col2Text: fmt(intl, bc + '.col2Text', ' '),
      col3Title: fmt(intl, bc + '.col3Title', ' '),
      col3Text: fmt(intl, bc + '.col3Text', ' '),
    };
  }

  if (block.blockName?.includes('2 buttons ::')) {
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

  if (block.blockName?.includes('full height media ::')) blockCustomProps.hasFullHeightMedia = true;

  if (block.blockName?.includes('buyer list ::')) {
    const cl = 'CustomList.' + block.blockId;
    blockCustomProps.showBuyerList = true;
    blockCustomProps.buyerListButton = {
      fieldType: 'internalButtonLink',
      href: fmt(intl, cl + '.buttonLink', ' '),
      content: fmt(intl, cl + '.buttonText', ' '),
    };
    blockCustomProps.buyerListData = [];
    for (let r = 1; r <= 5; r++) {
      blockCustomProps.buyerListData.push({
        title: fmt(intl, cl + '.title' + r, ' '),
        text: fmt(intl, cl + '.text' + r, ' '),
      });
    }
  }
  if (block.blockName?.includes('seller list ::')) {
    const cl = 'CustomList.' + block.blockId;
    blockCustomProps.showSellerList = true;
    blockCustomProps.sellerListButton = {
      fieldType: 'internalButtonLink',
      href: fmt(intl, cl + '.buttonLink', ' '),
      content: fmt(intl, cl + '.buttonText', ' '),
    };
    blockCustomProps.sellerListData = [];
    for (let r = 1; r <= 5; r++) {
      blockCustomProps.sellerListData.push({
        title: fmt(intl, cl + '.title' + r, ' '),
        text: fmt(intl, cl + '.text' + r, ' '),
      });
    }
  }

  if (block.blockName?.includes('button secondary ::')) blockCustomProps.hasCTASecondary = true;
  if (block.blockName?.includes('button tertiary ::')) blockCustomProps.hasCTATertiary = true;
  if (block.blockName?.includes('smaller ::')) blockCustomProps.hasTextSmaller = true;
  if (block.blockName?.includes('text larger ::')) blockCustomProps.hasTextLarger = true;
  if (block.blockName?.includes('text gray ::')) blockCustomProps.hasTextGray = true;
  if (block.blockName?.includes('text darkgray ::')) blockCustomProps.hasTextDarkGray = true;
  if (block.blockName?.includes('text nogap ::')) blockCustomProps.hasTextNoGap = true;
  if (block.blockName?.includes('large list :: ')) blockCustomProps.hasLargeList = true;
  if (block.blockName?.includes('newsletter form ::')) {
    blockCustomProps.hasNewsletterForm = true;
    blockCustomProps.disclaimerText = fmt(intl, 'NewsletterForm.disclaimerText');
    blockCustomProps.okMsg = fmt(intl, 'NewsletterForm.successMessage');
    blockCustomProps.errorMsg = fmt(intl, 'NewsletterForm.errorMessage');
  }
  if (block.blockName?.includes('icon img ::')) blockCustomProps.hasIconImg = true;
  if (block.blockName?.includes('social links ::')) blockCustomProps.hasSocialLinks = true;
  if (block.blockName?.includes('content short ::')) blockCustomProps.hasShortContent = true;

  if (block.blockName?.includes('2 cols buttons ::')) {
    blockCustomProps.ctaButtonPrimaryClass = DEFAULT_CLASSES.ctaButtonPrimary;
    blockCustomProps.ctaButtonSecondaryClass = DEFAULT_CLASSES.ctaButtonSecondary;

    const bwc = 'BlockWithCols.' + block.blockId;
    blockCustomProps.titleEyebrow = fmt(intl, bwc + '.titleEyebrow');
    blockCustomProps.col1Title = fmt(intl, bwc + '.col1Title', 'Hello');
    blockCustomProps.col2Title = fmt(intl, bwc + '.col2Title', 'Hello');
    blockCustomProps.col1Text = fmt(intl, bwc + '.col1Text', 'Hello');
    blockCustomProps.col2Text = fmt(intl, bwc + '.col2Text', 'Hello');
    blockCustomProps.callToAction1 = {
      fieldType: 'internalButtonLink',
      href: fmt(intl, bwc + '.cta1Link', 'Hello'),
      content: fmt(intl, bwc + '.cta1Text', 'Hello'),
    };
    blockCustomProps.callToAction2 = {
      fieldType: 'internalButtonLink',
      href: fmt(intl, bwc + '.cta2Link', 'Hello'),
      content: fmt(intl, bwc + '.cta2Text', 'Hello'),
    };
  }

  if (block.blockName?.includes('photo slider ::')) {
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
