import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import { FormattedDate } from '../../../../../util/reactIntl';
import * as validators from '../../../../../util/validators';
import { getDefaultTimeZoneOnBrowser } from '../../../../../util/dates';
import { Button } from '../../../../../components';

import FieldTimeZoneSelect from './FieldTimeZoneSelect';

const FormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const { form, handleSubmit, onChange, invalid, submitting } = fieldRenderProps;
      const required = validators.required('This field is required');
      const submitDisabled = invalid || submitting;
      const formState = form.getState();
      return (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} subscription={{ values: true, dirty: true }} />
          <FieldTimeZoneSelect
            id="timezone1"
            name="timezone1"
            label="Choose an option:"
            validate={required}
          />

          <div style={{ marginTop: 24 }}>
            <span>Current time in selected timezone:</span>
            <br />
            <FormattedDate
              value={new Date()}
              year="numeric"
              month="long"
              day="2-digit"
              hour="numeric"
              minute="numeric"
              timeZoneName="long"
              timeZone={formState.values.timezone1}
            />
          </div>
          <Button style={{ marginTop: 24 }} type="submit" disabled={submitDisabled}>
            Submit
          </Button>
        </form>
      );
    }}
  />
);

const timezone1 = typeof window === 'undefined' ? 'Europe/Helsinki' : getDefaultTimeZoneOnBrowser();
export const Select = {
  component: FormComponent,
  props: {
    initialValues: { timezone1 },
    onChange: formState => {
      if (formState.dirty && formState.values.timezone1) {
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
