import React from 'react';
import { createIntl, RawIntlProvider } from 'react-intl';

import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../util/test-data';
import TermsAndConditions from '../TermsAndConditions/TermsAndConditions';

import SignupForm from './SignupForm';

// In our use case it propably makes more sense to use translation keys
// in testing rather than actual translations.
// Other option could be to use default translations (e.g. en.json)
// but I think it's more likely that our customizers
// will update the translation values than translation keys
// so by using keys they don't need to update the test so much.
// (https://testing-library.com/docs/example-react-intl/#translated-components-testing-stategy)

// To do that, we can rely on react-intl default behaviour
// that it returns the translation id if the translation is not found.
// However, we don't want to print errors about this to console.
// That's why we can provide our own custom error handler to IntelProvider
// https://formatjs.io/docs/react-intl/api/#onerror
const testIntl = createIntl({ locale: 'en', onError: () => {} });

// Example for creating custom render function
// for using React Intl with RTL:
// https://testing-library.com/docs/example-react-intl#creating-a-custom-render-function
function render(ui, { ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return <RawIntlProvider value={testIntl}>{children}</RawIntlProvider>;
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

const noop = () => null;

describe('SignupForm', () => {
  // Terms and conditions component passed in as props
  const termsAndConditions = (
    <TermsAndConditions onOpenTermsOfService={noop} onOpenPrivacyPolicy={noop} intl={fakeIntl} />
  );

  // // If snapshot testing is preferred, this could be used
  // // However, this form starts to be too big DOM structure to be snapshot tested nicely
  // test('matches snapshot', () => {
  //   const tree = render(
  //     <SignupForm intl={fakeIntl} termsAndConditions={termsAndConditions} onSubmit={noop} />
  //   );
  //   expect(tree.asFragment()).toMatchSnapshot();
  // });

  test('Sign up button is enabled when required fields are filled', () => {
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
    userEvent.type(screen.getByLabelText('SignupForm.passwordLabel'), 'secret-joe');

    // Test that sign up button is still disabled before clicking the checkbox
    expect(screen.getByRole('button', { name: 'SignupForm.signUp' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/AuthenticationPage.termsAndConditionsAcceptText/i));

    // Test that sign up button is enabled after typing the values
    expect(screen.getByRole('button', { name: 'SignupForm.signUp' })).toBeEnabled();
  });
});
