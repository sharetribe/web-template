import React, { act } from 'react';
import ReactDOMClient from 'react-dom/client';
import { getHostedConfiguration } from './util/testHelpers';
import { ClientApp } from './app';
import configureStore from './store';

const jsdomScroll = window.scroll;
beforeAll(() => {
  // Mock window.scroll - otherwise, Jest/JSDOM will print a not-implemented error.
  window.scroll = () => {};
});

afterAll(() => {
  window.scroll = jsdomScroll;
});

describe('Application - JSDOM environment', () => {
  it('renders the LandingPage without crashing', async () => {
    window.google = { maps: {} };

    // LandingPage gets rendered and it calls hostedAsset > fetchPageAssets > sdk.assetByVersion
    const pageData = {
      data: {
        sections: [],
        _schema: './schema.json',
      },
      meta: {
        version: 'bCsMYVYVawc8SMPzZWJpiw',
      },
    };
    const resolvePageAssetCall = () => Promise.resolve(pageData);
    const fakeSdk = { assetByVersion: resolvePageAssetCall, assetByAlias: resolvePageAssetCall };
    const store = configureStore({}, fakeSdk);
    const div = document.createElement('div');
    const root = ReactDOMClient.createRoot(div);

    await act(async () => {
      root.render(<ClientApp store={store} hostedConfig={getHostedConfiguration()} />);
    });
    delete window.google;
  });
});
