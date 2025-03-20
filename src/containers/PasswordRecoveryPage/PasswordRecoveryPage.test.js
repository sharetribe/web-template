import React, { act } from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { PasswordRecoveryPageComponent } from './PasswordRecoveryPage';

const { screen, userEvent, waitFor } = testingLibrary;

const noop = () => null;

describe('PasswordRecoveryPageComponent', () => {
  it('Check that email input shows error and submit is enabled if form is filled', async () => {
    render(
      <PasswordRecoveryPageComponent
        params={{ displayName: 'my-shop' }}
        history={{ push: noop }}
        location={{ search: '' }}
        scrollingDisabled={false}
        authInProgress={false}
        isAuthenticated={false}
        onLogout={noop}
        onManageDisableScrolling={noop}
        sendVerificationEmailInProgress={false}
        onResendVerificationEmail={noop}
        recoveryInProgress={false}
        passwordRequested={false}
        onChange={noop}
        onSubmitEmail={noop}
        onRetypeEmail={noop}
        intl={fakeIntl}
      />
    );

    const emailLabel = 'PasswordRecoveryForm.emailLabel';
    const emailInput = screen.getByLabelText(emailLabel);
    expect(emailInput).toBeInTheDocument();

    // Save button is disabled
    expect(
      screen.getByRole('button', { name: 'PasswordRecoveryForm.sendInstructions' })
    ).toBeDisabled();

    await act(async () => {
      // There's a too short password, there is error text visible
      userEvent.type(emailInput, 'foobar');
      emailInput.blur();
    });
    const emailInvalid = 'PasswordRecoveryForm.emailInvalid';
    expect(screen.getByText(emailInvalid)).toBeInTheDocument();

    await act(async () => {
      // There's a valid email written to input => there is no error text visible
      userEvent.type(emailInput, '@bar.com');
      emailInput.blur();
    });
    expect(screen.queryByText(emailInvalid)).not.toBeInTheDocument();

    // Save button is enabled
    expect(
      screen.getByRole('button', { name: 'PasswordRecoveryForm.sendInstructions' })
    ).toBeEnabled();
  });
});
