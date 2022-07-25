import React, { createContext, useContext } from 'react';

export const RouteConfigurationContext = createContext();

export const RouteConfigurationProvider = RouteConfigurationContext.Provider;

export const useRouteConfiguration = () => {
  return useContext(RouteConfigurationContext);
};
