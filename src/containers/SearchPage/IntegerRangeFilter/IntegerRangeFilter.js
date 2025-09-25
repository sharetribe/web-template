import React, { useRef } from 'react';

import debounce from 'lodash/debounce';
import classNames from 'classnames';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';
import FieldSelectIntegerRange from './FieldSelectIntegerRange';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
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
const hasValue = value => value != null;

// Extracts range values for form from query parameters. If a valid query parameter exists, it converts
// the string to an object using `convertQueryParamToObject`. If not, initializes as an empty object.
const getValidRangeValues = (queryParamNames, rangeParams, min, max) => {
  const parsedRangeValues = rangeParams?.[queryParamNames]
    ? convertQueryParamToObject(rangeParams[queryParamNames])
    : {};

  const { minValue, maxValue } = parsedRangeValues || {};
  const hasValidMinValue = hasValue(minValue) && minValue >= min;
  const hasValidMaxValue = hasValue(maxValue) && maxValue >= minValue && maxValue <= max;
  const hasRangeValues = rangeParams && hasValidMinValue && hasValidMaxValue;

  return hasRangeValues ? { minValue, maxValue } : {};
};

// Transforms a range object containing `minValue` and `maxValue`
// into query parameter format, i.e. "0,1000"
const formatToQueryParam = (range, queryParamName) => {
  const { minValue, maxValue } = range || {};
  // We explicitly compare `minValue` to null as comparing to '0' returns false but '0' is a valid range value.
  const value = minValue != null && maxValue != null ? `${minValue},${maxValue}` : null;
  return { [queryParamName]: value };
};

// Handles form submission by extracting and updating the range values from the form's current state.
const getHandleSubmit = (name, queryParamNames, onSubmit) => values => {
  const usedValue = values?.[name] ? values[name] : values;
  const { minValue, maxValue } = usedValue || {};
  // // We need to send API exclusive max value
  // // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
  // const exclusiveMax = maxValue + 1;

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

/**
 * IntegerRangeFilter component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.id - The ID
 * @param {string} props.name - The name
 * @param {React.Node} props.label - The label
 * @param {Array<string>} props.queryParamNames - The query param names
 * @param {Object} props.initialValues - The initial values
 * @param {boolean} [props.showAsPopup] - Whether to show the filter as a popup
 * @param {number} [props.min] - The minimum value
 * @param {number} [props.max] - The maximum value
 * @param {number} [props.step] - The step
 * @param {Function} props.onSubmit - The function to submit
 * @param {Function} [props.formatValidRangeValues] - Function to format validRangeValues for display
 * @param {Function} [props.getLabelForRangeInput] - Function to get the aria label for the range input
 * @returns {JSX.Element}
 */
const IntegerRangeFilter = props => {
  const intl = useIntl();
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
    id,
    name,
    showAsPopup = true,
    formatValidRangeValues,
    getLabelForRangeInput,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const handleSubmit = getHandleSubmit(name, queryParamNames, onSubmit);
  const validRangeValues = getValidRangeValues(queryParamNames, initialValues, min, max);
  const hasInitialValues = Object.keys(validRangeValues).length > 0;
  const resolvedInitialValues = { [name]: validRangeValues };

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
  const formattedRangeValues = formatValidRangeValues
    ? formatValidRangeValues(validRangeValues)
    : validRangeValues;
  const labelSelectionForPlain = hasInitialValues ? (
    <FormattedMessage id="IntegerRangeFilter.labelSelectedPlain" values={formattedRangeValues} />
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
        intl={intl}
        getLabelForRangeInput={getLabelForRangeInput}
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
        intl={intl}
        getLabelForRangeInput={getLabelForRangeInput}
      />
    </FilterPlain>
  );
};

export default IntegerRangeFilter;
