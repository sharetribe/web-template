import React, { useState } from 'react';
import { arrayOf, bool, func, node, object, string } from 'prop-types';

import debounce from 'lodash/debounce';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';
import RangeInput from './RangeInput';

import { FormattedMessage } from '../../../util/reactIntl';
import css from './SelectNumberFromRangeFilter.module.css';
import { parse } from 'url';

const RADIX = 10;

// Takes a single argument `valueRange`, expected to be a string that contains two numbers
// separated by a comma, e.g: "0,1000". It extracts an object containing the keys `minValue` and `maxValue`
// or null if the input is not valid. This function is used to convert query parameters into an object.
const convertQueryParamToObject = valueRange => {
  const [minValue, maxValue] = !!valueRange
    ? valueRange.split(',').map(v => Number.parseInt(v, RADIX))
    : [];
  // We explicitly compare `minValue` to null as comparing to '0' returns false but '0' is a valid range value.
  return !!valueRange && minValue != null && maxValue != null ? { minValue, maxValue } : null;
};

// Transforms a range object containing `minValue` and `maxValue`
// into query parameter format, i.e. "0,1000"
const formatToQueryParam = (range, queryParamName) => {
  const { minValue, maxValue } = range || {};
  // We explicitly compare `minValue` to null as comparing to '0' returns false but '0' is a valid range value.
  const value = minValue != null && maxValue != null ? `${minValue},${maxValue}` : null;
  return { [queryParamName]: value };
};

const SelectNumberFromRangeFilter = props => {
  const {
    min,
    max,
    step,
    onSubmit,
    queryParamNames,
    initialValues,
    label,
    rootClassName,
    className,
    intl,
    id,
    showAsPopup,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);


  // Extracts initial values for form from query parameters. If a valid query parameter exists, it converts
  // the string to an object using `convertQueryParamToObject`. If not, initializes as an empty object.
  const parsedInitialValues =
    initialValues && initialValues[queryParamNames]
      ? convertQueryParamToObject(initialValues[queryParamNames])
      : {};
    
  const { minValue, maxValue } = parsedInitialValues || {};
  const hasValue = value => value != null;
  const hasInitialValues = initialValues && hasValue(minValue) && hasValue(maxValue);

  // Handles form submission by extracting and updating the range values from the form's current state.
  const handleSubmit = values => {
    const { minValue: prevMinValue, maxValue: prevMaxValue, numberRangeInput, ...restValues } =
      values || {};
    const { minValue = prevMinValue, maxValue = prevMaxValue } = numberRangeInput || {};
    return onSubmit(
      formatToQueryParam(
        {
          minValue: minValue === '' ? rest.min : minValue,
          maxValue: maxValue === '' ? rest.max : maxValue,
          ...restValues,
        },
        queryParamNames
      )
    );
  };

  // Used to display the selected values above the filter component in the "grid" view
  const labelSelectionForPlain = hasInitialValues ? (
    <FormattedMessage id="RangeFilter.labelSelectedPlain" values={{ minValue, maxValue }} />
  ) : null;

  // A debounced version of the `handleSubmit` function to prevent excessive
  // or premature submissions during rapid input changes.
  const handleSubmitOnLive = debounce(
    values => {
      return handleSubmit(values);
    },
    400,
    { leading: false, trailing: true }
  );

  return showAsPopup ? (
    <FilterPopup
      className={classes}
      rootClassName={rootClassName}
      label={label}
      isSelected={hasInitialValues}
      id={`${id}.popup`}
      onSubmit={handleSubmit}
      initialValues={hasInitialValues ? parsedInitialValues : { minValue: min, maxValue: max }}
      {...rest}
    >
      <Field
        component={RangeInput}
        initialValues={hasInitialValues ? parsedInitialValues : null}
        max={max}
        min={min}
        name="numberRangeInput"
        step={step}
      />
    </FilterPopup>
  ) : (
    <FilterPlain
      className={classes}
      rootClassName={rootClassName}
      label={label}
      labelSelection={labelSelectionForPlain}
      labelSelectionSeparator=":"
      isSelected={hasInitialValues}
      id={`${id}.plain`}
      liveEdit
      onSubmit={handleSubmitOnLive}
      initialValues={hasInitialValues ? parsedInitialValues : { minValue: min, maxValue: max }}
      {...rest}
    >
      <Field
        component={RangeInput}
        initialValues={hasInitialValues ? parsedInitialValues : null}
        isInSideBar
        max={max}
        min={min}
        name="numberRangeInput"
        step={step}
      />
    </FilterPlain>
  );
};

SelectNumberFromRangeFilter.defaultProps = {
    rootClassName: null,
    className: null,
    showAsPopup: true,
    liveEdit: false,
    initialValues: null,
  };

  SelectNumberFromRangeFilter.propTypes = {
    rootClassName: string,
    className: string,
    id: string.isRequired,
    label: node,
    liveEdit: bool,
    queryParamNames: arrayOf(string).isRequired,
    onSubmit: func.isRequired,
    initialValues: object,
    showAsPopup: bool,
  };

export default SelectNumberFromRangeFilter;
