import React from 'react';
import mapValues from 'lodash/mapValues';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import configureStore from '../store';
import { IntlProvider } from '../util/reactIntl';
import defaultConfig from '../config/configDefault';
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
    marketplaceName: 'MarketplaceX',
    facebookAppId: undefined,
    marketplaceRootURL: 'http://localhost:3000',
    maps: {
      ...defaultConfig.maps,
      mapboxAccessToken: undefined,
      googleMapsAPIKey: undefined,
    },
    stripe: {
      ...defaultConfig.stripe,
      publishableKey: 'pk_test_',
    },
    listing: {
      listingExtendedData: [
        {
          key: 'category',
          scope: 'public',
          includeForListingTypes: [
            'product-selling',
            'daily-booking',
            'nightly-booking',
            'hourly-booking',
          ],
          schemaType: 'enum',
          schemaOptions: [
            { option: 'city-bikes', label: 'City bikes' },
            { option: 'e-bikes', label: 'E-bikes' },
            { option: 'mtb', label: 'MTB' },
            { option: 'kids-bikes', label: 'Kids bikes' },
          ],
          indexForSearch: true,
          searchPageConfig: {
            filterType: 'SelectSingleFilter',
            label: 'Category',
            group: 'primary',
          },
          listingPageConfig: {
            label: 'Category',
            isDetail: true,
          },
          editListingPageConfig: {
            label: 'Select category',
            placeholderMessage: 'Choose…',
            isRequired: true,
            requiredMessage: 'You need to select a category.',
          },
        },

        {
          key: 'tire-size',
          scope: 'public',
          includeForListingTypes: [
            'product-selling',
            'daily-booking',
            'nightly-booking',
            'hourly-booking',
          ],
          schemaType: 'enum',
          schemaOptions: [
            { option: 29, label: '29' },
            { option: 28, label: '28' },
            { option: 27, label: '27' },
            { option: 26, label: '26' },
            { option: 24, label: '24' },
            { option: 20, label: '20' },
            { option: 18, label: '18' },
          ],
          indexForSearch: true,
          searchPageConfig: {
            label: 'Tire size',
            group: 'secondary',
          },
          listingPageConfig: {
            label: 'Tire size',
            isDetail: true,
          },
          editListingPageConfig: {
            label: 'Tire size',
            placeholderMessage: 'Choose…',
            isRequired: true,
            requiredMessage: 'You need to select a tire size.',
          },
        },
        {
          key: 'brand',
          scope: 'public',
          includeForListingTypes: [
            'product-selling',
            'daily-booking',
            'nightly-booking',
            'hourly-booking',
          ],
          schemaType: 'enum',
          schemaOptions: [
            { option: 'cube', label: 'Cube' },
            { option: 'diamant', label: 'Diamant' },
            { option: 'ghost', label: 'GHOST' },
            { option: 'giant', label: 'Giant' },
            { option: 'kalkhoff', label: 'Kalkhoff' },
            { option: 'kona', label: 'Kona' },
            { option: 'otler', label: 'Otler' },
            { option: 'vermont', label: 'Vermont' },
          ],
          indexForSearch: true,
          searchPageConfig: {
            label: 'Brand',
            group: 'secondary',
          },
          listingPageConfig: {
            label: 'Brand',
            isDetail: true,
          },
          editListingPageConfig: {
            label: 'Brand',
            placeholderMessage: 'Choose…',
            isRequired: true,
            requiredMessage: 'You need to select a brand.',
          },
        },
      ],
    },
    transaction: {
      transactionTypes: [
        {
          type: 'rent-bicycles',
          label: 'Rent bicycles',
          process: 'default-booking',
          alias: 'release-1',
          unitType: 'day',
        },
        {
          type: 'product-selling',
          label: 'Sell products',
          process: 'default-buying-products',
          alias: 'release-1',
          unitType: 'item',
        },
      ],
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
