import React from 'react';

import { bool, object, number } from 'prop-types';

import classNames from 'classnames';

import { RangeSlider } from '../../../components';

import css from './SelectNumberFromRangeFilter.module.css';

const RADIX = 10;

//  Ensures that the given values object has both minimum and maximum values.
//  If `values` does not include `minValue` or `maxValue`, defaults are applied.
const resolveMinMaxValues = (values, defaultMax, defaultMin) => {
  const { maxValue, minValue } = values || {};
  return { maxValue: maxValue || defaultMax, minValue: minValue || defaultMin }
}

const RangeInput = props => {
  const {
    input,
    min: defaultMinValue,
    max: defaultMaxValue,
    step,
    isInSideBar
  } = props;
  const { value: values = {}, onChange } = input;

  const currentValues = resolveMinMaxValues(values, defaultMaxValue, defaultMinValue)

  const handleMinValueChange = event => {
    const newValue = Number.parseInt(event.target.value, RADIX);
    if (isNaN(newValue)) {
      onChange({...currentValues, minValue: defaultMinValue})
      return;
    }
    if (newValue > currentValues.maxValue) {
      return;
    }
    if (newValue < defaultMinValue) {
      return;
    }

    const newValues = { ...currentValues, minValue: newValue };

    onChange(newValues);
  };

  const handleMaxValueChange = event => {
    
    const newValue = Number.parseInt(event.target.value, RADIX);
    if (isNaN(newValue)) {
      onChange({...currentValues, maxValue: defaultMaxValue})
      return;
    }
    if (newValue < currentValues.minValue) {
      return;
    }
    if (newValue > defaultMaxValue) {
      return;
    }

    const newValues = { ...currentValues, maxValue: newValue };
    onChange(newValues);
  };

  const handleSliderChange = updatedValue => {
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
            value={currentValues.minValue}
            onChange={(event) => handleMinValueChange(event, values.minValue)}
          ></input>
          <span className={css.valueSeparator}>-</span>
          <input
            className={classNames(css.maxValue, { [css.valueInSidebar]: isInSideBar })}
            type="number"
            min={defaultMinValue}
            max={defaultMaxValue}
            placeholder={defaultMaxValue}
            step={step}
            value={currentValues.maxValue}
            onChange={handleMaxValueChange}
          ></input>
        </div>
      </div>
      <div className={css.sliderWrapper}>
        <RangeSlider
          min={defaultMinValue}
          max={defaultMaxValue}
          step={step}
          handles={[currentValues.minValue, currentValues.maxValue]}
          onChange={handles => {
            handleSliderChange({ minValue: handles[0], maxValue: handles[1] });
          }}
        />
      </div>
    </div>
  );
};

RangeInput.defaultProps = {
  input: null,
  min: null,
  max: null,
  step: 5,
  isInSideBar: false,
};

RangeInput.propTypes = {
  input: object,
  min: number,
  max: number,
  step: number,
  isInSideBar: bool.isRequired,
};

export default RangeInput;
