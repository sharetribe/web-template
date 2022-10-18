import React from 'react';
import ReactDOM from 'react-dom';
import { getDefaultConfiguration } from './util/test-helpers';
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
  it('renders in the client without crashing', () => {
    window.google = { maps: {} };
    const store = configureStore();
    const div = document.createElement('div');
    ReactDOM.render(<ClientApp store={store} hostedConfig={getDefaultConfiguration()} />, div);
    delete window.google;
  });
});
