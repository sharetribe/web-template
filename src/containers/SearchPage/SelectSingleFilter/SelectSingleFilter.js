import React from 'react';
import { array, arrayOf, bool, func, node, number, object, string } from 'prop-types';
import classNames from 'classnames';

import { pickInitialValuesForFieldSelectTree } from '../../../util/search';

import { FieldSelectTree } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import css from './SelectSingleFilter.module.css';

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

const SelectSingleFilter = props => {
  const {
    rootClassName,
    className,
    showAsPopup,
    options,
    isNestedEnum,
    id,
    name,
    label,
    queryParamNames,
    initialValues,
    contentPlacementOffset,
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

SelectSingleFilter.defaultProps = {
  rootClassName: null,
  className: null,
  showAsPopup: false,
  initialValues: null,
  contentPlacementOffset: 0,
  isNestedEnum: false,
};

SelectSingleFilter.propTypes = {
  rootClassName: string,
  className: string,
  showAsPopup: bool,
  id: string.isRequired,
  name: string.isRequired,
  label: node.isRequired,
  queryParamNames: arrayOf(string).isRequired,
  options: array.isRequired,
  onSubmit: func.isRequired,
  initialValues: object,
  contentPlacementOffset: number,
  isNestedEnum: bool,
};

export default SelectSingleFilter;
