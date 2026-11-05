/////////////////////////////////////////////////////////////////
// Branding config handler: hosted configs + built-in defaults //
/////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

const LOGO_HEIGHTS = [24, 36, 48];
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Convert a hex color to an hsl() string, optionally shifting lightness.
 * Adjusted from https://gist.github.com/xenozauros/f6e185c8de2a04cdfecf
 *
 * @param {string} hexColor
 * @param {number} lightnessDiff
 * @returns {string}
 */
export const hexToCssHsl = (hexColor, lightnessDiff) => {
  let hex = hexColor.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h;
  let s;
  let l = (max + min) / 2;

  if (max == min) {
    // achromatic
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${l + lightnessDiff}%)`;
};

/**
 * @param {string} color
 * @returns {boolean}
 */
export const isValidHexColor = color => typeof color === 'string' && HEX_COLOR_PATTERN.test(color);

/**
 * @param {Object} logoSettings
 * @returns {boolean}
 */
export const isValidLogoSettings = logoSettings =>
  logoSettings?.format === 'image' && LOGO_HEIGHTS.includes(logoSettings?.height);

const getVariantURL = (socialSharingImage, variantName) =>
  socialSharingImage?.type === 'imageAsset'
    ? socialSharingImage.attributes.variants[variantName]?.url
    : null;

/**
 * Merge hosted branding config with built-in branding defaults.
 * Hosted values take priority when present; built-ins fill gaps for color, logo,
 * and social sharing images. loginBackgroundImage maps to brandImage (no built-in
 * fallback for brandImage — same as previous mergeBranding behavior).
 *
 * @param {Object} hostedBrandingConfig data from the branding hosted asset
 * @param {Object} defaultBrandingConfig built-in defaults from defaultBranding.js
 * @returns {Object}
 */
export const mergeBrandingConfig = (hostedBrandingConfig, defaultBrandingConfig = {}) => {
  const {
    marketplaceColors,
    logo,
    logoSettings,
    loginBackgroundImage,
    socialSharingImage,
    favicon,
    appIcon,
  } = hostedBrandingConfig || {};

  const marketplaceColor = marketplaceColors?.mainColor || defaultBrandingConfig.marketplaceColor;
  const marketplaceColorDark = marketplaceColor ? hexToCssHsl(marketplaceColor, -10) : null;
  const marketplaceColorLight = marketplaceColor ? hexToCssHsl(marketplaceColor, 10) : null;

  // The 'marketplaceColor' has a special status for branding. Other colors are just prefixed with "color".
  const colorPrimaryButton = marketplaceColors?.primaryButton;
  const colorPrimaryButtonDark = colorPrimaryButton ? hexToCssHsl(colorPrimaryButton, -10) : null;
  const colorPrimaryButtonLight = colorPrimaryButton ? hexToCssHsl(colorPrimaryButton, 10) : null;

  const logoSettingsRaw = logoSettings || defaultBrandingConfig.logoSettings;
  const validLogoSettings = isValidLogoSettings(logoSettingsRaw);

  // The default facebookImageURL and twitterImageURL are using mock images!
  // TODO: We should figure out better defaults for these than "biketribe" branded ones.
  const facebookImage =
    getVariantURL(socialSharingImage, 'scaled1200') || defaultBrandingConfig.facebookImageURL;
  const twitterImage =
    getVariantURL(socialSharingImage, 'scaled600') || defaultBrandingConfig.twitterImageURL;

  return {
    marketplaceColor,
    marketplaceColorDark,
    marketplaceColorLight,
    colorPrimaryButton,
    colorPrimaryButtonDark,
    colorPrimaryButtonLight,
    logoSettings: validLogoSettings ? logoSettingsRaw : { format: 'image', height: 24 },
    logoImageDesktop: logo || defaultBrandingConfig.logoImageDesktopURL,
    logoImageMobile: logo || defaultBrandingConfig.logoImageMobileURL,
    brandImage: loginBackgroundImage,
    facebookImage,
    twitterImage,
    ...(favicon !== undefined ? { favicon } : {}),
    ...(appIcon !== undefined ? { appIcon } : {}),
  };
};

/**
 * Shape the hosted branding asset only (not built-in defaults).
 * Picks known fields (and drops email-only color keys); returns {} if the slice is missing/invalid.
 *
 * @param {Object} hostedSlices values keyed by brandingConfig.assetKeys (`branding`)
 * @returns {Object} partial hosted branding input for validate
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.branding;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const marketplaceColorsRaw = isPlainObject(hostedSlice.marketplaceColors)
    ? hostedSlice.marketplaceColors
    : undefined;
  // Web app only uses mainColor + primaryButton (CSS vars). notificationPrimaryButton
  // is for email templates via hosted asset helpers, not config.branding.
  const marketplaceColors = marketplaceColorsRaw
    ? {
        ...(marketplaceColorsRaw.mainColor !== undefined
          ? { mainColor: marketplaceColorsRaw.mainColor }
          : {}),
        ...(marketplaceColorsRaw.primaryButton !== undefined
          ? { primaryButton: marketplaceColorsRaw.primaryButton }
          : {}),
      }
    : undefined;
  const marketplaceColorsMaybe =
    marketplaceColors && Object.keys(marketplaceColors).length > 0 ? { marketplaceColors } : {};

  const {
    logo,
    logoSettings,
    loginBackgroundImage,
    socialSharingImage,
    favicon,
    appIcon,
  } = hostedSlice;

  return {
    ...marketplaceColorsMaybe,
    ...(logo !== undefined ? { logo } : {}),
    ...(isPlainObject(logoSettings) ? { logoSettings } : {}),
    ...(favicon !== undefined ? { favicon } : {}),
    ...(appIcon !== undefined ? { appIcon } : {}),
    ...(loginBackgroundImage !== undefined ? { loginBackgroundImage } : {}),
    ...(isPlainObject(socialSharingImage) ? { socialSharingImage } : {}),
  };
};

/**
 * Validate the normalized hosted branding slice only — does not read or check built-ins.
 * Drops invalid colors/images/settings (with warns). Missing logo is an error (MaintenanceMode);
 * missing favicon warns only. Resolve may fill some gaps from built-ins (color, logo URLs,
 * logoSettings, social sharing); favicon, appIcon, brandImage, and primaryButton stay unset
 * when omitted (no built-in default configuration).
 *
 * @param {Object} normalized output of normalize
 * @returns {{ value: Object, issues: Array }} sanitized hosted slice + configIssues
 */
const validate = normalized => {
  const issues = [];
  const value = { ...(normalized || {}) };

  if (!value.logo) {
    issues.push(
      configIssue({
        level: 'error',
        code: 'BRANDING_MISSING_LOGO',
        message:
          'The marketplace logo is missing from branding. Add a logo in Console (or check that the app still fetches the branding asset). The marketplace cannot start without it.',
      })
    );
  }

  if (!value.favicon) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'BRANDING_MISSING_FAVICON',
        message:
          'No favicon is set in branding. Browser tab icons will be missing until you add one in Console.',
      })
    );
  } else if (value.favicon.type !== 'imageAsset') {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'BRANDING_INVALID_FAVICON',
        message: 'The favicon in branding is not a valid image asset. It was omitted.',
      })
    );
    delete value.favicon;
  }

  if (value.marketplaceColors) {
    const marketplaceColors = { ...value.marketplaceColors };
    let colorsChanged = false;

    if (
      marketplaceColors.mainColor !== undefined &&
      !isValidHexColor(marketplaceColors.mainColor)
    ) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'BRANDING_INVALID_MAIN_COLOR',
          message:
            'The marketplace main color is missing or invalid (use a hex color like #7c3aed). Using the built-in default instead, if one is set.',
        })
      );
      delete marketplaceColors.mainColor;
      colorsChanged = true;
    }

    if (
      marketplaceColors.primaryButton !== undefined &&
      !isValidHexColor(marketplaceColors.primaryButton)
    ) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'BRANDING_INVALID_PRIMARY_BUTTON_COLOR',
          message:
            'The primary button color is invalid (use a hex color like #7c3aed). Using fallback color instead.',
        })
      );
      delete marketplaceColors.primaryButton;
      colorsChanged = true;
    }

    if (colorsChanged) {
      value.marketplaceColors =
        Object.keys(marketplaceColors).length > 0 ? marketplaceColors : undefined;
      if (!value.marketplaceColors) {
        delete value.marketplaceColors;
      }
    }
  }

  if (value.logoSettings && !isValidLogoSettings(value.logoSettings)) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'BRANDING_INVALID_LOGO_SETTINGS',
        message:
          'Logo settings are invalid. The logo must use format "image" and height 24, 36, or 48. Using the built-in default instead, if one is set.',
      })
    );
    delete value.logoSettings;
  }

  if (value.socialSharingImage && value.socialSharingImage.type !== 'imageAsset') {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'BRANDING_INVALID_SOCIAL_SHARING_IMAGE',
        message:
          'The social sharing image is not a valid image asset. Using the built-in social sharing images instead, if any are set.',
      })
    );
    delete value.socialSharingImage;
  }

  return { value, issues };
};

/**
 * Build final `config.branding`: prefer validated hosted values; fill some gaps from built-ins
 * (marketplaceColor, logo URLs, logoSettings, social sharing). No built-in config for brandImage,
 * favicon, appIcon, or primaryButton when omitted.
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.branding`)
 * @returns {Object} app-config branding object
 */
const resolve = (validated, defaults) => mergeBrandingConfig(validated, defaults?.branding);

/**
 * Config handler for the `branding` app-config key.
 *
 * - id: key on the resolved app config (`config.branding`)
 * - assetKeys: hosted-asset / appCdnAssets keys this handler reads
 * - This asset is mandatory: missing logo → MaintenanceMode (BRANDING_MISSING_LOGO)
 *
 * Pipeline: normalize → validate → resolve (via applyConfigHandlers).
 * Hosted config takes priority; built-in defaults fill gaps for color, logos,
 * and social images. brandImage comes only from hosted loginBackgroundImage.
 */
export const brandingConfig = {
  id: 'branding',
  assetKeys: ['branding'],
  normalize,
  validate,
  resolve,
};
