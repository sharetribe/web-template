import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { Button } from '../../components';
import FieldNumber from './FieldNumber';

const formName = 'Styleguide.FieldNumber.Form';

const FormComponent = props => (
  <FinalForm
    {...props}
    formId={formName}
    render={fieldRenderProps => {
      const { form, handleSubmit, onChange, invalid, pristine, submitting } = fieldRenderProps;

      const submitDisabled = invalid || pristine || submitting;

      return (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} subscription={{ values: true, dirty: true }} />
          <FieldNumber
            id="number-id1"
            name="number-id1"
            component="input"
            label="Select number between 1 and 20"
            minValue={1}
            maxValue={20}
          />

          <Button style={{ marginTop: 24 }} type="submit" disabled={submitDisabled}>
            Submit
          </Button>
        </form>
      );
    }}
  />
);

export const Number = {
  component: FormComponent,
  props: {
    onChange: formState => {
      if (Object.keys(formState.values).length > 0) {
        console.log('form values changed to:', formState.values);
      }
    },
    onSubmit: values => {
      console.log('Submit values of FieldNumber: ', values);
    },
  },
  group: 'inputs',
};
