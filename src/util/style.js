/**
 * Construct a list of custom CSS Properties from branding config.
 *
 * @param {Object} brandingConfig branding configuration
 * @returns Object literal containing custom CSS Properties (e.g. ['--marketplaceColor']: #aaff00).
 */
export const getCustomCSSPropertiesFromConfig = brandingConfig => {
  const marketplaceColorsMaybe = brandingConfig.marketplaceColor
    ? {
        ['--marketplaceColor']: brandingConfig.marketplaceColor,
        ['--marketplaceColorDark']: brandingConfig.marketplaceColorDark,
        ['--marketplaceColorLight']: brandingConfig.marketplaceColorLight,
      }
    : {};
  const primaryButtonColorsMaybe = brandingConfig.colorPrimaryButton
    ? {
        ['--colorPrimaryButton']: brandingConfig.colorPrimaryButton,
        ['--colorPrimaryButtonDark']: brandingConfig.colorPrimaryButtonDark,
        ['--colorPrimaryButtonLight']: brandingConfig.colorPrimaryButtonLight,
      }
    : {};

  return { ...marketplaceColorsMaybe, ...primaryButtonColorsMaybe };
};

/**
 * This includes Custom CSS Properties, which are defined in hosted asset: branding.json
 *
 * @param {Object} brandingConfig branding configuration
 * @param {Node} element DOM element, which gets these CSS vars included.
 */
export const includeCSSProperties = (brandingConfig, element) => {
  Object.entries(getCustomCSSPropertiesFromConfig(brandingConfig)).forEach(customCSSProperty => {
    const [key, value] = customCSSProperty;
    element.style.setProperty(key, value);
  });
};
