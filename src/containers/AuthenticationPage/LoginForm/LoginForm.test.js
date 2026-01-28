import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';

import LoginForm from './LoginForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('LoginForm', () => {
  it('enables Log in button when required fields are filled', async () => {
    const user = userEvent.setup();
    render(<LoginForm intl={fakeIntl} onSubmit={noop} />);

    // Test that sign up button is disabled at first
    expect(screen.getByRole('button', { name: 'LoginForm.logIn' })).toBeDisabled();

    // Type the values to the sign up form
    await user.type(
      screen.getByRole('textbox', { name: 'LoginForm.emailLabel' }),
      'joe@example.com'
    );
    await user.type(screen.getByLabelText('LoginForm.passwordLabel'), 'secret-password');

    // Test that sign up button is enabled after typing the values
    expect(screen.getByRole('button', { name: 'LoginForm.logIn' })).toBeEnabled();
  });
});
