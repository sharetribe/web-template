/* eslint-disable no-console */
import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { injectIntl } from '../../../util/reactIntl';
import { types as sdkTypes } from '../../../util/sdkLoader';
import { Button } from '../../../components';
import { required, bookingDateRequired, composeValidators } from '../../../util/validators';
import { LINE_ITEM_HOUR, TIME_SLOT_TIME } from '../../../util/types';
import FieldDateAndTimeInput from './FieldDateAndTimeInput';

const { UUID } = sdkTypes;

const identity = v => v;
const noop = () => {};

const options = { weekday: 'short', month: 'long', day: 'numeric' };
const placeholderText = new Intl.DateTimeFormat('en-US', options).format(new Date());

const startDateInputProps = {
  name: 'bookingStartDate',
  useMobileMargins: false,
  id: `EmptyDateInputForm.bookingStartDate`,
  label: 'Start Date',
  placeholderText,
  format: identity,
  validate: composeValidators(required('Required'), bookingDateRequired('Date is not valid')),
};

const endDateInputProps = {
  name: 'bookingEndDate',
  useMobileMargins: false,
  id: `EmptyDateInputForm.bookingEndDate`,
  label: 'End Date',
  placeholderText,
  format: identity,
  validate: composeValidators(required('Required'), bookingDateRequired('Date is not valid')),
};

const startTimeInputProps = {
  id: `EmptyDateInputForm.bookingStartDate`,
  name: 'bookingStartTime',
  label: 'Start Time',
};
const endTimeInputProps = {
  id: `EmptyDateInputForm.bookingEndDate`,
  name: 'bookingEndTime',
  label: 'End Time',
};

const today = new Date();
const currentYear = today.getUTCFullYear();
const m = today.getUTCMonth() + 1;
const currentMonth = m < 10 ? `0${m}` : m;

const timeSlots = [
  {
    id: new UUID(1),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T10:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(2),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T16:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T20:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(3),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-20T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-22T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(4),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-17T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-17T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(5),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-28T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth + 1}-03T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
];

const monthlyId = `${currentYear}-${currentMonth}`;
const monthlyTimeSlots = {
  [monthlyId]: {
    timeSlots,
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
  },
};

const FormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        style,
        form,
        handleSubmit,
        onChange,
        onFetchTimeSlots,
        pristine,
        submitting,
        startDateInputProps,
        endDateInputProps,
        timeZone,
        monthlyTimeSlots,
        values,
        intl,
        dayCountAvailableForBooking,
      } = fieldRenderProps;
      const submitDisabled = pristine || submitting;

      const dateInputProps = {
        startDateInputProps,
        endDateInputProps,
      };

      return (
        <form
          style={style}
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy onChange={onChange} />
          <FieldDateAndTimeInput
            {...dateInputProps}
            monthlyTimeSlots={monthlyTimeSlots}
            onFetchTimeSlots={onFetchTimeSlots}
            values={values}
            intl={intl}
            form={form}
            pristine={pristine}
            timeZone={timeZone}
            setSeatsOptions={noop}
            dayCountAvailableForBooking={dayCountAvailableForBooking}
          />
          <Button type="submit" disabled={submitDisabled} style={{ marginTop: '24px' }}>
            Select
          </Button>
        </form>
      );
    }}
  />
);

export const Empty = {
  component: injectIntl(FormComponent),
  props: {
    style: { marginBottom: '140px' },
    unitType: LINE_ITEM_HOUR,
    startDateInputProps,
    endDateInputProps,
    startTimeInputProps,
    endTimeInputProps,
    timeZone: 'Etc/UTC',
    monthlyTimeSlots,
    initialValues: {
      bookingStartDate: { date: new Date(Date.UTC(currentYear, today.getUTCMonth(), 14)) },
    },
    dayCountAvailableForBooking: 90,
    onChange: formState => {},
    onSubmit: values => {
      console.log('Submitting a form with values:', values);
    },
    onFetchTimeSlots: () => {
      console.log('Fetching timeSlots');
    },
  },
  group: 'inputs',
};
