import { createContext, useContext } from 'react';

const mergeLayouts = (layoutConfig, defaultLayout) => {
  const isValidSearchPageConfig = ['map', 'list'].includes(layoutConfig?.searchPageVariant);
  const isValidListingPageConfig = ['hero-image', 'full-image'].includes(
    layoutConfig?.listingPageVariant
  );

  return {
    searchPageVariant: isValidSearchPageConfig
      ? layoutConfig?.searchPageVariant
      : defaultLayout.searchPageVariant,
    listingPageVariant: isValidListingPageConfig
      ? layoutConfig?.listingPageVariant
      : defaultLayout.listingPageVariant,
    listingImage: {
      aspectWidth:
        layoutConfig?.listingImage?.aspectWidth || defaultLayout?.listingImage?.aspectWidth,
      aspectHeight:
        layoutConfig?.listingImage?.aspectHeight || defaultLayout?.listingImage?.aspectHeight,
      variantPrefix: defaultLayout.variantPrefix,
    },
  };
};

export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  return {
    ...configAsset,
    ...defaultConfigs,
    layout: mergeLayouts(configAsset.layout, defaultConfigs.layout),
  };
};

export const ConfigurationContext = createContext();

export const ConfigurationProvider = ConfigurationContext.Provider;

export const useConfiguration = () => {
  return useContext(ConfigurationContext);
};
