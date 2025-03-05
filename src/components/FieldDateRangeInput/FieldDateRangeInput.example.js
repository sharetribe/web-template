/* eslint-disable no-console */
import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { required, bookingDatesRequired, composeValidators } from '../../util/validators';
import { LINE_ITEM_NIGHT } from '../../util/types';
import { getStartOf } from '../../util/dates';
import { Button } from '../../components';
import FieldDateRangeInput from './FieldDateRangeInput';

const identity = v => v;

const FormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        style,
        form,
        handleSubmit,
        onChange,
        pristine,
        submitting,
        dateInputProps,
      } = fieldRenderProps;
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
          <FieldDateRangeInput {...dateInputProps} />
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
const startDatePlaceholderText = formatDate(new Date());
const endDatePlaceholderText = formatDate(getStartOf(new Date(), 'day', 'Etc/UTC', 1, 'days'));

export const Empty = {
  component: FormComponent,
  props: {
    style: { marginBottom: '140px' },
    dateInputProps: {
      name: 'bookingDates',
      isDaily: false,
      startDateId: 'EmptyDateRange.bookingStartDate',
      startDateLabel: 'Start date',
      startDatePlaceholderText: startDatePlaceholderText,
      endDateId: 'EmptyDateRangeInputForm.bookingEndDate',
      endDateLabel: 'End date',
      endDatePlaceholderText: endDatePlaceholderText,
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
      isDayBlocked: () => () => {
        return false;
      },
      isOutsideRange: () => () => {
        return false;
      },
    },
    onChange: formState => {
      const { startDate, endDate } = formState.values;
      if (startDate || endDate) {
        console.log('Changed to', formatDate(startDate), formatDate(startDate));
      }
    },
    onSubmit: values => {
      console.log('Submitting a form with values:', values);
    },
  },
  group: 'inputs',
};
