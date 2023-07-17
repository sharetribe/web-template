import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import * as validators from '../../util/validators';

import FieldBoolean from './FieldBoolean';

const { screen, userEvent } = testingLibrary;

const noop = () => {};

const FormComponent = props => (
  <FinalForm
    {...props}
    formId="test"
    render={fieldRenderProps => {
      const { formId, handleSubmit, invalid, pristine, submitting } = fieldRenderProps;
      const required = validators.requiredBoolean('This field is required');
      const submitDisabled = invalid || pristine || submitting;
      return (
        <form onSubmit={handleSubmit}>
          <FieldBoolean
            id={`${formId}.boolOption`}
            name="boolOption"
            label="Boolean option"
            placeholder="Choose yes/no"
            validate={required}
          />
          <button type="submit" disabled={submitDisabled}>
            Submit
          </button>
        </form>
      );
    }}
  />
);

describe('FieldBoolean', () => {
  it('matches snapshot', () => {
    const tree = render(<FormComponent onSubmit={noop} initialValues={{ boolOption: 'false' }} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('enables submit', () => {
    render(<FormComponent onSubmit={noop} />);

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(screen.getByRole('combobox')).toHaveValue('');
    userEvent.selectOptions(screen.getByRole('combobox'), 'true');
    expect(screen.getByRole('combobox')).toHaveValue('true');
    userEvent.selectOptions(screen.getByRole('combobox'), 'false');
    expect(screen.getByRole('combobox')).toHaveValue('false');
  });
});
