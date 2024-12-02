import React from 'react';

// utils
import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_LONG } from '../../util/types';
import { convertCategoriesToSelectTreeOptions, constructQueryParamName } from '../../util/search';

// component imports
import SelectSingleFilter from './SelectSingleFilter/SelectSingleFilter';
import SelectMultipleFilter from './SelectMultipleFilter/SelectMultipleFilter';
import BookingDateRangeFilter from './BookingDateRangeFilter/BookingDateRangeFilter';
import KeywordFilter from './KeywordFilter/KeywordFilter';
import PriceFilter from './PriceFilter/PriceFilter';
import IntegerRangeFilter from './IntegerRangeFilter/IntegerRangeFilter';
import SeatsFilter from './SeatsFilter/SeatsFilter';

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
    listingCategories,
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
  const name = key.replace(/\s+/g, '-');

  // Default filters: price, keywords, dates
  switch (schemaType) {
    case 'category': {
      const { scope, isNestedEnum, nestedParams } = config;
      const queryParamNames = nestedParams?.map(p => constructQueryParamName(p, scope));
      return (
        <SelectSingleFilter
          id={componentId}
          name={key}
          label={intl.formatMessage({ id: 'FilterComponent.categoryLabel' })}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={convertCategoriesToSelectTreeOptions(listingCategories)}
          isNestedEnum={isNestedEnum}
          {...rest}
        />
      );
    }
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
    case 'seats': {
      return (
        <SeatsFilter
          id={componentId}
          name={name}
          label={intl.formatMessage({ id: 'FilterComponent.seatsLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...rest}
        />
      );
    }
  }

  // Custom extended data filters
  switch (schemaType) {
    case SCHEMA_TYPE_ENUM: {
      const { scope, enumOptions, filterConfig = {} } = config;
      const { label, filterType } = filterConfig;
      const queryParamNames = [constructQueryParamName(key, scope)];
      return filterType === 'SelectSingleFilter' ? (
        <SelectSingleFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
          isNestedEnum={false}
          {...rest}
        />
      ) : (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
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
          options={enumOptions}
          schemaType={schemaType}
          searchMode={searchMode}
          {...rest}
        />
      );
    }
    case SCHEMA_TYPE_LONG: {
      const { minimum, maximum, scope, step, filterConfig = {} } = config;
      const { label } = filterConfig;
      const queryParamNames = [constructQueryParamName(key, scope)];
      return (
        <IntegerRangeFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          min={minimum}
          max={maximum}
          step={step}
          {...rest}
        />
      );
    }
    default:
      return null;
  }
};

export default FilterComponent;
