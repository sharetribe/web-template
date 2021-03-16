import React from 'react';
import { PriceFilter } from '../../components';

import KeywordFilter from './KeywordFilter/KeywordFilter';
import BookingDateRangeFilter from './BookingDateRangeFilter/BookingDateRangeFilter';
import SelectSingleFilter from './SelectSingleFilter/SelectSingleFilter';
import SelectMultipleFilter from './SelectMultipleFilter/SelectMultipleFilter';

/**
 * FilterComponent is used to map configured filter types
 * to actual filter components
 */
const FilterComponent = props => {
  const {
    idPrefix,
    filterConfig,
    urlQueryParams,
    initialValues,
    getHandleChangedValueFn,
    ...rest
  } = props;
  const { id, type, queryParamNames, label, config } = filterConfig;
  const { liveEdit, showAsPopup } = rest;

  const useHistoryPush = liveEdit || showAsPopup;
  const prefix = idPrefix || 'SearchPage';
  const componentId = `${prefix}.${id.toLowerCase()}`;
  const name = id.replace(/\s+/g, '-').toLowerCase();

  switch (type) {
    case 'SelectSingleFilter': {
      return (
        <SelectSingleFilter
          id={componentId}
          label={label}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames)}
          onSelect={getHandleChangedValueFn(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    }
    case 'SelectMultipleFilter': {
      return (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    }
    case 'BookingDateRangeFilter': {
      return (
        <BookingDateRangeFilter
          id={componentId}
          label={label}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    }
    case 'PriceFilter': {
      return (
        <PriceFilter
          id={componentId}
          label={label}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    }
    case 'KeywordFilter':
      return (
        <KeywordFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...config}
          {...rest}
        />
      );
    default:
      return null;
  }
};

export default FilterComponent;
