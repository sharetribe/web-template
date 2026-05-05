// AV section transformers for the CMS PageBuilder.
// Each function takes a raw CMS section + intl (and pricing asset where needed)
// and returns the section enriched with the AV-specific shape that the matching
// AV Section component expects.
//
// Used from index.js's transformPageData hook — never import directly from
// CMSPage.js or other render-path code.

import {
  avHeroSecionId,
  avPriceSelectorSecionId,
  AV_HERO_SECTION_TYPE,
  AV_HERO2_SECTION_TYPE,
  AV_HERO3_SECTION_TYPE,
  AV_VIDEO_SECTION_TYPE,
  AV_PRICE_SELECTOR_SECTION_TYPE,
  AV_HERO2_PREFIX,
  AV_HERO3_PREFIX,
  AV_VIDEO_PREFIX,
  FEATURE_DELIMITER,
} from './constants';

// React-Intl returns the id itself when a key is missing — treat that as empty.
const fmt = (intl, id, def = '') => {
  const result = intl?.formatMessage?.({ id, defaultMessage: def })?.trim?.() ?? '';
  return result === id ? def : result;
};

// --- Hero (singleton) ---
const buildHeroSection = (intl, baseSection) => ({
  ...baseSection,
  sectionId: avHeroSecionId,
  sectionType: AV_HERO_SECTION_TYPE,
  classWrap: 'contentLeft',
  callToAction: {
    fieldType: 'internalButtonLink',
    href: fmt(intl, 'AVHero.ctaFirstLink', '/s?pub_tags=hot-list'),
    content: fmt(intl, 'AVHero.ctaFirstText', 'Explore now'),
  },
  callToAction2: {
    fieldType: 'internalButtonLink',
    href: fmt(intl, 'AVHero.ctaSecondLink', '/s'),
    content: fmt(intl, 'AVHero.ctaSecondText', 'Browse all'),
  },
});

// --- avHero2 (instance per sectionId suffix, e.g. "av-hero2-shop") ---
const buildHero2Section = (intl, section) => {
  const instanceId = section.sectionId.slice(AV_HERO2_PREFIX.length) || section.sectionId;
  const cta1Text = fmt(intl, `AVHero2.${instanceId}.cta1Text`).trim();
  const cta2Text = fmt(intl, `AVHero2.${instanceId}.cta2Text`).trim();
  return {
    ...section,
    sectionType: AV_HERO2_SECTION_TYPE,
    cta1Style: fmt(intl, `AVHero2.${instanceId}.cta1Style`, 'primary') || 'primary',
    cta2Style: fmt(intl, `AVHero2.${instanceId}.cta2Style`, 'secondary') || 'secondary',
    callToAction: cta1Text
      ? {
          fieldType: 'internalButtonLink',
          href: fmt(intl, `AVHero2.${instanceId}.cta1Link`, '/s'),
          content: cta1Text,
        }
      : section.callToAction || null,
    callToAction2: cta2Text
      ? {
          fieldType: 'internalButtonLink',
          href: fmt(intl, `AVHero2.${instanceId}.cta2Link`, '/s'),
          content: cta2Text,
        }
      : section.callToAction2 || null,
    mobileBackgroundImageUrl: fmt(intl, `AVHero2.${instanceId}.mobileBackgroundUrl`) || null,
  };
};

// --- avHero3 ---
const buildHero3Section = (intl, section) => {
  const instanceId = section.sectionId.slice(AV_HERO3_PREFIX.length) || section.sectionId;
  return {
    ...section,
    sectionType: AV_HERO3_SECTION_TYPE,
    cta1Style: fmt(intl, `AVHero3.${instanceId}.cta1Style`, 'primary') || 'primary',
    cta2Style: fmt(intl, `AVHero3.${instanceId}.cta2Style`, 'primary') || 'primary',
  };
};

// --- avVideo ---
const buildVideoSection = (intl, section) => {
  const instanceId = section.sectionId.slice(AV_VIDEO_PREFIX.length) || section.sectionId;
  return {
    ...section,
    sectionType: AV_VIDEO_SECTION_TYPE,
    videoUrl: fmt(intl, `AVVideo.${instanceId}.videoUrl`) || null,
  };
};

// --- Pricing (asset-preferred, intl-fallback) ---
const buildPricingFromAsset = (assetData, baseSection) => ({
  ...baseSection,
  sectionId: avPriceSelectorSecionId,
  sectionType: AV_PRICE_SELECTOR_SECTION_TYPE,
  classWrap: '',
  plans: assetData.plans,
  toggles: assetData.toggles,
});

const buildPlanFromIntl = (intl, setKey, planIdx) => ({
  title: fmt(intl, `PricingToggle.${setKey}.title${planIdx}`),
  description: fmt(intl, `PricingToggle.${setKey}.description${planIdx}`),
  price: fmt(intl, `PricingToggle.${setKey}.price${planIdx}`),
  priceText: fmt(intl, `PricingToggle.${setKey}.priceText${planIdx}`),
  cta: {
    link: fmt(intl, `PricingToggle.${setKey}.cta${planIdx}Link`),
    text: fmt(intl, `PricingToggle.${setKey}.cta${planIdx}Text`),
  },
  features: fmt(intl, `PricingToggle.${setKey}.features${planIdx}`).split(FEATURE_DELIMITER),
});

const buildPricingFromIntl = (intl, baseSection) => ({
  ...baseSection,
  sectionId: avPriceSelectorSecionId,
  sectionType: AV_PRICE_SELECTOR_SECTION_TYPE,
  classWrap: '',
  plans: {
    set1: [buildPlanFromIntl(intl, 'set1', 1), buildPlanFromIntl(intl, 'set1', 2)],
    set2: [buildPlanFromIntl(intl, 'set2', 1), buildPlanFromIntl(intl, 'set2', 2)],
  },
  toggles: {
    cta1: fmt(intl, 'PricingToggle.toggleSet1'),
    cta2: fmt(intl, 'PricingToggle.toggleSet2'),
  },
});

// Top-level transform: walk every section and rewrite the AV-recognized ones.
export const transformAvSections = ({ pageData, intl, extensionData }) => {
  if (!pageData?.sections) return pageData;

  const pricingAssetData = extensionData?.pricingPlansData;

  const sections = pageData.sections.map(s => {
    if (s.sectionId === avHeroSecionId) return buildHeroSection(intl, s);
    if (s.sectionId === avPriceSelectorSecionId) {
      return pricingAssetData
        ? buildPricingFromAsset(pricingAssetData, s)
        : buildPricingFromIntl(intl, s);
    }
    if (s.sectionId?.startsWith(AV_HERO2_PREFIX)) return buildHero2Section(intl, s);
    if (s.sectionId?.startsWith(AV_HERO3_PREFIX)) return buildHero3Section(intl, s);
    if (s.sectionId?.startsWith(AV_VIDEO_PREFIX)) return buildVideoSection(intl, s);
    return s;
  });

  return { ...pageData, sections };
};
