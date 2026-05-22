import React from 'react';
import '@testing-library/jest-dom';

// CustomLinksMenu fetches /static/data/top-bar.json in a useEffect (via fetchLocalTopbarData).
// Mock the whole component to prevent it from consuming global.fetch responses meant for tests.
jest.mock('../TopbarContainer/Topbar/TopbarDesktop/CustomLinksMenu/CustomLinksMenu', () => () =>
  null
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

  it('does not render or persist an import API key', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    await waitFor(() => {
      expect(screen.getByText('BulkImportPage.startImport')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('BulkImportPage.apiKeyLabel')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('bulkImportApiKey')).toBeNull();
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

  it('template link uses direct browser navigation (no fetch required)', async () => {
    render(<BulkImportPage />, { initialState: baseState });

    const link = await screen.findByText('BulkImportPage.downloadTemplate');
    expect(link.closest('a')).toHaveAttribute('href', '/api/bulk-import/template');
    expect(link.closest('a')).toHaveAttribute('download');
    // Template endpoint has no auth — browser navigates directly without fetch
    fireEvent.click(link);
    expect(global.fetch).not.toHaveBeenCalledWith('/api/bulk-import/template', expect.anything());
  });

  it('shows error when submitting without a ZIP file', async () => {
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
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, token: 'action-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'CSV validation failed.',
          details: ['Row 1: "image_back" is required.'],
        }),
      });

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
      '/api/bulk-import/authorize',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bulk-import/start',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Bulk-Import-Token': 'action-token' },
      })
    );
  });

  it('polls status until completion after a successful submit', async () => {
    jest.useFakeTimers();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, token: 'action-token' }),
      })
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
          results: [{ row: 1, title: 'First listing', status: 'published' }],
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
            { row: 1, title: 'First listing', status: 'published' },
            { row: 2, title: 'Second listing', status: 'published' },
          ],
        }),
      });

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
        credentials: 'include',
        headers: { 'X-Bulk-Import-Token': 'action-token' },
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bulk-import/status/job-123',
      expect.objectContaining({
        credentials: 'include',
        headers: { 'X-Bulk-Import-Token': 'action-token' },
      })
    );
  });

  it('resets the form after a completed import', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, token: 'action-token' }),
      })
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
          results: [{ row: 1, title: 'Imported listing', status: 'published' }],
        }),
      });

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
