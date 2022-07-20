import React, { createContext, useContext } from 'react';

export const RouteConfigurationContext = createContext();

export const RouteConfigurationProvider = RouteConfigurationContext.Provider;

export const useRouteConfiguration = () => {
  return useContext(RouteConfigurationContext);
};

export const withRouteConfiguration = Component => {
  const displayName = `withRouteConfiguration(${Component.displayName || Component.name})`;
  const C = props => {
    return (
      <RouteConfigurationContext.Consumer>
        {context => {
          return <Component {...props} routeConfiguration={context} />;
        }}
      </RouteConfigurationContext.Consumer>
    );
  };
  C.displayName = displayName;
  C.WrappedComponent = Component;
  return C;
};
