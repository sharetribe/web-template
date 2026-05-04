import React from 'react';
import '@testing-library/jest-dom';
import { Form } from 'react-final-form';

import { fakeIntl } from '../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import TermsAndConditions from './TermsAndConditions';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

// TermsAndConditions uses react-final-form's Field, so it must be rendered inside a Form.
// Pass initialValues={{ terms: ['tos-and-privacy'] }} when you need the checkbox to start checked,
// bypassing the useEffect → input.onChange async cycle that doesn't flush cleanly in tests.
const renderComponent = (overrides = {}, formOptions = {}) => {
  const props = {
    onOpenTermsOfService: noop,
    onOpenPrivacyPolicy: noop,
    onTermsUnchecked: noop,
    tosAccepted: false,
    intl: fakeIntl,
    ...overrides,
  };
  return render(
    <Form
      onSubmit={noop}
      {...formOptions}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <TermsAndConditions {...props} />
        </form>
      )}
    />
  );
};

// Renders with the form field already set to accepted — simulates the post-useEffect state.
const renderChecked = (overrides = {}) =>
  renderComponent(
    { tosAccepted: true, ...overrides },
    { initialValues: { terms: ['tos-and-privacy'] } }
  );

describe('TermsAndConditions', () => {
  describe('rendering', () => {
    it('renders the T&C checkbox', () => {
      renderComponent();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders the accept text label', () => {
      renderComponent();
      // fakeIntl returns the message ID as the label text
      expect(
        screen.getByLabelText('AuthenticationPage.termsAndConditionsAcceptText')
      ).toBeInTheDocument();
    });

    it('checkbox is unchecked when tosAccepted is false', () => {
      renderComponent({ tosAccepted: false });
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('checkbox is checked when form field value is accepted', () => {
      // The useEffect in TermsInput calls input.onChange(['tos-and-privacy']) when tosAccepted=true.
      // We seed the form with that same value to test the render path without the async effect.
      renderChecked();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('click interactions — unchecked state', () => {
    it('clicking calls onOpenTermsOfService', async () => {
      const onOpenTermsOfService = jest.fn();
      const user = userEvent.setup();
      renderComponent({ tosAccepted: false, onOpenTermsOfService });

      await user.click(screen.getByRole('checkbox'));

      expect(onOpenTermsOfService).toHaveBeenCalledTimes(1);
    });

    it('clicking does not call onTermsUnchecked', async () => {
      const onTermsUnchecked = jest.fn();
      const user = userEvent.setup();
      renderComponent({ tosAccepted: false, onTermsUnchecked });

      await user.click(screen.getByRole('checkbox'));

      expect(onTermsUnchecked).not.toHaveBeenCalled();
    });
  });

  describe('click interactions — checked state', () => {
    it('clicking calls onTermsUnchecked', async () => {
      const onTermsUnchecked = jest.fn();
      const user = userEvent.setup();
      renderChecked({ onTermsUnchecked });

      await user.click(screen.getByRole('checkbox'));

      expect(onTermsUnchecked).toHaveBeenCalledTimes(1);
    });

    it('clicking does not call onOpenTermsOfService', async () => {
      const onOpenTermsOfService = jest.fn();
      const user = userEvent.setup();
      renderChecked({ onOpenTermsOfService });

      await user.click(screen.getByRole('checkbox'));

      expect(onOpenTermsOfService).not.toHaveBeenCalled();
    });
  });
});
