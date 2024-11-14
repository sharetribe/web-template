import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import { required, bookingDateRequired, composeValidators } from '../../../util/validators';
import { Button } from '../../../components';

import FieldSingleDatePicker from './FieldSingleDatePicker';

const TODAY = new Date();
const OVERMORROW = new Date(TODAY.getTime() + 2 * 24 * 60 * 60 * 1000);
const identity = v => v;

const options = { weekday: 'short', month: 'long', day: 'numeric' };
const formatDate = date => new Intl.DateTimeFormat('en-US', options).format(date);
const placeholderText = formatDate(TODAY);

const FormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        style,
        //form: formApi,
        handleSubmit,
        onChange,
        pristine,
        submitting,
        dateInputProps,
        values,
      } = formRenderProps;
      const submitDisabled = pristine || submitting;
      if (values && values.bookingDates) {
        onChange(values.bookingDates);
      }

      return (
        <form
          style={style}
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} />
          <FieldSingleDatePicker {...dateInputProps} />
          <Button type="submit" disabled={submitDisabled} style={{ marginTop: '24px' }}>
            Select
          </Button>
        </form>
      );
    }}
  />
);

export const Empty = {
  component: FormComponent,
  props: {
    style: { marginBottom: '140px' },
    dateInputProps: {
      name: 'bookingDate',
      useMobileMargins: false,
      id: `EmptyDateInputForm.bookingDate`,
      label: 'Date',
      placeholderText,
      format: identity,
      validate: composeValidators(required('Required'), bookingDateRequired('Date is not valid')),
      onBlur: () => console.log('onBlur called from DateInput props.'),
      onFocus: () => console.log('onFocus called from DateInput props.'),
    },
    onChange: formState => {
      const { date } = formState.values;
      if (date) {
        const formattedDate = formatDate(date);
        console.log('Changed to', formattedDate);
      }
    },
    onSubmit: values => {
      console.log('Submitting a form with values:', values);
    },
  },
  group: 'inputs',
};

export const InitialData = {
  component: FormComponent,
  props: {
    style: { marginBottom: '140px' },
    dateInputProps: {
      name: 'bookingDate',
      useMobileMargins: false,
      id: `EmptyDateInputForm.bookingDate`,
      label: 'Date',
      placeholderText,
      format: identity,
      validate: composeValidators(required('Required'), bookingDateRequired('Date is not valid')),
      onBlur: () => console.log('onBlur called from DateInput props.'),
      onFocus: () => console.log('onFocus called from DateInput props.'),
    },
    onChange: formState => {
      const { date } = formState.values;
      if (date) {
        const formattedDate = formatDate(date);
        console.log('Changed to', formattedDate);
      }
    },
    onSubmit: values => {
      console.log('Submitting a form with values:', values);
    },
    initialValues: {
      bookingDate: { date: OVERMORROW },
    },
  },
  group: 'inputs',
};
