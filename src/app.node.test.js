/**
 * @jest-environment node
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import forEach from 'lodash/forEach';
import { getHostedConfiguration } from './util/testHelpers';
import { ServerApp } from './app';
import configureStore from './store';

const render = (url, context) => {
  const store = configureStore();

  const helmetContext = {};

  const body = ReactDOMServer.renderToString(
    <ServerApp
      url={url}
      context={context}
      helmetContext={helmetContext}
      store={store}
      hostedConfig={getHostedConfiguration()}
    />
  );

  const { helmet: head } = helmetContext;
  return { head, body };
};

describe('Application - node environment', () => {
  it('renders in the server without crashing', () => {
    render('/', {});
  });

  it('renders the styleguide without crashing', () => {
    render('/styleguide', {});
  });

  it('redirects to correct URLs', () => {
    const urlRedirects = { '/l': '/', '/u': '/' };
    forEach(urlRedirects, (redirectPath, url) => {
      const context = {};
      render(url, context);
      expect(context.url).toEqual(redirectPath);
    });
  });
});
