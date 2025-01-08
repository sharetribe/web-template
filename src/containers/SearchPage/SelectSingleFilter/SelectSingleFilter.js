import React from 'react';
import classNames from 'classnames';

import { pickInitialValuesForFieldSelectTree } from '../../../util/search';

import { FieldSelectTree } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import css from './SelectSingleFilter.module.css';

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

/**
 * SelectSingleFilter component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id
 * @param {string} props.name - The name
 * @param {React.ReactNode} props.label - The label
 * @param {Array<string>} props.queryParamNames - The query param names
 * @param {Object} props.initialValues - The initial values
 * @param {Array<Object>} props.options - The options
 * @param {Function} props.onSubmit - The function to handle the submit
 * @param {boolean} [props.showAsPopup] - Whether to show as popup
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @param {boolean} [props.isNestedEnum] - Whether the enum is nested
 * @returns {JSX.Element}
 */
const SelectSingleFilter = props => {
  const {
    rootClassName,
    className,
    showAsPopup = false,
    options,
    isNestedEnum = false,
    id,
    name,
    label,
    queryParamNames,
    initialValues,
    contentPlacementOffset = 0,
    onSubmit,
    ...rest
  } = props;

  const queryParamName = getQueryParamName(queryParamNames);
  const hasInitialValues = !!initialValues && !!initialValues[queryParamName];

  const classes = classNames(rootClassName || css.root, className);
  const labelClass = hasInitialValues ? css.labelPlainSelected : css.labelPlain;
  const labelForPlain = <span className={labelClass}>{label}</span>;

  // Pass the initial values with the name key so that
  // they can be passed to the correct field
  const pickedInitialValues = { [name]: pickInitialValuesForFieldSelectTree(name, initialValues) };

  const handleSubmit = queryParamNames => values => {
    const isArray = Array.isArray(queryParamNames);
    const hasMultipleQueryParams = isArray && queryParamNames.length > 1;
    const hasSingleQueryParam = isArray && queryParamNames.length === 1;
    const firstQueryParamName = isArray ? queryParamNames[0] : queryParamNames;

    // Nested options create multiple query params
    //   - E.g. categoryLevel1: 'v1', categoryLevel2: 'v2', categoryLevel3: 'v3'
    // If there's only a single query param in use, we flatten the value
    //   - E.g. categoryLevel: 'value'
    const usedValue = hasMultipleQueryParams
      ? queryParamNames.reduce((acc, p, i) => {
          const k = `${name}${i + 1}`;
          const v = values?.[name]?.[k] || null;
          return { ...acc, [p]: v };
        }, {})
      : hasSingleQueryParam
      ? { [firstQueryParamName]: values?.[name]?.[`${name}1`] || null }
      : values;
    onSubmit(usedValue);
  };

  return showAsPopup ? (
    <FilterPopup
      className={classes}
      rootClassName={rootClassName}
      popupClassName={css.popupSize}
      label={label}
      isSelected={hasInitialValues}
      id={`${id}.popup`}
      showAsPopup
      contentPlacementOffset={contentPlacementOffset}
      onSubmit={handleSubmit(queryParamNames)}
      initialValues={pickedInitialValues}
      keepDirtyOnReinitialize
      {...rest}
    >
      <FieldSelectTree name={name} options={options} />
    </FilterPopup>
  ) : (
    <FilterPlain
      className={className}
      rootClassName={rootClassName}
      label={labelForPlain}
      isSelected={hasInitialValues}
      id={`${id}.plain`}
      liveEdit
      onSubmit={handleSubmit(queryParamNames)}
      initialValues={pickedInitialValues}
      {...rest}
    >
      <FieldSelectTree name={name} options={options} />
    </FilterPlain>
  );
};

export default SelectSingleFilter;
