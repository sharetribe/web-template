import { createContext, useContext } from 'react';

const mergeLayouts = (layoutConfig, defaultLayout) => {
  const isValidSearchPageConfig = ['map', 'list'].includes(layoutConfig.searchPageVariant);
  const isValidListingPageConfig = ['hero-image', 'full-image'].includes(
    layoutConfig.listingPageVariant
  );
  return {
    searchPageVariant: isValidSearchPageConfig
      ? layoutConfig.searchPageVariant
      : defaultLayout?.searchPageVariant,
    listingPageVariant: isValidListingPageConfig
      ? layoutConfig.listingPageVariant
      : defaultLayout?.listingPageVariant,
  };
};

export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  return {
    ...configAsset,
    ...defaultConfigs,
    layout: mergeLayouts(assetConfig.layout, defaultConfigs.layout),
  };
};

export const ConfigurationContext = createContext();

export const ConfigurationProvider = ConfigurationContext.Provider;

export const useConfiguration = () => {
  return useContext(ConfigurationContext);
};
