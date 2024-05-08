import React, { useRef } from 'react';
import { arrayOf, bool, func, node, object, string } from 'prop-types';

import debounce from 'lodash/debounce';
import classNames from 'classnames';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';
import FieldSelectIntegerRange from './FieldSelectIntegerRange';

import { FormattedMessage } from '../../../util/reactIntl';
import css from './IntegerRangeFilter.module.css';

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

const IntegerRangeFilter = props => {
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
    name,
    showAsPopup,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const hasValue = value => value != null;

  // Extracts initial values for form from query parameters. If a valid query parameter exists, it converts
  // the string to an object using `convertQueryParamToObject`. If not, initializes as an empty object.
  const parsedInitialValues =
    initialValues && initialValues[queryParamNames]
      ? convertQueryParamToObject(initialValues[queryParamNames])
      : {};

  const { minValue, maxValue } = parsedInitialValues || {};
  const hasInitialValues = initialValues && hasValue(minValue) && hasValue(maxValue);

  const resolvedInitialValues = { [name]: hasInitialValues ? parsedInitialValues : {} };

  // Handles form submission by extracting and updating the range values from the form's current state.
  const handleSubmit = values => {
    const usedValue = values?.[name] ? values[name] : values;
    const { minValue, maxValue } = usedValue || {};

    return onSubmit(
      formatToQueryParam(
        {
          minValue: minValue,
          maxValue: maxValue,
        },
        queryParamNames
      )
    );
  };

  // We use useRef to create a mutable object that persists across renders without causing re-renders.
  // This is used as a flag to control whether debouncing should be applied.
  // Debouncing should only be applied when liveEdit is `true`, i.e. in the grid view, mobile view
  // or in the secondary filter view.
  const bypassDebounce = useRef(false);

  // A debounced version of the `handleSubmit` function to prevent excessive
  // or premature submissions during subsequent and rapid input changes.
  const handleSubmitOnLive = debounce(
    values => {
      // Check if debounce should be bypassed
      if (bypassDebounce.current) {
        bypassDebounce.current = false;
        return;
      }
      handleSubmit(values);
    },
    400,
    { leading: false, trailing: true }
  );

  // If we don't have a specific function here, there will be a delay when pressing clear
  const handleClear = values => {
    // Sets the bypass flag to true, instructing the debounced handleSubmit to skip its next invocation.
    bypassDebounce.current = true;
    handleSubmit(null);
  };

  // Used to display the selected values above the filter component in the "grid" view
  const labelSelectionForPlain = hasInitialValues ? (
    <FormattedMessage id="IntegerRangeFilter.labelSelectedPlain" values={{ minValue, maxValue }} />
  ) : null;

  return showAsPopup ? (
    <FilterPopup
      className={classes}
      rootClassName={rootClassName}
      label={label}
      isSelected={hasInitialValues}
      id={`${id}.popup`}
      onSubmit={handleSubmit}
      initialValues={resolvedInitialValues}
      {...rest}
    >
      <FieldSelectIntegerRange
        max={max}
        min={min}
        name={name}
        step={step}
        initialValues={resolvedInitialValues}
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
      onClear={handleClear}
      onSubmit={handleSubmitOnLive}
      initialValues={resolvedInitialValues}
      {...rest}
    >
      <FieldSelectIntegerRange
        isInSideBar
        max={max}
        min={min}
        name={name}
        step={step}
        initialValues={resolvedInitialValues}
      />
    </FilterPlain>
  );
};

IntegerRangeFilter.defaultProps = {
  rootClassName: null,
  className: null,
  showAsPopup: true,
  liveEdit: false,
  initialValues: null,
};

IntegerRangeFilter.propTypes = {
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

export default IntegerRangeFilter;
