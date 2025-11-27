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
  const name = key.replace(/\s+/g, '-');
  const getAriaLabel = (label, values) => {
    const status = values ? 'active' : 'inactive';
    return intl.formatMessage(
      { id: 'SearchPage.screenreader.openFilterButton' },
      { label, status, values }
    );
  };

  // Default filters: price, keywords, dates
  switch (schemaType) {
    case 'category': {
      const { scope, isNestedEnum, nestedParams } = config;
      const queryParamNames = nestedParams?.map(p => constructQueryParamName(p, scope));
      const label = intl.formatMessage({ id: 'FilterComponent.categoryLabel' });

      return (
        <SelectSingleFilter
          name={key}
          label={label}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={convertCategoriesToSelectTreeOptions(listingCategories)}
          isNestedEnum={isNestedEnum}
          getAriaLabel={getAriaLabel}
          {...rest}
        />
      );
    }
    case 'listingType': {
      const { scope, options } = config;
      const paramNames = [constructQueryParamName(key, scope)];
      const label = intl.formatMessage({ id: 'FilterComponent.listingTypeLabel' });

      return (
        <SelectSingleFilter
          name={key}
          label={label}
          queryParamNames={[paramNames]}
          initialValues={initialValues(paramNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={options}
          getAriaLabel={getAriaLabel}
          {...rest}
        />
      );
    }
    case 'price': {
      const { min, max, step } = config;
      return (
        <PriceFilter
          name={key}
          label={intl.formatMessage({ id: 'FilterComponent.priceLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          min={min}
          max={max}
          step={step}
          marketplaceCurrency={marketplaceCurrency}
          getAriaLabel={getAriaLabel}
          {...rest}
        />
      );
    }
    case 'keywords':
      const label = intl.formatMessage({ id: 'FilterComponent.keywordsLabel' });

      return (
        <KeywordFilter
          label={label}
          name={name}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          getAriaLabel={getAriaLabel}
          {...rest}
        />
      );
    case 'dates': {
      const { dateRangeMode } = config;
      const isNightlyMode = dateRangeMode === 'night';
      return (
        <BookingDateRangeFilter
          label={intl.formatMessage({ id: 'FilterComponent.datesLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          minimumNights={isNightlyMode ? 1 : 0}
          getAriaLabel={getAriaLabel}
          {...rest}
        />
      );
    }
    case 'seats': {
      const label = intl.formatMessage({ id: 'FilterComponent.seatsLabel' });
      return (
        <SeatsFilter
          name={name}
          label={label}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          getAriaLabel={getAriaLabel}
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
          label={label}
          getAriaLabel={getAriaLabel}
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
          label={label}
          getAriaLabel={getAriaLabel}
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
          label={label}
          getAriaLabel={getAriaLabel}
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
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          min={minimum}
          max={maximum}
          step={step}
          getAriaLabel={getAriaLabel}
          {...rest}
        />
      );
    }
    default:
      return null;
  }
};

export default FilterComponent;
