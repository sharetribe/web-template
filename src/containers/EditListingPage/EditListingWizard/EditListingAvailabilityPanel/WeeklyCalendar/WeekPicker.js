import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import {
  getStartOf,
  isDateSameOrAfter,
  timeOfDayFromLocalToTimeZone,
} from '../../../../../util/dates';
import { MAX_AVAILABILITY_EXCEPTIONS_RANGE } from '../availability.helpers';

import {
  FieldDateRangeController,
  Form,
  InlineTextButton,
  OutsideClickHandler,
} from '../../../../../components';

import css from './WeekPicker.module.css';

const KEY_CODE_ESCAPE = 27;
const TODAY = new Date();

const nextMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
const prevMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, -1 * offset, 'months');
const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking, 'days');

const showNextMonthStepper = (currentMonth, dayCountAvailableForBooking, timeZone) => {
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return !isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone)
  );
};

const showPreviousMonthStepper = (currentMonth, timeZone) => {
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);
  return isDateSameOrAfter(prevMonthDate, currentMonthDate);
};

const PickerForm = props => {
  return (
    <FinalForm
      {...props}
      onSubmit={() => null}
      render={formRenderProps => {
        const { handleSubmit, children } = formRenderProps;

        return (
          <Form onSubmit={handleSubmit} tabIndex="0">
            <div>{children}</div>
          </Form>
        );
      }}
    />
  );
};

const handleKeyDown = setIsOpen => e => {
  // Gather all escape presses to close menu
  if (e.keyCode === KEY_CODE_ESCAPE) {
    setIsOpen(false);
  }
};

/**
 * A selector for a week.
 * Note: extra props are passed to FieldDateRangeController
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.label
 * @param {Date} props.date
 * @param {Function} props.onDateChange
 * @param {string} props.timeZone IANA time zone key
 * @param {Object?} props.initialValues
 * @param {Object?} props.initialValues.dates date range from the start of the week to its end
 * @returns {JSX.Element} containing a form that allows picking a specific week
 */
const WeekPicker = props => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(props.date);

  const {
    rootClassName,
    className,
    label,
    date,
    onDateChange,
    timeZone,
    initialValues,
    ...rest
  } = props;
  const onMonthClick = startOfMonth => {
    setCurrentMonth(startOfMonth);
  };
  const classes = classNames(rootClassName || css.root, className);
  const popupClasses = classNames(css.popup, { [css.isOpen]: isOpen });

  return (
    <OutsideClickHandler onOutsideClick={() => setIsOpen(false)}>
      <div className={classes} onKeyDown={handleKeyDown(setIsOpen)}>
        <InlineTextButton className={css.label} onClick={() => setIsOpen(prevState => !prevState)}>
          {label}
        </InlineTextButton>
        <div className={popupClasses}>
          {isOpen ? (
            <PickerForm initialValues={initialValues}>
              <FieldDateRangeController
                name="dates"
                minimumNights={6}
                onChange={({ startDate, endDate }) => {
                  onDateChange(startDate);
                  setIsOpen(false);
                }}
                showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
                showNextMonthStepper={showNextMonthStepper(
                  currentMonth,
                  MAX_AVAILABILITY_EXCEPTIONS_RANGE,
                  timeZone
                )}
                onMonthChange={date => {
                  const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
                  onMonthClick(localizedDate < currentMonth ? prevMonthFn : nextMonthFn);
                  setCurrentMonth(localizedDate);
                }}
                onClose={() => {
                  setCurrentMonth(startDate || endDate || startOfToday);
                }}
                {...rest}
              />
            </PickerForm>
          ) : null}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default WeekPicker;
