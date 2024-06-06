import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';

import TermsAndConditions from '../TermsAndConditions/TermsAndConditions';
import SignupForm from './SignupForm';

const { screen, fireEvent, userEvent } = testingLibrary;

const noop = () => null;

describe('SignupForm', () => {
  // Terms and conditions component passed in as props
  const termsAndConditions = (
    <TermsAndConditions onOpenTermsOfService={noop} onOpenPrivacyPolicy={noop} intl={fakeIntl} />
  );

  // // If snapshot testing is preferred, this could be used
  // // However, this form starts to be too big DOM structure to be snapshot tested nicely
  // it('matches snapshot', () => {
  //   const tree = render(
  //     <SignupForm intl={fakeIntl} termsAndConditions={termsAndConditions} onSubmit={noop} />
  //   );
  //   expect(tree.asFragment()).toMatchSnapshot();
  // });

  it('enables Sign up button when required fields are filled', () => {
    render(<SignupForm intl={fakeIntl} termsAndConditions={termsAndConditions} onSubmit={noop} />);

    // Test that sign up button is disabled at first
    expect(screen.getByRole('button', { name: 'SignupForm.signUp' })).toBeDisabled();

    // Type the values to the sign up form
    userEvent.type(
      screen.getByRole('textbox', { name: 'SignupForm.emailLabel' }),
      'joe@example.com'
    );
    userEvent.type(screen.getByRole('textbox', { name: 'SignupForm.firstNameLabel' }), 'Joe');
    userEvent.type(screen.getByRole('textbox', { name: 'SignupForm.lastNameLabel' }), 'Dunphy');
    userEvent.type(screen.getByLabelText('SignupForm.passwordLabel'), 'secret-password');

    // Test that sign up button is still disabled before clicking the checkbox
    expect(screen.getByRole('button', { name: 'SignupForm.signUp' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/AuthenticationPage.termsAndConditionsAcceptText/i));

    // Test that sign up button is enabled after typing the values
    expect(screen.getByRole('button', { name: 'SignupForm.signUp' })).toBeEnabled();
  });
});
