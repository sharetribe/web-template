import { createContext, useContext } from 'react';

export const ConfigurationContext = createContext();

export const ConfigurationProvider = ConfigurationContext.Provider;

export const useConfiguration = () => {
  return useContext(ConfigurationContext);
};
