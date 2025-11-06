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

const isTooSmall = (x, limit) => x < limit;
const isTooBig = (x, limit) => x > limit;
const isValidMin = (minValue, minLimit, maxValue) => {
  return (
    Number.isInteger(minValue) && !isTooSmall(minValue, minLimit) && !isTooBig(minValue, maxValue)
  );
};
const isValidMax = (maxValue, maxLimit, minValue) => {
  return (
    Number.isInteger(maxValue) && !isTooBig(maxValue, maxLimit) && !isTooSmall(maxValue, minValue)
  );
};

const getValidHandles = (currentValues, inputValues, minLimit, maxLimit) => {
  const isMinUpdated = currentValues.minValue !== inputValues.minValue;
  const isMaxUpdated = currentValues.maxValue !== inputValues.maxValue;

  if (isMinUpdated && isMaxUpdated) {
    const { minValue, maxValue } = inputValues;
    const inRange = !(isTooSmall(minValue, minLimit) || isTooBig(maxValue, maxLimit));
    // If both values are changed and are within bounds, return the new values. Otherwise, return the default values.
    return inRange && minValue <= maxValue ? [minValue, maxValue] : [minLimit, maxLimit];
  }

  const { minValue, maxValue } = inputValues;
  const validMin = !isMinUpdated
    ? currentValues.minValue
    : !Number.isInteger(minValue)
    ? minLimit
    : isTooSmall(minValue, minLimit)
    ? minLimit
    : isTooBig(minValue, maxValue)
    ? maxValue
    : minValue;
  const validMax = !isMaxUpdated
    ? currentValues.maxValue
    : !Number.isInteger(maxValue)
    ? maxLimit
    : isTooBig(maxValue, maxLimit)
    ? maxLimit
    : isTooSmall(maxValue, minValue)
    ? minValue
    : maxValue;

  return [validMin, validMax];
};

