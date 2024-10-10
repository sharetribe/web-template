/**
 * Provides a single date picker for Final Forms
 *
 * NOTE: On mobile screens, this puts the input on read-only mode.
 * Trying to enter date string (ISO formatted or US) on mobile browsers is more confusing that just tapping a date.
 */

import React from 'react';
import { bool, func, object, string } from 'prop-types';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { getStartOf, isInRange } from '../../../util/dates';

import { ValidationError } from '../../../components';

import SingleDatePicker from '../DatePickers/SingleDatePicker';
import css from './FieldSingleDatePicker.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 768;

const handleChange = (parentOnChange, fieldOnChange) => value => {
  // If "onChange" callback is passed through the props,
  // it can notify the parent when the content of the input has changed.
  if (parentOnChange) {
    parentOnChange({ date: value });
  }
  // Notify Final Form that the input has changed.
  fieldOnChange({ date: value });
};

const FieldSingleDatePickerComponent = props => {
  const {
    className,
    rootClassName,
    id,
    label,
    showLabelAsDisabled,
    input,
    meta,
    useMobileMargins,
    showErrorMessage,
    onChange: parentOnChange,
    isDayBlocked = day => false,
    isOutsideRange,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const { onChange: fieldOnChange, type, checked, value, ...restOfInput } = input;
  const inputProps = {
    id,
    onChange: handleChange(parentOnChange, fieldOnChange),
    useMobileMargins,
    readOnly: typeof window !== 'undefined' && window.innerWidth < MAX_MOBILE_SCREEN_WIDTH,
    isDayBlocked: day => {
      return isOutsideRange(day) || isDayBlocked(day);
    },
    value: value?.date,
    ...restOfInput,
    ...rest,
  };

  const classes = classNames(rootClassName || css.fieldRoot, className);
  const errorClasses = classNames({ [css.mobileMargins]: useMobileMargins });

  return (
    <div className={classes}>
      {label ? (
        <label
          className={classNames({
            [css.mobileMargins]: useMobileMargins,
            [css.labelDisabled]: showLabelAsDisabled,
          })}
          htmlFor={id}
        >
          {label}
        </label>
      ) : null}
      <SingleDatePicker {...inputProps} />
      {showErrorMessage ? <ValidationError className={errorClasses} fieldMeta={meta} /> : null}
    </div>
  );
};

FieldSingleDatePickerComponent.defaultProps = {
  className: null,
  rootClassName: null,
  inputClassName: null,
  popupClassName: null,
  id: null,
  label: null,
  useMobileMargins: false,
  showErrorMessage: true,
  showLabelAsDisabled: false,
  placeholderText: null,
  onChange: null,
};

FieldSingleDatePickerComponent.propTypes = {
  className: string,
  rootClassName: string,
  inputClassName: string,
  popupClassName: string,
  id: string,
  label: string,
  useMobileMargins: bool,
  showErrorMessage: bool,
  showLabelAsDisabled: bool,
  placeholderText: string,
  input: object.isRequired,
  meta: object.isRequired,
  onChange: func,
};

const FieldSingleDatePicker = props => {
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
      component={FieldSingleDatePickerComponent}
      isOutsideRange={isOutsideRange || defaultIsOutSideRange}
      firstDayOfWeek={firstDayOfWeek || defaultFirstDayOfWeek}
      {...rest}
    />
  );
};

export default FieldSingleDatePicker;
