import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import BlockInstagramFeed from './BlockInstagramFeed';

const { waitFor } = testingLibrary;

const originalFetch = global.fetch;

describe('BlockInstagramFeed', () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders a skeleton while loading', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    const { container } = render(<BlockInstagramFeed blockId="ig-1" />);
    await waitFor(() => {
      expect(container.querySelector('[class*="skeleton"]')).toBeTruthy();
    });
  });

  it('renders nothing when the feed API errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: false }),
    });
    const { container } = render(<BlockInstagramFeed blockId="ig-2" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders the InstagramFeed wrapper when the API succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          profile: { username: 'archivovintach' },
          posts: [],
        }),
    });
    const { container } = render(<BlockInstagramFeed blockId="ig-3" />);
    await waitFor(() => {
      expect(container.querySelector('#ig-3')).toBeInTheDocument();
    });
  });

  it('renders nothing when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    const { container } = render(<BlockInstagramFeed blockId="ig-4" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
