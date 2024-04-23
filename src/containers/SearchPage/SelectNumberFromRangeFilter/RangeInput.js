import React, { useState, useEffect } from 'react';
import { arrayOf, bool, func, node, object, string } from 'prop-types';

import classNames from 'classnames';

import { RangeSlider } from '../../../components';

import css from './SelectNumberFromRangeFilter.module.css';

const RADIX = 10;

// A higher-order function that takes two parameters, `min` and `currentMax`,
// and returns a new function that processes a `value` input. The function ensures
// that the returned value is within the range specified by `min` and `currentMax`.
// Used in the rangeSlider component to ensure that values fall between the provided range.
// The currentMax value is the upper limit selected through the slider.
const parseMin = (min, currentMax) => value => {
  const parsedValue = Number.parseInt(value, RADIX);
  if (isNaN(parsedValue)) {
    return '';
  }
  return parsedValue < min ? min : parsedValue > currentMax ? currentMax : parsedValue;
};

// A higher-order function that takes two parameters, `max` and `currentMin`,
// and returns a new function that processes a `value` input. The function ensures
// that the returned value is within the range specified by `max` and `currentMin`.
// Used in the rangeSlider component to ensure that values fall between the provided range.
// The currentMin value is the lower limit selected through the slider.
const parseMax = (max, currentMin) => value => {
  const parsedValue = Number.parseInt(value, RADIX);
  if (isNaN(parsedValue)) {
    return '';
  }
  return parsedValue < currentMin ? currentMin : parsedValue > max ? max : parsedValue;
};

const RangeInput = props => {
  const {
    input,
    handles,
    min: defaultMinValue,
    max: defaultMaxValue,
    step,
    initialValues,
    isInSideBar,
    ...rest
  } = props;
  const { onChange, ...inputProps } = input;

  const [values, setValues] = useState({
    minValue: initialValues ? initialValues.minValue : defaultMinValue,
    maxValue: initialValues ? initialValues.maxValue : defaultMaxValue,
  });

// useEffect hook to update state when initialValues changes
  useEffect(() => {
      setValues({
        minValue: initialValues ? initialValues.minValue : defaultMinValue,
        maxValue: initialValues ? initialValues.maxValue : defaultMaxValue
      });
  }, [initialValues]);

  const handleMinValueChange = event => {
    const parser = parseMin(defaultMinValue, values.maxValue);
    const newValue = parser(event.target.value);

    const newValues = { ...values, minValue: newValue };

    setValues(newValues);
    onChange(newValues);
  };

  const handleMaxValueChange = event => {
    const parser = parseMax(defaultMaxValue, values.minValue);
    const newValue = parser(event.target.value);

    const newValues = { ...values, maxValue: newValue };

    setValues(newValues);
    onChange(newValues);
  };

  const handleSliderChange = updatedValue => {
    setValues({ ...updatedValue });
    onChange({ ...updatedValue });
  };

  const classes = isInSideBar ? css.formWrapper : null;

  return (
    <div className={classes}>
      <div className={classNames(css.contentWrapper, { [css.contentWrapperSidebar]: isInSideBar })}>
        <div className={css.inputsWrapper}>
          {!isInSideBar ? <span className={css.labelPopup}>Range:</span> : null}
          <input
            className={classNames(css.minValue, { [css.valueInSidebar]: isInSideBar })}
            type="number"
            min={defaultMinValue}
            max={defaultMaxValue}
            step={step}
            value={values?.minValue}
            onChange={handleMinValueChange}
          ></input>
          <span className={css.valueSeparator}>-</span>
          <input
            className={classNames(css.maxValue, { [css.valueInSidebar]: isInSideBar })}
            type="number"
            min={defaultMinValue}
            max={defaultMaxValue}
            step={step}
            value={values?.maxValue}
            onChange={handleMaxValueChange}
          ></input>
        </div>
      </div>
      <div className={css.sliderWrapper}>
        <RangeSlider
          min={defaultMinValue}
          max={defaultMaxValue}
          step={step}
          handles={[values.minValue, values.maxValue]}
          onChange={handles => {
            handleSliderChange({ minValue: handles[0], maxValue: handles[1] });
          }}
        />
      </div>
    </div>
  );
};

export default RangeInput;
