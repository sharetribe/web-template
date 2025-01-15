import React, { useState, useEffect } from 'react';

import classNames from 'classnames';
import { Field } from 'react-final-form';

import { RangeSlider } from '../../../components';

import css from './IntegerRangeFilter.module.css';

const RADIX = 10;

//  Ensures that the given values object has both minimum and maximum values.
//  If `values` does not include `minValue` or `maxValue`, defaults are applied.
const resolveMinMaxValues = (values, defaultMax, defaultMin) => {
  const { maxValue, minValue } = values || {};
  return {
    maxValue: maxValue != null ? maxValue : defaultMax,
    minValue: minValue != null ? minValue : defaultMin,
  };
};

const RangeInput = props => {
  const {
    input,
    min: defaultMinValue,
    max: defaultMaxValue,
    step,
    isInSideBar,
    initialValues,
  } = props;
  const { value: values = {}, onChange, name } = input;

  const currentValues = resolveMinMaxValues(initialValues[name], defaultMaxValue, defaultMinValue);
  const [fieldValues, setFieldValues] = useState(currentValues);

  useEffect(() => {
    setFieldValues(currentValues);
  }, [initialValues]);

  const handleMinValueChange = event => {
    const newValue = Number.parseInt(event.target.value, RADIX);
    if (isNaN(newValue)) {
      onChange({ ...fieldValues, minValue: defaultMinValue });
      return;
    }
    if (newValue > fieldValues.maxValue) {
      return;
    }
    if (newValue < defaultMinValue) {
      return;
    }

    const newValues = { ...fieldValues, minValue: newValue };
    setFieldValues(newValues);
    onChange(newValues);
  };

  const handleMaxValueChange = event => {
    const newValue = Number.parseInt(event.target.value, RADIX);
    if (isNaN(newValue)) {
      onChange({ ...fieldValues, maxValue: defaultMaxValue });
      return;
    }
    if (newValue < fieldValues.minValue) {
      return;
    }
    if (newValue > defaultMaxValue) {
      return;
    }

    const newValues = { ...fieldValues, maxValue: newValue };
    setFieldValues(newValues);
    onChange(newValues);
  };

  const handleSliderChange = updatedValue => {
    setFieldValues({ ...updatedValue });
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
            placeholder={defaultMinValue}
            value={fieldValues.minValue}
            onChange={event => handleMinValueChange(event, values.minValue)}
          ></input>
          <span className={css.valueSeparator}>-</span>
          <input
            className={classNames(css.maxValue, { [css.valueInSidebar]: isInSideBar })}
            type="number"
            min={defaultMinValue}
            max={defaultMaxValue}
            placeholder={defaultMaxValue}
            step={step}
            value={fieldValues.maxValue}
            onChange={handleMaxValueChange}
          ></input>
        </div>
      </div>
      <div className={css.sliderWrapper}>
        <RangeSlider
          min={defaultMinValue}
          max={defaultMaxValue}
          step={step}
          handles={[fieldValues.minValue, fieldValues.maxValue]}
          onChange={handles => {
            handleSliderChange({ minValue: handles[0], maxValue: handles[1] });
          }}
        />
      </div>
    </div>
  );
};

/**
 * FieldSelectIntegerRange component
 *
 * @component
 * @param {Object} props
 * @param {number} [props.min] - The minimum value
 * @param {number} [props.max] - The maximum value
 * @param {string} [props.name] - The name
 * @param {number} [props.step] - The step
 * @param {boolean} [props.isInSideBar] - Whether the filter is in the sidebar
 * @returns {JSX.Element}
 */
const FieldSelectIntegerRange = props => {
  const { max, min, name, step = 5, isInSideBar = false, ...rest } = props;
  return (
    <Field
      max={max}
      min={min}
      name={name}
      step={step}
      isInSideBar={isInSideBar}
      component={RangeInput}
      {...rest}
    />
  );
};

export default FieldSelectIntegerRange;
