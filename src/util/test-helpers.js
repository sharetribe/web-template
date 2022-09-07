import React from 'react';
import mapValues from 'lodash/mapValues';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import configureStore from '../store';
import { IntlProvider } from '../util/reactIntl';
import defaultConfig from '../config/defaultConfig';
import { ConfigurationProvider } from '../context/configurationContext';
import { RouteConfigurationProvider } from '../context/routeConfigurationContext';
import routeConfiguration from '../routing/routeConfiguration';

// In case you have translated the template and have new translations that
// are missing from the en translations file, the language for the tests can
// be changed here so that there are no missing translation keys in tests.
import messages from '../translations/en.json';

Enzyme.configure({ adapter: new Adapter() });

let undefined;
export const getDefaultConfiguration = () => {
  return {
    ...defaultConfig,
    currency: 'USD',
    facebookAppId: undefined,
    canonicalRootURL: 'http://localhost:3000',
    maps: {
      ...defaultConfig.maps,
      mapboxAccessToken: undefined,
      googleMapsAPIKey: undefined,
    },
    stripe: {
      ...defaultConfig.stripe,
      publishableKey: 'pk_test_',
    },
  };
};

export const getRouteConfiguration = () => {
  const layoutConfig = {
    searchPageVariant: 'map',
    listingPageVariant: 'full-image',
    listingImage: {
      aspectWidth: 400,
      aspectHeight: 400,
      variantPrefix: 'listing-card',
    },
  };
  return routeConfiguration(layoutConfig);
};

// Locale should not affect the tests. We ensure this by providing
// messages with the key as the value of each message.
const testMessages = mapValues(messages, (val, key) => key);

// Provide all the context for components that connect to the Redux
// store, i18n, router, etc.
export const TestProvider = props => {
  const store = configureStore();
  return (
    <ConfigurationProvider value={getDefaultConfiguration()}>
      <RouteConfigurationProvider value={getRouteConfiguration()}>
        <IntlProvider locale="en" messages={testMessages} textComponent="span">
          <BrowserRouter>
            <Provider store={store}>{props.children}</Provider>
          </BrowserRouter>
        </IntlProvider>
      </RouteConfigurationProvider>
    </ConfigurationProvider>
  );
};

// Use Enzyme's shallow rendering to render the given component to a
// JSON structure that can be used in snapshot tests. This doesn't
// render the children within the given component, only a
// representation of the child component and its props.
//
// Useful for snapshot testing components that contain shared
// components. With deep rendering, if the child component changes
// internally, the test for the given component would also fail. This
// avoids the problem by not rendering the full tree but only the
// relevant structure for the given component.
export const renderShallow = component => {
  return toJson(shallow(component));
};

// Fully render the given component to a JSON structure that can be
// used in snapshot tests.
export const renderDeep = component => {
  return toJson(mount(<TestProvider>{component}</TestProvider>), { mode: 'deep' });
};
