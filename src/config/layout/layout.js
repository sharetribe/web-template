////////////////////////////////////////////////////////////////////
// Layout config handler: hosted configs + built-in defaults
////////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const SEARCH_PAGE_VARIANTS = ['map', 'grid'];
const LISTING_PAGE_VARIANTS = ['coverPhoto', 'carousel'];
const LISTING_IMAGE_VARIANTS = ['cropImage'];

const SEARCH_PAGE_FALLBACK = { variantType: 'grid' };
const LISTING_PAGE_FALLBACK = { variantType: 'carousel' };
const LISTING_IMAGE_FALLBACK = {
  variantType: 'cropImage',
  aspectWidth: 1,
  aspectHeight: 1,
  variantPrefix: 'listing-card',
};

/**
 * @param {Object} hostedVariant
 * @param {Object} defaultVariant
 * @returns {Object}
 */
const pickVariant = (hostedVariant, defaultVariant) =>
  hostedVariant?.variantType ? hostedVariant : defaultVariant;

/**
 * @param {string} aspectRatio e.g. "4/3"
 * @returns {{ aspectWidth: number, aspectHeight: number }|null}
 */
export const parseAspectRatio = aspectRatio => {
  if (typeof aspectRatio !== 'string' || !aspectRatio.includes('/')) {
    return null;
  }
  const [w, h] = aspectRatio.split('/');
  const aspectWidth = Number.parseInt(w, 10);
  const aspectHeight = Number.parseInt(h, 10);
  if (
    !Number.isFinite(aspectWidth) ||
    !Number.isFinite(aspectHeight) ||
    aspectWidth < 1 ||
    aspectHeight < 1
  ) {
    return null;
  }
  return { aspectWidth, aspectHeight };
};

/**
 * Resolve one layout variant: hosted wins when variantType is set; else built-in.
 * Invalid types fall back to the given fallback (and caller may record an issue).
 *
 * @param {Object} params
 * @param {Object} [params.hostedVariant]
 * @param {Object} [params.defaultVariant]
 * @param {Array<string>} params.validVariantTypes
 * @param {Object} params.fallback
 * @returns {{ value: Object, unsupported: boolean }}
 */
export const resolveVariantConfig = ({
  hostedVariant,
  defaultVariant,
  validVariantTypes,
  fallback,
}) => {
  const variant = pickVariant(hostedVariant, defaultVariant);
  const isValidVariant = validVariantTypes.includes(variant?.variantType);

  if (!isValidVariant) {
    return { value: fallback, unsupported: true };
  }

  if (variant.variantType === 'cropImage') {
    const parsed = parseAspectRatio(variant.aspectRatio);
    if (!parsed) {
      return { value: fallback, unsupported: true };
    }
    return {
      value: {
        ...variant,
        ...parsed,
        variantPrefix: defaultVariant?.variantPrefix || fallback.variantPrefix,
      },
      unsupported: false,
    };
  }

  return { value: variant, unsupported: false };
};

/**
 * Merge hosted layout config with built-in layout defaults.
 * @param {Object} hostedLayoutConfig
 * @param {Object} defaultLayoutConfig
 * @returns {Object}
 */
export const mergeLayoutConfig = (hostedLayoutConfig, defaultLayoutConfig = {}) => {
  const searchPage = resolveVariantConfig({
    hostedVariant: hostedLayoutConfig?.searchPage,
    defaultVariant: defaultLayoutConfig?.searchPage,
    validVariantTypes: SEARCH_PAGE_VARIANTS,
    fallback: SEARCH_PAGE_FALLBACK,
  }).value;

  const listingPage = resolveVariantConfig({
    hostedVariant: hostedLayoutConfig?.listingPage,
    defaultVariant: defaultLayoutConfig?.listingPage,
    validVariantTypes: LISTING_PAGE_VARIANTS,
    fallback: LISTING_PAGE_FALLBACK,
  }).value;

  const listingImage = resolveVariantConfig({
    hostedVariant: hostedLayoutConfig?.listingImage,
    defaultVariant: defaultLayoutConfig?.listingImage,
    validVariantTypes: LISTING_IMAGE_VARIANTS,
    fallback: LISTING_IMAGE_FALLBACK,
  }).value;

  return { searchPage, listingPage, listingImage };
};

