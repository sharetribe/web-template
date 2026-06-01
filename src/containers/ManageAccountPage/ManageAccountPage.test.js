import React from 'react';
import '@testing-library/jest-dom';

import { createCurrentUser } from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import ManageAccountPage from './ManageAccountPage';
import reducer, {
  deleteAccountThunk,
  resetPasswordThunk,
  updateProfileThunk,
  markAccountDeleted,
} from './ManageAccountPage.duck';

const { screen, waitFor } = testingLibrary;

const baseState = {
  ManageAccountPage: {
    deleteAccountError: null,
    deleteAccountInProgress: false,
    accountDeletionConfirmed: false,
    accountMarkedDeleted: false,
    resetPasswordInProgress: false,
    resetPasswordError: null,
    updateProfileInProgress: false,
    updateProfileError: null,
  },
  user: {
    currentUser: createCurrentUser('user-1'),
    currentUserHasListings: false,
    sendVerificationEmailInProgress: false,
  },
};

describe('ManageAccountPage', () => {
  it('renders the page heading', async () => {
    render(<ManageAccountPage />, { initialState: baseState });
    await waitFor(() => {
      expect(screen.getByText('ManageAccountPage.heading')).toBeInTheDocument();
    });
  });

  it('renders the DeleteAccountForm when current user has an id', async () => {
    render(<ManageAccountPage />, { initialState: baseState });
    await waitFor(() => {
      // DeleteAccountForm renders a password input
      expect(document.querySelector('input[type="password"]')).toBeTruthy();
    });
  });
});

describe('ManageAccountPage reducer', () => {
  const initial = reducer(undefined, { type: '@@INIT' });

  it('returns the documented initial state', () => {
    expect(initial).toEqual(baseState.ManageAccountPage);
  });

  it('markAccountDeleted flips accountMarkedDeleted', () => {
    const state = reducer(initial, markAccountDeleted());
    expect(state.accountMarkedDeleted).toBe(true);
  });

  it('deleteAccountThunk.pending sets deleteAccountInProgress', () => {
    const state = reducer(initial, { type: deleteAccountThunk.pending.type });
    expect(state.deleteAccountInProgress).toBe(true);
    expect(state.accountDeletionConfirmed).toBe(false);
  });

  it('deleteAccountThunk.fulfilled sets accountDeletionConfirmed', () => {
    const state = reducer(initial, { type: deleteAccountThunk.fulfilled.type });
    expect(state.deleteAccountInProgress).toBe(false);
    expect(state.accountDeletionConfirmed).toBe(true);
  });

  it('deleteAccountThunk.rejected stores the error payload', () => {
    const error = { type: 'error', name: 'bad', message: 'no' };
    const state = reducer(initial, {
      type: deleteAccountThunk.rejected.type,
      payload: error,
    });
    expect(state.deleteAccountInProgress).toBe(false);
    expect(state.deleteAccountError).toEqual(error);
  });

  it('resetPasswordThunk transitions', () => {
    const pending = reducer(initial, { type: resetPasswordThunk.pending.type });
    expect(pending.resetPasswordInProgress).toBe(true);
    const error = { type: 'error', name: 'bad', message: 'no' };
    const rejected = reducer(pending, {
      type: resetPasswordThunk.rejected.type,
      payload: error,
    });
    expect(rejected.resetPasswordInProgress).toBe(false);
    expect(rejected.resetPasswordError).toEqual(error);
  });

  it('updateProfileThunk transitions', () => {
    const pending = reducer(initial, { type: updateProfileThunk.pending.type });
    expect(pending.updateProfileInProgress).toBe(true);
    expect(pending.updateProfileError).toBeNull();
    const fulfilled = reducer(pending, { type: updateProfileThunk.fulfilled.type });
    expect(fulfilled.updateProfileInProgress).toBe(false);
  });
});
