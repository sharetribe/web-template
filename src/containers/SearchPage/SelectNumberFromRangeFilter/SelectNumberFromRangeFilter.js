import React, { useState, useEffect } from 'react';
import { Field } from 'react-final-form';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';
import { RangeSlider } from '../../../components';

import css from './SelectNumberFromRangeFilter.module.css';
import { number } from 'prop-types';

const RADIX = 10;
// **************************************************************************************************************************
// HELPERS

// Helper function to parse value for min handle
// Value needs to be between slider's minimum value and current maximum value
const parseMin = (min, currentMax) => value => {
  const parsedValue = Number.parseInt(value, 10);
  if (isNaN(parsedValue)) {
    return '';
  }
  return parsedValue < min ? min : parsedValue > currentMax ? currentMax : parsedValue;
};

// Helper function to parse value for max handle
// Value needs to be between slider's max value and current minimum value
const parseMax = (max, currentMin) => value => {
  const parsedValue = Number.parseInt(value, 10);
  if (isNaN(parsedValue)) {
    return '';
  }
  return parsedValue < currentMin ? currentMin : parsedValue > max ? max : parsedValue;
};


// Parse value, which should look like "0,1000"
const parse = priceRange => {
  const [minValue, maxValue] = !!priceRange
    ? priceRange.split(',').map(v => Number.parseInt(v, RADIX))
    : [];
  // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
  return !!priceRange && minValue != null && maxValue != null ? { minValue, maxValue } : null;
};

// Format value, which should look like { minPrice, maxPrice }
const format = (range, queryParamName) => {
  const { minValue, maxValue } = range || {};
  // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
  const value = minValue != null && maxValue != null ? `${minValue},${maxValue}` : null;
  return { [queryParamName]: value };
};

// ***********************************************************************************************************************
// MAIN CODE STARTS HERE

const rangeInput = props => {
  const { input, handles, min: defaultMinValue, max: defaultMaxValue, step, initialPrice, initialValues, ...rest } = props;
  const { onChange, ...inputProps } = input;
  const [values, setValue] = useState({
    minValue: initialValues ? initialValues.minValue : defaultMinValue, 
    maxValue: initialValues ? initialValues.maxValue : defaultMaxValue
  });

  // Should handle the scenario when the query params are fucked, i.e. min is larger than max
  const handleMinValueChange = event => {
    const newValue = parseMin(event.target.value, defaultMaxValue);

    if (newValue < defaultMinValue) {
      return;
    }

    const newValues = {...values, minValue: newValue}

    setValue(newValues)
    onChange(newValues);
  }

  const handleMaxValueChange = event => {
    const newValue = Number.parseInt(event.target.value, 10);

    if(newValue > defaultMaxValue) {
      return;
    }

    const newValues = {...values, maxValue: newValue}

    setValue(newValues);
    onChange(newValues);
  }

  const handleSliderChange = updatedValue => {
    setValue({...updatedValue});
    onChange({...updatedValue});
  }

  return (
    <div>
      <div className={css.contentWrapper}>
        <span className={css.label}>Range:</span>
        <input 
          type="number" 
          id='minval'
          min={defaultMinValue}  
          max={defaultMaxValue} 
          step={step} 
          value={values?.minValue} 
          onChange={handleMinValueChange}
          >
        </input>

        <span className={css.priceSeparator}>-</span>
        <input 
          id='maxval'
          type="number"
          min={defaultMinValue}  
          max={defaultMaxValue} 
          step={step} 
          value={values?.maxValue} 
          onChange={handleMaxValueChange}
          >
          </input>

      </div>
      <div className={css.sliderWrapper}>
        <RangeSlider
          min={defaultMinValue}
          max={defaultMaxValue}
          step={step}
          handles={[values.minValue, values.maxValue]}
          onChange={handles => {
            handleSliderChange({minValue: handles[0], maxValue: handles[1]})
          }}
        />
      </div>
    </div>
  )
}

const SelectNumberFromRangeFilter = props => {
  const { min, max, step, onSubmit, queryParamNames, initialValues, label } = props;

  const showAsPopup = true;
  const parsedInitialValues = initialValues && initialValues[queryParamNames]
      ? parse(initialValues[queryParamNames])
      : {};
  
  const hasValue = value => value != null;

  const { minValue, maxValue } = parsedInitialValues || {};

  const hasInitialValues = initialValues && hasValue(minValue) && hasValue(maxValue);

// This works
  const handleSubmit = values => {
    const { minValue: prevMinValue, maxValue: prevMaxValue, NumberRangeFilter, ...restValues } = values || {};
    const { minValue = prevMinValue, maxValue = prevMaxValue } = NumberRangeFilter || {};
    return onSubmit(
      format(
        {
          minValue: minValue === '' ? rest.min : minValue,
          maxValue: maxValue === '' ? rest.max : maxValue,
          ...restValues,
        },
        queryParamNames
      )
    );
  };
  
  return showAsPopup ? (
    <FilterPopup
      onSubmit={handleSubmit}
      initialValues={hasInitialValues ? parsedInitialValues : {minValue: min, maxValue: max}}
      label={label}
    >
      <Field
        name='NumberRangeFilter'
        component={rangeInput}
        min={min}
        max={max}
        step={step}
        initialValues={hasInitialValues ? parsedInitialValues : null}
      />
    </FilterPopup>
  ) : (
    <div>
      <FilterPlain></FilterPlain>
    </div>
  );
};

// SelectNumberFromRangeFilter.defaultProps = {
//     showAsPopup: false,
//   };

//   SelectNumberFromRangeFilter.propTypes = {
//     showAsPopup: bool,
//   };
// {/* <div className={css.contentWrapper}>
//         <span className={css.label}>Range:</span>
//         {/* <div className={css.inputsWrapper}> */}
//         <Field
//           // className={classNames(css.minPrice, { [css.priceInSidebar]: isInSideBar })}
//           className={css.minValue}
//           id={`${id}.minValue`}
//           name="minValue"
//           component="input"
//           type="number"
//           placeholder={min}
//           min={min}
//           max={max}
//           step={step}
//           parse={parseMin(min, max)}
//         />
//         <span className={css.priceSeparator}>-</span>
//         <Field
//           // className={classNames(css.maxPrice, { [css.priceInSidebar]: isInSideBar })}
//           className={css.maxValue}
//           id={`${id}.maxValue`}
//           name="maxValue"
//           component="input"
//           type="number"
//           placeholder={max}
//           min={min}
//           max={max}
//           step={step}
//           parse={parseMax(max, min)}
//         />
//         {/* </div> */}
//       </div>
//       <div className={css.sliderWrapper}>
//         <RangeSlider
//           min={min}
//           max={max}
//           step={step}
//           handles={[initialPrice.minValue, initialPrice.maxValue]}
//           onChange={handles => {
//             setInitialPrice({minValue: handles[0], maxValue: handles[1]})
//           }}
//         />
//       </div> */}

export default SelectNumberFromRangeFilter;

