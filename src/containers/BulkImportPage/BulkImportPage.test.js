import React from 'react';
import '@testing-library/jest-dom';

// CustomLinksMenu fetches /static/data/top-bar.json in a useEffect (via fetchLocalTopbarData).
// Mock the whole component to prevent it from consuming global.fetch responses meant for tests.
jest.mock(
  '../TopbarContainer/Topbar/TopbarDesktop/CustomLinksMenu/CustomLinksMenu',
  () => () => null
);

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import BulkImportPage from './BulkImportPage';

const { screen, waitFor, fireEvent, act } = testingLibrary;

const baseState = {
  marketplaceData: { entities: {} },
  user: {
    currentUser: null,
    currentUserHasListings: false,
    sendVerificationEmailInProgress: false,
  },
};

const originalFetch = global.fetch;
const originalCreateObjectURL = window.URL.createObjectURL;
const originalRevokeObjectURL = window.URL.revokeObjectURL;
const originalCreateElement = document.createElement.bind(document);

describe('BulkImportPage', () => {
  beforeEach(() => {
    // Default mock returns a resolved promise so the Topbar's fetchLocalTopbarData
    // (fired in a useEffect) doesn't crash. Tests that need specific responses
    // use mockResolvedValueOnce to override on a call-by-call basis.
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => null });
    window.localStorage.clear();
    window.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    document.createElement = originalCreateElement;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('renders page heading', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.heading')).toBeInTheDocument();
    });
  });

  it('renders description text', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.description')).toBeInTheDocument();
    });
  });

  it('renders API key input', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      const input = screen.getByLabelText('BulkImportPage.apiKeyLabel');
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('password');
    });
  });

  it('renders ZIP file input', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      const input = screen.getByLabelText('BulkImportPage.zipLabel');
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('file');
      expect(input.accept).toBe('.zip');
    });
  });

  it('renders ZIP helper text', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.zipHelp')).toBeInTheDocument();
    });
  });

  it('renders start import button', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.startImport')).toBeInTheDocument();
    });
  });

  it('renders download template link', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      const link = screen.getByText('BulkImportPage.downloadTemplate');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/api/bulk-import/template');
    });
  });

  it('downloads the csv template through fetch when the link is clicked', async () => {
    const clickSpy = jest.fn();
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.fn();

    document.createElement = jest.fn(tagName => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = clickSpy;
        element.remove = removeSpy;
      }
      return element;
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['title,description,price'], { type: 'text/csv' }),
    });

    window.localStorage.setItem('bulkImportApiKey', 'secret-key');

    render(<BulkImportPage />, { initialState: baseState });

    const link = await screen.findByText('BulkImportPage.downloadTemplate');
    fireEvent.click(link);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bulk-import/template', {
        headers: { 'X-Import-Key': 'secret-key' },
      });
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    appendSpy.mockRestore();
  });

  it('shows API key error when downloading template without API key', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    const link = await screen.findByText('BulkImportPage.downloadTemplate');
    fireEvent.click(link);

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.errorNoApiKey')).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error when submitting without API key', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.startImport')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('BulkImportPage.startImport'));

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.errorNoApiKey')).toBeInTheDocument();
    });
  });

  it('shows error when submitting without a ZIP file', async () => {
    window.localStorage.setItem('bulkImportApiKey', 'secret-key');

    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.startImport')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('BulkImportPage.startImport'));

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.errorNoZip')).toBeInTheDocument();
    });
  });

  it('shows validation error returned from start endpoint', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'CSV validation failed.',
        details: ['Row 2: "image_back" is required.'],
      }),
    });

    window.localStorage.setItem('bulkImportApiKey', 'secret-key');

    render(<BulkImportPage />, { initialState: baseState });

    const zipInput = await screen.findByLabelText('BulkImportPage.zipLabel');
    const zipFile = new File(['fake zip content'], 'listings.zip', { type: 'application/zip' });
    fireEvent.change(zipInput, { target: { files: [zipFile] } });

    fireEvent.click(screen.getByText('BulkImportPage.startImport'));

    await waitFor(() => {
      expect(screen.getByText(/CSV validation failed\./)).toBeInTheDocument();
      expect(screen.getByText(/image_back/)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bulk-import/start',
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Import-Key': 'secret-key' },
      })
    );
  });

  it('polls status until completion after a successful submit', async () => {
    jest.useFakeTimers();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', total: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'processing',
          total: 2,
          processed: 1,
          succeeded: 1,
          failed: 0,
          errors: [],
          results: [{ row: 2, title: 'First listing', status: 'published' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'completed',
          total: 2,
          processed: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
          results: [
            { row: 2, title: 'First listing', status: 'published' },
            { row: 3, title: 'Second listing', status: 'published' },
          ],
        }),
      });

    window.localStorage.setItem('bulkImportApiKey', 'secret-key');

    render(<BulkImportPage />, { initialState: baseState });

    const zipInput = await screen.findByLabelText('BulkImportPage.zipLabel');
    const zipFile = new File(['fake zip content'], 'listings.zip', { type: 'application/zip' });
    fireEvent.change(zipInput, { target: { files: [zipFile] } });

    fireEvent.click(screen.getByText('BulkImportPage.startImport'));

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.processing')).toBeInTheDocument();
      expect(screen.getByText('BulkImportPage.resultsTitle')).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.completed')).toBeInTheDocument();
      expect(screen.getByText('BulkImportPage.newImport')).toBeInTheDocument();
      expect(screen.getByText('Second listing')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bulk-import/start',
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Import-Key': 'secret-key' },
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bulk-import/status/job-123',
      expect.objectContaining({
        headers: { 'X-Import-Key': 'secret-key' },
      })
    );
  });

  it('resets the form after a completed import', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123', total: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'completed',
          total: 1,
          processed: 1,
          succeeded: 1,
          failed: 0,
          errors: [],
          results: [{ row: 2, title: 'Imported listing', status: 'published' }],
        }),
      });

    window.localStorage.setItem('bulkImportApiKey', 'secret-key');

    render(<BulkImportPage />, { initialState: baseState });

    const zipInput = await screen.findByLabelText('BulkImportPage.zipLabel');
    const zipFile = new File(['fake zip content'], 'listings.zip', { type: 'application/zip' });
    fireEvent.change(zipInput, { target: { files: [zipFile] } });

    fireEvent.click(screen.getByText('BulkImportPage.startImport'));

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.newImport')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('BulkImportPage.newImport'));

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.startImport')).toBeInTheDocument();
      expect(screen.queryByText('Imported listing')).not.toBeInTheDocument();
    });
  });
});
