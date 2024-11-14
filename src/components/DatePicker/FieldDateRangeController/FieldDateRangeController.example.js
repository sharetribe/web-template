/* eslint-disable no-console */
import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import { required, bookingDatesRequired, composeValidators } from '../../../util/validators';

import { Button } from '../../../components';

import FieldDateRangeController from './FieldDateRangeController';

const identity = v => v;

const FormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        style,
        handleSubmit,
        onChange,
        pristine,
        submitting,
        dateInputProps,
      } = formRenderProps;
      const submitDisabled = pristine || submitting;

      return (
        <form
          style={style}
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} />
          <FieldDateRangeController {...dateInputProps} />
          <Button type="submit" disabled={submitDisabled} style={{ marginTop: '24px' }}>
            Select
          </Button>
        </form>
      );
    }}
  />
);

const options = { weekday: 'short', month: 'long', day: 'numeric' };
const formatDate = date => new Intl.DateTimeFormat('en-US', options).format(date);

export const Empty = {
  component: FormComponent,
  props: {
    style: { marginBottom: '140px' },
    dateInputProps: {
      name: 'dates',
      format: identity,
      validate: composeValidators(
        required('Required'),
        bookingDatesRequired('Start date is not valid', 'End date is not valid')
      ),
      onBlur: () => console.log('onBlur called from DateRangeInput props.'),
      onFocus: () => console.log('onFocus called from DateRangeInput props.'),
      isBlockedBetween: () => {
        return false;
      },
      isDayBlocked: () => {
        return false;
      },
      isOutsideRange: () => {
        return false;
      },
    },
    onChange: formState => {
      const { startDate, endDate } = formState.values?.bookingDates || {};
      if (startDate || endDate) {
        console.log(
          'Changed to',
          startDate ? formatDate(startDate) : startDate,
          '-',
          endDate ? formatDate(endDate) : endDate
        );
      }
    },
    onSubmit: values => {
      console.log('Submitting a form with values:', values);
    },
  },
  group: 'inputs',
};
