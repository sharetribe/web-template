import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import * as validators from '../../util/validators';

import FieldSelectPopup from './FieldSelectPopup';

const { screen, userEvent } = testingLibrary;

const noop = () => {};

const FormComponent = props => (
  <FinalForm
    {...props}
    formId="test"
    render={fieldRenderProps => {
      const { formId, handleSubmit, invalid, pristine, submitting } = fieldRenderProps;
      const required = validators.required('This field is required');
      const submitDisabled = invalid || pristine || submitting;
      return (
        <form onSubmit={handleSubmit}>
          <FieldSelectPopup
            id={`${formId}.startTime`}
            name="startTime"
            label="Start time"
            validate={required}
          >
            <option disabled value="">
              Choose start time
            </option>
            <option value="09:00">9:00 AM</option>
            <option value="09:15">9:15 AM</option>
            <option value="09:30">9:30 AM</option>
          </FieldSelectPopup>
          <button type="submit" disabled={submitDisabled}>
            Submit
          </button>
        </form>
      );
    }}
  />
);

describe('FieldSelectPopup', () => {
  it('matches snapshot (closed, no value selected)', () => {
    const tree = render(<FormComponent onSubmit={noop} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('shows the placeholder on the trigger and no option list until clicked', () => {
    render(<FormComponent onSubmit={noop} />);

    // The trigger's accessible name comes from the <label for> association, not its own text
    // content, since buttons don't expose a separate "value" the way role=combobox does.
    // getByLabelText finds it the same way it would for a native <select>.
    const trigger = screen.getByLabelText('Start time');
    expect(trigger).toHaveTextContent('Choose start time');
    expect(screen.queryByText('9:15 AM')).not.toBeInTheDocument();
  });

  it('opens the option list when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} />);

    await user.click(screen.getByLabelText('Start time'));

    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('9:15 AM')).toBeInTheDocument();
    expect(screen.getByText('9:30 AM')).toBeInTheDocument();
  });

  it('selects an option, updates the trigger, closes the list, and enables submit', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} />);

    const trigger = screen.getByLabelText('Start time');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    await user.click(trigger);
    await user.click(screen.getByText('9:15 AM'));

    expect(trigger).toHaveTextContent('9:15 AM');
    expect(screen.queryByText('9:00 AM')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('shows a validation error once the field is touched and left empty', async () => {
    const user = userEvent.setup();
    render(<FormComponent onSubmit={noop} />);

    await user.click(screen.getByLabelText('Start time'));
    await user.tab();

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
