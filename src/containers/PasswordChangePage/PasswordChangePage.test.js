import React from 'react';
import '@testing-library/jest-dom';

import { createCurrentUser, fakeIntl } from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { PasswordChangePageComponent } from './PasswordChangePage';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('PasswordChangePageComponent', () => {
  it('Check that newPassword input shows error and submit is enabled if form is filled', () => {
    render(
      <PasswordChangePageComponent
        params={{ displayName: 'my-shop' }}
        history={{ push: noop }}
        location={{ search: '' }}
        scrollingDisabled={false}
        authInProgress={false}
        currentUser={createCurrentUser('user1')}
        isAuthenticated={false}
        onChange={noop}
        onLogout={noop}
        onManageDisableScrolling={noop}
        sendVerificationEmailInProgress={false}
        onResendVerificationEmail={noop}
        onSubmitChangePassword={noop}
        changePasswordInProgress={false}
        passwordChanged={false}
        intl={fakeIntl}
      />
    );

    const newPasswordLabel = 'PasswordChangeForm.newPasswordLabel';
    expect(screen.getByText(newPasswordLabel)).toBeInTheDocument();

    // Save button is disabled
    expect(screen.getByRole('button', { name: 'PasswordChangeForm.saveChanges' })).toBeDisabled();

    // There's a too short password, there is error text visible
    const newPasswordInput = screen.getByLabelText(newPasswordLabel);
    userEvent.type(newPasswordInput, 'short');
    newPasswordInput.blur();

    const passwordTooShort = 'PasswordChangeForm.passwordTooShort';
    expect(screen.getByText(passwordTooShort)).toBeInTheDocument();

    // There's a long enough password => there is no error text visible
    userEvent.type(newPasswordInput, 'morethan8characters');
    newPasswordInput.blur();
    expect(screen.queryByText(passwordTooShort)).not.toBeInTheDocument();

    const passwordLabel = 'PasswordChangeForm.passwordLabel';
    const passwordInput = screen.getByText(passwordLabel);
    expect(passwordInput).toBeInTheDocument();

    // Save button is enabled
    userEvent.type(passwordInput, 'somepasswordasoldpassword');
    expect(screen.queryByText(passwordTooShort)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PasswordChangeForm.saveChanges' })).toBeEnabled();
  });
});
