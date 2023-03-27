import React from 'react';
import mapValues from 'lodash/mapValues';

import * as reactTestingLibrary from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';

import configureStore from '../store';
import { IntlProvider } from './reactIntl';
import defaultConfig from '../config/configDefault';
import { ConfigurationProvider } from '../context/configurationContext';
import { RouteConfigurationProvider } from '../context/routeConfigurationContext';
import routeConfiguration from '../routing/routeConfiguration';

// In case you have translated the template and have new translations that
// are missing from the en translations file, the language for the tests can
// be changed here so that there are no missing translation keys in tests.
import messages from '../translations/en.json';

let undefined;
export const getDefaultConfiguration = () => {
  // TODO: add more relevant data for tests
  // TODO: make it possible to overwrite configuration for tests
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
      listingFields: [
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
          enumOptions: [
            { option: 'city-bikes', label: 'City bikes' },
            { option: 'e-bikes', label: 'E-bikes' },
            { option: 'mtb', label: 'MTB' },
            { option: 'kids-bikes', label: 'Kids bikes' },
          ],
          filterConfig: {
            indexForSearch: true,
            filterType: 'SelectSingleFilter',
            label: 'Category',
            group: 'primary',
          },
          showConfig: {
            label: 'Category',
            isDetail: true,
          },
          saveConfig: {
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
          enumOptions: [
            { option: 29, label: '29' },
            { option: 28, label: '28' },
            { option: 27, label: '27' },
            { option: 26, label: '26' },
            { option: 24, label: '24' },
            { option: 20, label: '20' },
            { option: 18, label: '18' },
          ],
          filterConfig: {
            indexForSearch: true,
            label: 'Tire size',
            group: 'secondary',
          },
          showConfig: {
            label: 'Tire size',
            isDetail: true,
          },
          saveConfig: {
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
          enumOptions: [
            { option: 'cube', label: 'Cube' },
            { option: 'diamant', label: 'Diamant' },
            { option: 'ghost', label: 'GHOST' },
            { option: 'giant', label: 'Giant' },
            { option: 'kalkhoff', label: 'Kalkhoff' },
            { option: 'kona', label: 'Kona' },
            { option: 'otler', label: 'Otler' },
            { option: 'vermont', label: 'Vermont' },
          ],
          filterConfig: {
            indexForSearch: true,
            label: 'Brand',
            group: 'secondary',
          },
          showConfig: {
            label: 'Brand',
            isDetail: true,
          },
          saveConfig: {
            label: 'Brand',
            placeholderMessage: 'Choose…',
            isRequired: true,
            requiredMessage: 'You need to select a brand.',
          },
        },
      ],
      listingTypes: [
        {
          listingType: 'rent-bicycles',
          label: 'Rent bicycles',
          transactionType: {
            process: 'default-booking',
            alias: 'default-booking/release-1',
            unitType: 'day',
          },
        },
        {
          listingType: 'product-selling',
          label: 'Sell products',
          transactionType: {
            process: 'default-purchase',
            alias: 'default-purchase/release-1',
            unitType: 'item',
          },
        },
      ],
    },
    search: {
      ...defaultConfig.search,
      mainSearch: {
        searchType: 'keywords',
      },
      defaultFilters: [defaultConfig.search.dateRangeFilter, defaultConfig.search.priceFilter],
    },
  };
};

export const getRouteConfiguration = () => {
  const layoutConfig = {
    searchPage: { variantType: 'map' },
    listingPage: { variantType: 'carousel' },
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
export const TestProvider = ({ children }) => {
  const store = configureStore();
  return (
    <ConfigurationProvider value={getDefaultConfiguration()}>
      <RouteConfigurationProvider value={getRouteConfiguration()}>
        <IntlProvider locale="en" messages={testMessages} textComponent="span">
          <Provider store={store}>
            <HelmetProvider>
              <MemoryRouter>{children}</MemoryRouter>
            </HelmetProvider>
          </Provider>
        </IntlProvider>
      </RouteConfigurationProvider>
    </ConfigurationProvider>
  );
};

// With react-testing-library we don't have option to shallow render
// so we would need a custom render function to add required wrappers
// in order to test the whole Page component.
// Example for creating custom render function
// for using React Intl with RTL:
// https://testing-library.com/docs/example-react-intl#creating-a-custom-render-function
// function render(ui, { preloadedState, store = configureStore(), ...renderOptions } = {}) {
//   function Wrapper({ children }) {
//     return (<TestProvider>{children}</TestProvider>);
//   }
//   return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
// }

export const renderWithProviders = (ui, renderOptions = {}) => {
  const Wrapper = ({ children }) => {
    return <TestProvider>{children}</TestProvider>;
  };
  return reactTestingLibrary.render(ui, { wrapper: Wrapper, ...renderOptions });
};
export const testingLibrary = { ...reactTestingLibrary, userEvent };
