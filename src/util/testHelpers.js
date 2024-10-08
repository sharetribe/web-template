import React from 'react';
import mapValues from 'lodash/mapValues';

import * as reactTestingLibrary from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';

import { IntlProvider } from './reactIntl';
import { mergeConfig } from './configHelpers';

import configureStore from '../store';
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
      mapboxAccessToken: 'fake-token',
      googleMapsAPIKey: undefined,
    },
    stripe: {
      ...defaultConfig.stripe,
      publishableKey: 'pk_test_',
    },
    branding: {
      ...defaultConfig.branding,
      logoImageDesktop: defaultConfig.branding.logoImageDesktopURL,
      logoImageMobile: defaultConfig.branding.logoImageMobileURL,
      brandImage: defaultConfig.branding.brandImageURL,
      facebookImage: defaultConfig.branding.facebookImageURL,
      twitterImage: defaultConfig.branding.twitterImageURL,
    },
    listing: {
      listingFields: [
        {
          key: 'bikeType',
          scope: 'public',
          listingTypeConfig: {
            limitToListingTypeIds: true,
            listingTypeIds: [
              'product-selling',
              'daily-booking',
              'nightly-booking',
              'hourly-booking',
            ],
          },
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
            label: 'Bike type',
            group: 'primary',
          },
          showConfig: {
            label: 'Bike type',
            isDetail: true,
          },
          saveConfig: {
            label: 'Select a bike type',
            placeholderMessage: 'Choose…',
            isRequired: true,
            requiredMessage: 'You need to select the type of the bike.',
          },
        },

        {
          key: 'tire-size',
          scope: 'public',
          listingTypeConfig: {
            limitToListingTypeIds: true,
            listingTypeIds: [
              'product-selling',
              'daily-booking',
              'nightly-booking',
              'hourly-booking',
            ],
          },
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
          listingTypeConfig: {
            limitToListingTypeIds: true,
            listingTypeIds: [
              'product-selling',
              'daily-booking',
              'nightly-booking',
              'hourly-booking',
            ],
          },
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

export const getHostedConfiguration = () => {
  return {
    branding: {
      logo: {
        id: 'bc308ecd-c5dd-551e-b020-04b5a4f3e829',
        type: 'imageAsset',
        attributes: {
          variants: {
            scaled: {
              height: 24,
              width: 128,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled',
            },
            scaled2x: {
              height: 48,
              width: 256,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled2x',
            },
          },
          assetPath: '/design/branding/logo-0187eb7f-65d9-8e15-96b3-a598edad56c6.png',
        },
      },
      favicon: {
        id: '23d289fe-9078-5df4-8267-1890534268bb',
        type: 'imageAsset',
        attributes: {
          variants: {
            square16: {
              height: 16,
              width: 16,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'square16',
            },
            square32: {
              height: 32,
              width: 32,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'square32',
            },
            square48: {
              height: 48,
              width: 48,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'square48',
            },
          },
          assetPath: '/design/branding/favicon-0187fae8-9128-88ce-a567-5d4f4df9b5b4.png',
        },
      },
      loginBackgroundImage: {
        id: '5077312e-0dcb-54a7-9251-5cc56a83efad',
        type: 'imageAsset',
        attributes: {
          variants: {
            scaled800: {
              height: 436,
              width: 800,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled800',
            },
            scaled1200: {
              height: 654,
              width: 1200,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled1200',
            },
            scaled2400: {
              height: 1309,
              width: 2400,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled2400',
            },
          },
          assetPath: '/design/branding/login-background-0187eb37-d04e-8863-b5ca-f3fb2bcc3933.png',
        },
      },
      marketplaceColors: {
        mainColor: '#7c3aee',
      },
      socialSharingImage: {
        id: '3f197410-bdc6-5363-b489-48b2655bd076',
        type: 'imageAsset',
        attributes: {
          variants: {
            scaled600: {
              height: 315,
              width: 600,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled600',
            },
            scaled1200: {
              height: 630,
              width: 1200,
              url: 'https://fake.imgix.net/some/fake/path',
              name: 'scaled1200',
            },
          },
          assetPath: '/design/branding/social-sharing-0187eb39-99a9-8dbf-b2e5-c04c9d4e85f5.jpg',
        },
      },
    },
    layout: {
      listingImage: {
        variantType: 'cropImage',
        aspectRatio: '1/1',
      },
      searchPage: {
        variantType: 'grid',
      },
      listingPage: {
        variantType: 'coverPhoto',
      },
    },
    listingTypes: {
      listingTypes: [
        {
          transactionProcess: {
            alias: 'default-booking/release-1',
            name: 'default-booking',
          },
          id: 'daily-booking',
          label: 'Daily Booking',
          unitType: 'day',
        },
        {
          transactionProcess: {
            alias: 'default-purchase/release-1',
            name: 'default-purchase',
          },
          id: 'product-selling',
          label: 'Sell products',
          unitType: 'item',
        },
        {
          transactionProcess: {
            alias: 'default-inquiry/release-1',
            name: 'default-inquiry',
          },
          id: 'inquiry',
          label: 'Inquiry',
          unitType: 'inquiry',
          defaultListingFields: {
            price: true,
          },
        },
      ],
    },
    listingFields: {
      listingFields: [
        {
          enumOptions: [
            {
              option: 'citybikes',
              label: 'City bikes',
            },
            {
              option: 'electricbikes',
              label: 'Electric bikes',
            },
            {
              label: 'Mountain bikes',
              option: 'mountainbikes',
            },
            {
              option: 'childrensbikes',
              label: "Children's bikes",
            },
          ],
          filterConfig: {
            indexForSearch: true,
            group: 'primary',
          },
          scope: 'public',
          label: 'Bike type',
          key: 'bikeType',
          schemaType: 'enum',
          saveConfig: {
            required: true,
          },
        },
        {
          enumOptions: [
            {
              label: '29"',
              option: 'inhc29',
            },
            {
              label: '28"',
              option: 'inch28',
            },
            {
              label: '27"',
              option: 'inch27',
            },
            {
              label: '26"',
              option: 'inch26',
            },
            {
              label: '24"',
              option: 'inch24',
            },
            {
              label: '20"',
              option: 'inch20',
            },
            {
              label: '18"',
              option: 'inch18',
            },
          ],
          filterConfig: {
            indexForSearch: true,
            group: 'secondary',
          },
          scope: 'public',
          key: 'tire',
          label: 'Tire size',
          schemaType: 'enum',
          saveConfig: {
            required: true,
          },
        },
        {
          enumOptions: [
            {
              label: 'Cube',
              option: 'cube',
            },
            {
              label: 'Diamant',
              option: 'diamant',
            },
            {
              label: 'GHOST',
              option: 'ghost',
            },
            {
              option: 'giant',
              label: 'Giant',
            },
            {
              label: 'Kalkhoff',
              option: 'kalkhoff',
            },
            {
              option: 'kona',
              label: 'Kona',
            },
            {
              label: 'Otler',
              option: 'otler',
            },
            {
              label: 'Vermont',
              option: 'vermont',
            },
          ],
          filterConfig: {
            indexForSearch: true,
            group: 'secondary',
          },
          scope: 'public',
          key: 'brand',
          schemaType: 'enum',
          label: 'Brand',
          saveConfig: {
            required: true,
          },
        },
        {
          enumOptions: [
            {
              label: 'Bell',
              option: 'bell',
            },
            {
              option: 'lights',
              label: 'Lights',
            },
            {
              option: 'lock',
              label: 'Lock',
            },
            {
              option: 'mudguard',
              label: 'Mudguard',
            },
          ],
          filterConfig: {
            indexForSearch: true,
            group: 'secondary',
          },
          scope: 'public',
          label: 'Accessories',
          key: 'accessories',
          saveConfig: {
            required: true,
          },
          schemaType: 'multi-enum',
        },
      ],
    },
    userTypes: {
      userTypes: [
        {
          userType: 'a',
          label: 'Seller',
          defaultListingFields: {
            displayName: true,
            phoneNumber: true,
          },
        },
        {
          userType: 'b',
          label: 'Buyer',
          defaultListingFields: {
            displayName: false,
            phoneNumber: true,
          },
        },
        {
          userType: 'c',
          label: 'Guest',
          defaultListingFields: {
            displayName: false,
            phoneNumber: true,
          },
        },
        {
          userType: 'd',
          label: 'Host',
          defaultListingFields: {
            displayName: false,
            phoneNumber: true,
          },
        },
      ],
    },
    userFields: {
      userFields: [
        {
          key: 'cuisine',
          scope: 'public',
          schemaType: 'enum',
          enumOptions: [
            { option: 'italian', label: 'Italian' },
            { option: 'chinese', label: 'Chinese' },
            { option: 'thai', label: 'Thai' },
          ],
          showConfig: {
            label: 'Favorite cuisine',
          },
          saveConfig: {
            label: 'Favorite cuisine',
            displayInSignUp: true,
            isRequired: true,
          },
          userTypeConfig: {
            limitToUserTypeIds: true,
            userTypeIds: ['a', 'b', 'c'],
          },
        },
        {
          key: 'canCook',
          scope: 'public',
          schemaType: 'boolean',
          showConfig: {
            label: 'Can you cook?',
          },
          saveConfig: {
            label: 'Can you cook?',
            displayInSignUp: true,
            isRequired: true,
          },
          userTypeConfig: {
            limitToUserTypeIds: true,
            userTypeIds: ['a', 'b', 'c'],
          },
        },
        {
          key: 'numberOfCookbooks',
          scope: 'public',
          schemaType: 'long',
          showConfig: {
            label: 'How many cookbooks do you have',
          },
          saveConfig: {
            label: 'How many cookbooks do you have',
            displayInSignUp: true,
            isRequired: true,
          },
          userTypeConfig: {
            limitToUserTypeIds: true,
            userTypeIds: ['a', 'b', 'c'],
          },
        },
        {
          key: 'kitchenDescription',
          scope: 'public',
          schemaType: 'text',
          showConfig: {
            label: 'Description of your kitchen',
          },
          saveConfig: {
            label: 'Description of your kitchen',
            displayInSignUp: true,
            isRequired: true,
          },
          userTypeConfig: {
            limitToUserTypeIds: true,
            userTypeIds: ['a', 'b', 'c'],
          },
        },
        {
          key: 'dietaryPreferences',
          scope: 'public',
          schemaType: 'multi-enum',
          enumOptions: [
            { option: 'vegan', label: 'Vegan' },
            { option: 'vegetarian', label: 'Vegetarian' },
            { option: 'gluten-free', label: 'Gluten free' },
            { option: 'dairy-free', label: 'Dairy free' },
            { option: 'nut-free', label: 'Nut free' },
            { option: 'egg-free', label: 'Egg free' },
            { option: 'low-carb', label: 'Low carb' },
            { option: 'low-fat', label: 'Low fat' },
          ],
          showConfig: {
            label: 'Dietary preferences',
            displayInProfile: true,
          },
          saveConfig: {
            label: 'Dietary preferences',
            displayInSignUp: true,
            isRequired: true,
          },
          userTypeConfig: {
            limitToUserTypeIds: true,
            userTypeIds: ['a', 'b', 'c'],
          },
        },
        {
          key: 'notShownInProfileAttribute',
          scope: 'public',
          schemaType: 'text',
          showConfig: {
            label: 'Not shown in profile',
            displayInProfile: false,
          },
          saveConfig: {
            label: "Don't show in profile",
            displayInSignUp: false,
            isRequired: false,
          },
        },
      ],
    },
    search: {
      dateRangeFilter: {
        enabled: true,
        schemaType: 'dates',
        availability: 'time-full',
        dateRangeMode: 'day',
      },
      priceFilter: {
        enabled: true,
        schemaType: 'price',
        min: 0,
        max: 1000,
      },
      mainSearch: {
        searchType: 'location',
      },
    },
    transactionSize: {
      listingMinimumPrice: {
        amount: 500,
        type: 'subunit',
      },
    },
  };
};

export const getRouteConfiguration = (layoutConfiguration = {}) => {
  const layoutConfig = {
    searchPage: { variantType: 'map' },
    listingPage: { variantType: 'carousel' },
    listingImage: {
      aspectWidth: 400,
      aspectHeight: 400,
      variantPrefix: 'listing-card',
    },
    ...layoutConfiguration,
  };
  return routeConfiguration(layoutConfig);
};

export const createFakeDispatch = (getState, sdk) => {
  const dispatch = jest.fn(actionOrFn => {
    if (typeof actionOrFn === 'function') {
      return actionOrFn(dispatch, getState, sdk);
    }
    return actionOrFn;
  });
  return dispatch;
};

// Get the dispatched actions from the fake dispatch function
export const dispatchedActions = fakeDispatch => {
  return fakeDispatch.mock.calls.reduce((actions, args) => {
    if (Array.isArray(args) && args.length === 1) {
      const action = args[0];
      return typeof action === 'object' ? actions.concat([action]) : actions;
    } else {
      console.error('fake dispatch invalid call args:', args);
      throw new Error('Fake dispatch function should only be called with a single argument');
    }
  }, []);
};

// Locale should not affect the tests. We ensure this by providing
// messages with the key as the value of each message.
const testMessages = mapValues(messages, (val, key) => key);

// Provide all the context for components that connect to the Redux
// store, i18n, router, etc.
export const TestProvider = ({ children, initialState, config, routeConfiguration }) => {
  const store = configureStore(initialState || {});
  const hostedConfig = config || getHostedConfiguration();
  return (
    <ConfigurationProvider value={mergeConfig(hostedConfig, getDefaultConfiguration())}>
      <RouteConfigurationProvider value={routeConfiguration || getRouteConfiguration()}>
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

export const renderWithProviders = (
  ui,
  { initialState, config, routeConfiguration, withPortals, ...renderOptions } = {}
) => {
  const Wrapper = ({ children }) => {
    return (
      <TestProvider
        initialState={initialState}
        config={config}
        routeConfiguration={routeConfiguration}
      >
        {children}
      </TestProvider>
    );
  };
  const WrapperWithPortalRoot = ({ children }) => {
    return (
      <>
        <div id="root">
          <TestProvider
            initialState={initialState}
            config={config}
            routeConfiguration={routeConfiguration}
          >
            {children}
          </TestProvider>
        </div>
        <div id="portal-root"></div>
      </>
    );
  };
  const WrapperComponent = withPortals ? WrapperWithPortalRoot : Wrapper;
  return reactTestingLibrary.render(ui, { wrapper: WrapperComponent, ...renderOptions });
};
export const testingLibrary = { ...reactTestingLibrary, userEvent };
