/* eslint-disable no-console */
import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import * as validators from '../../util/validators';
import { Button } from '../../components';
import FieldSelectPopup from './FieldSelectPopup';

// A full day of 15-minute increments ("00:00"-"23:45"), large enough (96 options) to
// exercise the popup's capped-height scrollable list the same way real usage does.
const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const value = `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const label = `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  return { value, label };
});

const timeOptionElements = timeOptions.map(({ value, label }) => (
  <option value={value} key={value}>
    {label}
  </option>
));

const FormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const { form, handleSubmit, onChange, invalid, pristine, submitting } = fieldRenderProps;
      const required = validators.required('This field is required');
      const submitDisabled = invalid || pristine || submitting;
      return (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} />
          <FieldSelectPopup
            id="timeSelect1"
            name="timeSelect1"
            label="Choose a time:"
            validate={required}
          >
            <option value="">Choose a time</option>
            {timeOptionElements}
          </FieldSelectPopup>
          <Button style={{ marginTop: 24 }} type="submit" disabled={submitDisabled}>
            Submit
          </Button>
        </form>
      );
    }}
  />
);

export const TimeSelect = {
  component: FormComponent,
  props: {
    onChange: formState => {
      if (formState.values.timeSelect1) {
        console.log('form values changed to:', formState.values);
      }
    },
    onSubmit: values => {
      console.log('submit values:', values);
      return false;
    },
  },
  group: 'inputs',
};

const DisabledFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const { handleSubmit } = fieldRenderProps;
      return (
        <form onSubmit={handleSubmit}>
          <FieldSelectPopup id="timeSelect2" name="timeSelect2" label="Disabled:" disabled>
            <option value="">Choose a time</option>
            {timeOptionElements}
          </FieldSelectPopup>
        </form>
      );
    }}
  />
);

export const Disabled = {
  component: DisabledFormComponent,
  props: {
    onSubmit: () => false,
  },
  group: 'inputs',
};
