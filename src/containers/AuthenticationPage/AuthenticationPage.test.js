import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { fakeIntl } from '../../util/testData';

import AuthenticationPage from './AuthenticationPage';

const { screen, waitFor, userEvent } = testingLibrary;

const noop = () => null;

const props = {
  tab: 'login',
  isAuthenticated: false,
  authInProgress: false,
  scrollingDisabled: false,
  onLogout: noop,
  onManageDisableScrolling: noop,
  onResendVerificationEmail: noop,
  submitLogin: noop,
  submitSignup: noop,
  sendVerificationEmailInProgress: false,

  location: { state: { from: '/protected' } },

  intl: fakeIntl,
};

describe('AuthenticationPage with SSO', () => {
  beforeEach(() => {
    // This is not defined by default on test env. AuthenticationPage needs it.
    window.scrollTo = jest.fn();
  });

  afterAll(() => {
    // Remove window.scrollTo
    jest.clearAllMocks();
  });

  it('has social login buttons on login tab when the env variables are in place', () => {
    // We want to make sure that during the test the env variables
    // for social logins are as we expect them to be
    process.env = Object.assign(process.env, { REACT_APP_FACEBOOK_APP_ID: 'test-fb' });
    process.env = Object.assign(process.env, { REACT_APP_GOOGLE_CLIENT_ID: 'test-google' });

    render(<AuthenticationPage {...props} />);

    expect(
      screen.getByRole('button', { name: 'AuthenticationPage.loginWithFacebook' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'AuthenticationPage.loginWithGoogle' })
    ).toBeInTheDocument();
  });
});
