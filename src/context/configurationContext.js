import { createContext, useContext } from 'react';

export const mergeConfig = (configAsset, defaultConfigs) => {
  const searchPageVariant = configAsset.searchPageVariant || defaultConfigs.searchPageVariant;
  const listingPageVariant = configAsset.listingPageVariant || defaultConfigs.listingPageVariant;

  return {
    ...configAsset,
    ...defaultConfigs,
    pageVariantConfig: {
      searchPageVariant,
      listingPageVariant,
    },
  };
};

export const ConfigurationContext = createContext();

export const ConfigurationProvider = ConfigurationContext.Provider;

export const useConfiguration = () => {
  return useContext(ConfigurationContext);
};