const RangeInput = props => {
  const {
    input,
    min: defaultMinValue,
    max: defaultMaxValue,
    step,
    isInSideBar,
    initialValues,
    intl,
    getLabelForRangeInput,
  } = props;
  const { value: values = {}, onChange, name } = input;

  const currentValues = resolveMinMaxValues(initialValues[name], defaultMaxValue, defaultMinValue);
  const [fieldValues, setFieldValues] = useState(currentValues);

  useEffect(() => {
    setFieldValues(currentValues);
  }, [initialValues]);

  const handleMinValueChange = event => {
    const newValue = Number.parseInt(event.target.value, RADIX);

    // Faulty mode: new min value is not an integer
    if (!Number.isInteger(newValue)) {
      const newValues = { ...fieldValues, minValue: '' };
      setFieldValues(newValues);
      return;
    }

    // Faulty mode: new min value is greater than the current max value or
    //              new min value is less than the default min value
    if (newValue > fieldValues.maxValue || newValue < defaultMinValue) {
      const newValues = { ...fieldValues, minValue: newValue };
      setFieldValues(newValues);
      return;
    }

    const newValues =
      newValue < defaultMinValue
        ? { ...fieldValues, minValue: defaultMinValue }
        : { ...fieldValues, minValue: newValue };
    setFieldValues(newValues);
    onChange(newValues);
  };

  const handleMaxValueChange = event => {
    const newValue = Number.parseInt(event.target.value, RADIX);

    // Faulty mode: new min value is not an integer
    if (!Number.isInteger(newValue)) {
      const newValues = { ...fieldValues, maxValue: '' };
      setFieldValues(newValues);
      return;
    }

    // Faulty mode: new max value is less than the current min value or
    //              new max value is greater than the default max value
    if (newValue < fieldValues.minValue || newValue > defaultMaxValue) {
      const newValues = { ...fieldValues, maxValue: newValue };
      setFieldValues(newValues);
      return;
    }

    const newValues =
      newValue > defaultMaxValue
        ? { ...fieldValues, maxValue: defaultMaxValue }
        : { ...fieldValues, maxValue: newValue };
    setFieldValues(newValues);
    onChange(newValues);
  };

  const handleMinValueBlur = event => {
    const inputValue = Number.parseInt(event.target.value, RADIX);
    if (
      !Number.isInteger(inputValue) ||
      inputValue < defaultMinValue ||
      inputValue > values.maxValue
    ) {
      const newValues = { ...fieldValues, minValue: defaultMinValue };
      setFieldValues(newValues);
      onChange(newValues);
    }
  };
  const handleMaxValueBlur = event => {
    const inputValue = Number.parseInt(event.target.value, RADIX);
    if (
      !Number.isInteger(inputValue) ||
      inputValue < values.minValue ||
      inputValue > defaultMaxValue
    ) {
      const newValues = { ...fieldValues, maxValue: defaultMaxValue };
      setFieldValues(newValues);
      onChange(newValues);
    }
  };

  const handleSliderChange = updatedValue => {
    setFieldValues({ ...updatedValue });
    onChange({ ...updatedValue });
  };

  const labelForRangeInput = getLabelForRangeInput
    ? getLabelForRangeInput
    : (value, handleName) =>
        intl.formatMessage(
          { id: 'IntegerRangeFilter.screenreader.rangeHandle' },
          { value, handle: handleName }
        );

  const getHandleLabels = handles => {
    const multipleHandles = handles.length > 1;
    return handles.map((h, idx) => {
      const handleName =
        multipleHandles && idx === 0
          ? 'min'
          : multipleHandles && idx === handles.length - 1
          ? 'max'
          : 'handle';
      return labelForRangeInput(h, handleName);
    });
  };

  const isMinInvalid = !isValidMin(fieldValues.minValue, defaultMinValue, fieldValues.maxValue);
  const isMaxInvalid = !isValidMax(fieldValues.maxValue, defaultMaxValue, fieldValues.minValue);
  const classes = isInSideBar ? css.formWrapper : null;

  const validHandles = getValidHandles(values, fieldValues, defaultMinValue, defaultMaxValue);

  return (
    <div className={classes}>
      <div className={classNames(css.contentWrapper, { [css.contentWrapperSidebar]: isInSideBar })}>
        <div className={css.inputsWrapper}>
          {!isInSideBar ? (
            <span className={css.labelPopup}>
              {intl.formatMessage({ id: 'IntegerRangeFilter.rangeInputsLabel' })}
            </span>
          ) : null}
          <input
            className={classNames(css.minValue, {
              [css.valueInSidebar]: isInSideBar,
              [css.invalidInput]: isMinInvalid,
            })}
            type="number"
            name={`${name}_min`}
            min={defaultMinValue}
            max={defaultMaxValue}
            step={step}
            placeholder={defaultMinValue}
            value={fieldValues.minValue}
            onChange={handleMinValueChange}
            onBlur={handleMinValueBlur}
            aria-valuenow={fieldValues.minValue}
            aria-valuetext={labelForRangeInput(fieldValues.minValue, 'min')}
            aria-valuemin={defaultMinValue}
            aria-valuemax={defaultMaxValue}
            aria-label={labelForRangeInput(fieldValues.minValue, 'min')}
          ></input>
          <span className={css.valueSeparator}>-</span>
          <input
            className={classNames(css.maxValue, {
              [css.valueInSidebar]: isInSideBar,
              [css.invalidInput]: isMaxInvalid,
            })}
            type="number"
            name={`${name}_max`}
            min={defaultMinValue}
            max={defaultMaxValue}
            placeholder={defaultMaxValue}
            step={step}
            value={fieldValues.maxValue}
            onChange={handleMaxValueChange}
            onBlur={handleMaxValueBlur}
            aria-valuenow={fieldValues.maxValue}
            aria-valuetext={labelForRangeInput(fieldValues.maxValue, 'max')}
            aria-valuemin={defaultMinValue}
            aria-valuemax={defaultMaxValue}
            aria-label={labelForRangeInput(fieldValues.maxValue, 'max')}
          ></input>
        </div>
      </div>
      <div className={css.sliderWrapper}>
        <RangeSlider
          min={defaultMinValue}
          max={defaultMaxValue}
          ariaLabels={getHandleLabels(validHandles)}
          step={step}
          handles={validHandles}
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
