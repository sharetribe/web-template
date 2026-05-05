// AV BlockBuilder helpers: block components map, blockName parsers, and the
// large `createBlockCustomProps` switch that walks block.blockName tokens and
// pulls intl-keyed copy into block props.
//
// `css` is the SectionBuilder.module.css object passed in by the caller (CSS
// Modules resolve at import time in the consumer file).

import classNames from 'classnames';

// ---- Block components ----

let cachedBlockComponents;

export const getAvBlockComponents = () => {
  if (cachedBlockComponents) return cachedBlockComponents;

  const BlockWithCols = require('../../../containers/PageBuilder/BlockBuilder/BlockWithCols').default;
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
export const getEffectiveBlockType = (blockId, fallbackType) => {
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
    blockCustomProps.contactButtons = {
      ctaButtonPrimaryClass: DEFAULT_CLASSES.ctaButtonPrimary,
      ctaButtonSecondaryClass: DEFAULT_CLASSES.ctaButtonSecondary,
      callToAction1: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta1Link', defaultMessage: 'Hello' }),
        content: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta1Text', defaultMessage: 'Hello' }),
      },
      callToAction2: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta2Link', defaultMessage: 'Hello' }),
        content: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta2Text', defaultMessage: 'Hello' }),
      },
      social: {
        fieldType: 'socialMediaLink',
        href: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.socialLink', defaultMessage: 'Hello' }),
        content: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.socialText', defaultMessage: 'Hello' }),
      },
    };
  }

  if (block.blockName?.includes('2 cols ::')) {
    blockCustomProps.blueCols = {
      col1Title: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col1Title', defaultMessage: ' ' }),
      col1Text: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col1Text', defaultMessage: ' ' }),
      col2Title: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col2Title', defaultMessage: ' ' }),
      col2Text: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col2Text', defaultMessage: ' ' }),
      col3Title: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col3Title', defaultMessage: ' ' }),
      col3Text: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col3Text', defaultMessage: ' ' }),
    };
  }

  if (block.blockName?.includes('2 buttons ::')) {
    const cta1ClassName = parseCtaStyleString(
      intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta1Style', defaultMessage: '' }),
      css
    );
    const cta2ClassName = parseCtaStyleString(
      intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta2Style', defaultMessage: '' }),
      css
    );
    blockCustomProps.twoButtons = {
      titleEyebrow: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.titleEyebrow', defaultMessage: '' }),
      callToAction1: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta1Link', defaultMessage: 'Hello' }),
        content: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta1Text', defaultMessage: 'Hello' }),
      },
      callToAction2: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta2Link', defaultMessage: 'Hello' }),
        content: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta2Text', defaultMessage: 'Hello' }),
      },
      ...(cta1ClassName ? { cta1ClassName } : {}),
      ...(cta2ClassName ? { cta2ClassName } : {}),
    };
  }

  if (block.blockName?.includes('full height media ::')) blockCustomProps.hasFullHeightMedia = true;

  if (block.blockName?.includes('buyer list ::')) {
    blockCustomProps.showBuyerList = true;
    blockCustomProps.buyerListButton = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonLink', defaultMessage: ' ' }),
      content: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonText', defaultMessage: ' ' }),
    };
    blockCustomProps.buyerListData = [];
    for (let r = 1; r <= 5; r++) {
      blockCustomProps.buyerListData.push({
        title: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.title' + r, defaultMessage: ' ' }),
        text: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.text' + r, defaultMessage: ' ' }),
      });
    }
  }
  if (block.blockName?.includes('seller list ::')) {
    blockCustomProps.showSellerList = true;
    blockCustomProps.sellerListButton = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonLink', defaultMessage: ' ' }),
      content: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonText', defaultMessage: ' ' }),
    };
    blockCustomProps.sellerListData = [];
    for (let r = 1; r <= 5; r++) {
      blockCustomProps.sellerListData.push({
        title: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.title' + r, defaultMessage: ' ' }),
        text: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.text' + r, defaultMessage: ' ' }),
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
    blockCustomProps.disclaimerText =
      'Al ingresar tu correo, aceptas recibir correos promocionales de Archivo Vintach y nuestra Política de Privacidad. Puedes darte de baja en cualquier momento.';
    blockCustomProps.okMsg = '¡Gracias! Por favor, revisa tu bandeja de entrada.';
    blockCustomProps.errorMsg = 'La suscripción ha fallado. Inténtalo de nuevo más tarde.';
  }
  if (block.blockName?.includes('icon img ::')) blockCustomProps.hasIconImg = true;
  if (block.blockName?.includes('social links ::')) blockCustomProps.hasSocialLinks = true;
  if (block.blockName?.includes('content short ::')) blockCustomProps.hasShortContent = true;

  if (block.blockName?.includes('2 cols buttons ::')) {
    block.blockType = 'blockWithCols';
    blockCustomProps.ctaButtonPrimaryClass = DEFAULT_CLASSES.ctaButtonPrimary;
    blockCustomProps.ctaButtonSecondaryClass = DEFAULT_CLASSES.ctaButtonSecondary;

    blockCustomProps.titleEyebrow = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.titleEyebrow', defaultMessage: '' });
    blockCustomProps.col1Title = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col1Title', defaultMessage: 'Hello' });
    blockCustomProps.col2Title = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col2Title', defaultMessage: 'Hello' });
    blockCustomProps.col1Text = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col1Text', defaultMessage: 'Hello' });
    blockCustomProps.col2Text = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col2Text', defaultMessage: 'Hello' });
    blockCustomProps.callToAction1 = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta1Link', defaultMessage: 'Hello' }),
      content: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta1Text', defaultMessage: 'Hello' }),
    };
    blockCustomProps.callToAction2 = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta2Link', defaultMessage: 'Hello' }),
      content: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta2Text', defaultMessage: 'Hello' }),
    };
  }

  if (block.blockName?.includes('photo slider ::')) {
    blockCustomProps.sliderImages = [
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_1', defaultMessage: '' }),
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_2', defaultMessage: '' }),
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_3', defaultMessage: '' }),
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_4', defaultMessage: '' }),
    ];
  }

  return blockCustomProps;
};
