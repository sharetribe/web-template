import React from 'react';

import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM } from '../../util/types';
import { constructQueryParamName } from './SearchPage.shared';
import SelectSingleFilter from './SelectSingleFilter/SelectSingleFilter';
import SelectMultipleFilter from './SelectMultipleFilter/SelectMultipleFilter';
import BookingDateRangeFilter from './BookingDateRangeFilter/BookingDateRangeFilter';
import KeywordFilter from './KeywordFilter/KeywordFilter';
import PriceFilter from './PriceFilter/PriceFilter';

// Helper: get enumOptions in a format that works as query parameter
const createFilterOptions = options => options.map(o => ({ key: `${o.option}`, label: o.label }));

/**
 * FilterComponent is used to map configured filter types
 * to actual filter components
 */
const FilterComponent = props => {
  const {
    idPrefix,
    config,
    urlQueryParams,
    initialValues,
    getHandleChangedValueFn,
    marketplaceCurrency,
    intl,
    ...rest
  } = props;
  // Note: config can be either
  // - listingFields config or
  // - default filter config
  // They both have 'key' and 'schemaType' included.
  const { key, schemaType } = config;
  const { liveEdit, showAsPopup } = rest;

  const useHistoryPush = liveEdit || showAsPopup;
  const prefix = idPrefix || 'SearchPage';
  const componentId = `${prefix}.${key.toLowerCase()}`;
  const name = key.replace(/\s+/g, '-').toLowerCase();

  // Default filters: price, keywords, dates
  switch (key) {
    case 'price': {
      const { min, max, step } = config;
      return (
        <PriceFilter
          id={componentId}
          label={intl.formatMessage({ id: 'FilterComponent.priceLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          min={min}
          max={max}
          step={step}
          marketplaceCurrency={marketplaceCurrency}
          {...rest}
        />
      );
    }
    case 'keywords':
      return (
        <KeywordFilter
          id={componentId}
          label={intl.formatMessage({ id: 'FilterComponent.keywordsLabel' })}
          name={name}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...rest}
        />
      );
    case 'dates': {
      const { dateRangeMode } = config;
      const isNightlyMode = dateRangeMode === 'night';
      return (
        <BookingDateRangeFilter
          id={componentId}
          label={intl.formatMessage({ id: 'FilterComponent.datesLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          minimumNights={isNightlyMode ? 1 : 0}
          {...rest}
        />
      );
    }
  }

  // Custom extended data filters
  switch (schemaType) {
    case SCHEMA_TYPE_ENUM: {
      const { scope, enumOptions, filterConfig = {} } = config;
      const queryParamNames = [constructQueryParamName(key, scope)];
      return filterConfig.filterType === 'SelectSingleFilter' ? (
        <SelectSingleFilter
          id={componentId}
          label={filterConfig.label}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSelect={getHandleChangedValueFn(useHistoryPush)}
          options={createFilterOptions(enumOptions)}
          {...rest}
        />
      ) : (
        <SelectMultipleFilter
          id={componentId}
          label={filterConfig.label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={createFilterOptions(enumOptions)}
          schemaType={schemaType}
          {...rest}
        />
      );
    }
    case SCHEMA_TYPE_MULTI_ENUM: {
      const { scope, enumOptions, filterConfig = {} } = config;
      const { label, searchMode } = filterConfig;
      const queryParamNames = [constructQueryParamName(key, scope)];
      return (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={createFilterOptions(enumOptions)}
          schemaType={schemaType}
          searchMode={searchMode}
          {...rest}
        />
      );
    }
    default:
      return null;
  }
};

export default FilterComponent;