/**
 * Shape the hosted layout asset only (not built-in defaults).
 * Picks known variant blocks; returns {} if the slice is missing/invalid.
 *
 * @param {Object} hostedSlices values keyed by layoutConfig.assetKeys (`layout`)
 * @returns {Object} partial hosted layout input for validate
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.layout;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  return {
    ...(isPlainObject(hostedSlice.searchPage) ? { searchPage: hostedSlice.searchPage } : {}),
    ...(isPlainObject(hostedSlice.listingPage) ? { listingPage: hostedSlice.listingPage } : {}),
    ...(isPlainObject(hostedSlice.listingImage) ? { listingImage: hostedSlice.listingImage } : {}),
  };
};

/**
 * Validate the normalized hosted layout slice only — does not read or check built-ins.
 * Drops missing/unsupported variants (with warns). Omitted fields are filled later in resolve
 * (built-ins from defaultLayout.js).
 *
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }} sanitized hosted slice + configIssues
 */
const validate = normalized => {
  const issues = [];
  const value = {};

  const { searchPage, listingPage, listingImage } = normalized || {};

  const checkVariant = (key, hostedVariant, validVariantTypes, missingCode, unsupportedCode) => {
    if (!hostedVariant) {
      issues.push(
        configIssue({
          level: 'warn',
          code: missingCode,
          message: `Layout setting "${key}" is missing. Using the built-in default instead.`,
        })
      );
      return;
    }
    if (!validVariantTypes.includes(hostedVariant.variantType)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: unsupportedCode,
          message: `Layout setting "${key}" has an unsupported layout type "${hostedVariant.variantType}". Using the built-in default instead.`,
        })
      );
      return;
    }
    if (hostedVariant.variantType === 'cropImage' && !parseAspectRatio(hostedVariant.aspectRatio)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LAYOUT_INVALID_LISTING_IMAGE_ASPECT_RATIO',
          message:
            'The listing image aspect ratio is missing or invalid (use a value like "4/3"). Using the built-in default instead.',
        })
      );
      return;
    }
    value[key] = hostedVariant;
  };

  checkVariant(
    'searchPage',
    searchPage,
    SEARCH_PAGE_VARIANTS,
    'LAYOUT_MISSING_SEARCH_PAGE',
    'LAYOUT_UNSUPPORTED_SEARCH_PAGE'
  );
  checkVariant(
    'listingPage',
    listingPage,
    LISTING_PAGE_VARIANTS,
    'LAYOUT_MISSING_LISTING_PAGE',
    'LAYOUT_UNSUPPORTED_LISTING_PAGE'
  );
  checkVariant(
    'listingImage',
    listingImage,
    LISTING_IMAGE_VARIANTS,
    'LAYOUT_MISSING_LISTING_IMAGE',
    'LAYOUT_UNSUPPORTED_LISTING_IMAGE'
  );

  return { value, issues };
};

/**
 * Build final `config.layout`: prefer validated hosted variants; fill gaps from built-ins.
 * Derives listingImage aspectWidth/aspectHeight from aspectRatio.
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.layout`)
 * @returns {Object} app-config layout object
 */
const resolve = (validated, defaults) => mergeLayoutConfig(validated, defaults?.layout);

/**
 * Config handler for the `layout` app-config key.
 *
 * - id / assetKeys: `layout`
 * - searchPage: map | grid
 * - listingPage: coverPhoto | carousel
 * - listingImage: cropImage (+ aspectRatio → aspectWidth/aspectHeight)
 */
export const layoutConfig = {
  id: 'layout',
  assetKeys: ['layout'],
  normalize,
  validate,
  resolve,
};
