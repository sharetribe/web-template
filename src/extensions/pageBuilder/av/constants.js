// AV CMS PageBuilder section identifiers and the section types they map to.
// Kept in sync with src/containers/CMSPage/CMSPage.duck.js where the asset IDs
// (avHeroSecionId, avPriceSelectorSecionId) are defined.

export { avHeroSecionId, avPriceSelectorSecionId } from '../../../containers/CMSPage/CMSPage.duck';

// Intentionally 'hero' (not 'avHero') — overrides the upstream SectionHero on CMSPage.
// LandingPage uses 'avHero' as a distinct type; CMSPage replaces the built-in hero entirely.
export const AV_HERO_SECTION_TYPE = 'hero';
export const AV_HERO2_SECTION_TYPE = 'avHero2';
export const AV_HERO3_SECTION_TYPE = 'avHero3';
export const AV_VIDEO_SECTION_TYPE = 'avVideo';
export const AV_PRICE_SELECTOR_SECTION_TYPE = 'price-columns';

export const AV_HERO2_PREFIX = 'av-hero2-';
export const AV_HERO3_PREFIX = 'av-hero3-';
export const AV_VIDEO_PREFIX = 'av-video-';

// Feature delimiter used in hosted translation strings (intl-fallback pricing).
export const FEATURE_DELIMITER = '#!#';
