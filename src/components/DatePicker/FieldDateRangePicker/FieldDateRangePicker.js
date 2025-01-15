/**
 * Provides a date range picker for Final Forms
 *
 *
 * NOTE: On mobile screens, this puts the input on read-only mode.
 * Trying to enter date string (ISO formatted or US) on mobile browsers is more confusing that just tapping a date.
 */

import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { getStartOf, isInRange } from '../../../util/dates';
import { ValidationError } from '../../../components';

import DateRangePicker from '../DatePickers/DateRangePicker';
import css from './FieldDateRangePicker.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 768;

const handleChange = (parentOnChange, fieldOnChange) => value => {
  const [startDate, endDate] = value;
  // If "onChange" callback is passed through the props,
  // it can notify the parent when the content of the input has changed.
  if (parentOnChange) {
    parentOnChange({ startDate, endDate });
  }
  // Notify Final Form that the input has changed.
  fieldOnChange({ startDate, endDate });
};

const FieldDateRangePickerComponent = props => {
  const {
    className,
    rootClassName,
    isDaily,
    startDateId,
    startDateLabel,
    endDateId,
    endDateLabel,
    input,
    onChange: parentOnChange,
    meta,
    useMobileMargins,
    isDayBlocked = day => false,
    isOutsideRange,
    ...rest
  } = props;

  if (startDateLabel && !startDateId) {
    throw new Error('startDateId required when a startDateLabel is given');
  }

  if (endDateLabel && !endDateId) {
    throw new Error('endDateId required when a endDateLabel is given');
  }

  // eslint-disable-next-line no-unused-vars
  const { onChange: fieldOnChange, type, checked, value, ...restOfInput } = input;
  const isDate = d => d instanceof Date && !isNaN(d);
  const { startDate, endDate } = value || {};
  const valueArray = [startDate, endDate].filter(d => isDate(d));

  const inputProps = {
    inputClassName: css.input,
    onChange: handleChange(parentOnChange, fieldOnChange),
    isDayBlocked: day => {
      return isOutsideRange(day) || isDayBlocked(day);
    },
    isDaily,
    minimumNights: isDaily ? 0 : 1,
    readOnly: typeof window !== 'undefined' && window.innerWidth < MAX_MOBILE_SCREEN_WIDTH,
    value: valueArray,
    ...restOfInput,
    ...rest,
    startDateId,
    endDateId,
  };
  const classes = classNames(rootClassName || css.fieldRoot, className, {
    [css.mobileMargins]: useMobileMargins,
  });

  return (
    <div className={classes}>
      {startDateLabel && endDateLabel ? (
        <div className={classNames(css.labels)}>
          <label className={classNames(css.startDateLabel)} htmlFor={startDateId}>
            {startDateLabel}
          </label>
          <label className={classNames(css.endDateLabel)} htmlFor={endDateId}>
            {endDateLabel}
          </label>
        </div>
      ) : null}

      <DateRangePicker {...inputProps} />
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

/**
 * A component that provides a date range picker for Final Forms.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} [props.isDaily] - Whether the date range is daily
 * @param {boolean} [props.useMobileMargins] - Whether to use mobile margins (allowing the input to expand to the full width of the screen)
 * @param {string} [props.endDateId] - The ID of the end date input
 * @param {string} [props.endDateLabel] - The label of the end date input
 * @param {string} [props.startDateId] - The ID of the start date input
 * @param {string} [props.startDateLabel] - The label of the start date input
 * @param {Function} [props.isOutsideRange] - The function to check if a day is outside the range
 * @param {number} [props.firstDayOfWeek] - The first day of the week (0-6, default to value set in configuration)
 * @returns {JSX.Element} FieldDateRangePicker component
 */
const FieldDateRangePicker = props => {
  const config = useConfiguration();
  const { isOutsideRange, firstDayOfWeek, ...rest } = props;

  // Outside range -><- today ... today+available days -1 -><- outside range
  const defaultIsOutSideRange = day => {
    const endOfRange = config.stripe?.dayCountAvailableForBooking;
    const start = getStartOf(new Date(), 'day');
    const end = getStartOf(start, 'day', null, endOfRange, 'days');
    return !isInRange(day, start, end, 'day');
  };
  const defaultFirstDayOfWeek = config.localization.firstDayOfWeek;

  return (
    <Field
      component={FieldDateRangePickerComponent}
      isOutsideRange={isOutsideRange || defaultIsOutSideRange}
      firstDayOfWeek={firstDayOfWeek || defaultFirstDayOfWeek}
      {...rest}
    />
  );
};

export default FieldDateRangePicker;
