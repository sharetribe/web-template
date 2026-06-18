import React from 'react';

import { listingFieldDisplayOverrides } from '../../config/configListingDisplay';
import BrandFilter from '../../containers/SearchPage/BrandFilter/BrandFilter';
import GroupedEnumFilter from '../../containers/SearchPage/GroupedEnumFilter/GroupedEnumFilter';
import GroupedMultiSelectFilter from '../../containers/SearchPage/GroupedMultiSelectFilter/GroupedMultiSelectFilter';
import SelectMultipleFilter from '../../containers/SearchPage/SelectMultipleFilter/SelectMultipleFilter';

// Listing-field keys for the individual per-region size enum filters that AV
// collapses into a single `grouped_sizes` parent filter.
const GROUPED_SIZE_KEYS = ['standard_sizes', 'us_sizes', 'mx_sizes', 'curvy_sizes'];

/**
 * Transform the available-filters list before it is rendered: collapse the
 * individual size enum filters (standard/us/mx/curvy) into a single
 * `grouped_sizes` parent filter, which `getAvFilter`'s grouped_enum branch
 * renders as one expander. Returns a new array and leaves the input untouched;
 * when no size filters are present it just returns the (compacted) list.
 *
 * @param {Array} availableFilters upstream-derived filter configs
 * @param {Object} intl react-intl instance (for the grouped filter label)
 * @returns {Array} filters with the size filters replaced by `grouped_sizes`
 */
export const injectAvFilters = (availableFilters = [], intl) => {
  const mutableFilters = [...availableFilters];
  const sizeFilters = [];
  mutableFilters.forEach((filter, idx) => {
    if (GROUPED_SIZE_KEYS.includes(filter?.key)) {
      sizeFilters.push({ ...filter });
      mutableFilters[idx] = null;
    }
  });

  if (sizeFilters.length > 0) {
    mutableFilters.splice(3, 0, {
      key: 'grouped_sizes',
      scope: 'public',
      schemaType: 'grouped_enum',
      filterConfig: {
        label: intl.formatMessage({ id: 'SearchPage.groupedSizesLabel' }),
        filterType: 'GroupedSelectMultipleFilter',
      },
      childFilters: sizeFilters,
    });
  }

  return mutableFilters.filter(Boolean);
};

/**
 * Try to render an AV-specific filter for the given schema type / config.
 *
 * Returns a JSX element when AV recognizes the case, or `null` to fall
 * through to upstream's default switch.
 */
export const getAvFilter = ({
  schemaType,
  key,
  config,
  componentId,
  prefix,
  name,
  liveEdit,
  useHistoryPush,
  initialValues,
  getHandleChangedValueFn,
  getAriaLabel,
  constructQueryParamName,
  rest,
}) => {
  // grouped_enum: parent expander wrapping multiple SelectMultipleFilters.
  if (schemaType === 'grouped_enum') {
    const { childFilters = [], filterConfig = {} } = config;
    if (filterConfig.filterType === 'GroupedSelectMultipleFilter') {
      return (
        <GroupedEnumFilter
          componentId={componentId}
          label={filterConfig.label}
          childFilters={childFilters}
          constructQueryParamName={constructQueryParamName}
          initialValues={initialValues}
          getHandleChangedValueFn={getHandleChangedValueFn}
          getAriaLabel={getAriaLabel}
          liveEdit={liveEdit}
          useHistoryPush={useHistoryPush}
          prefix={prefix}
          rest={rest}
        />
      );
    }
  }

  // multi-enum with `groupedMultiSelect` display override (e.g. all_sizes).
  if (schemaType === 'multi-enum') {
    const { scope, enumOptions, filterConfig = {} } = config;
    const { label, searchMode } = filterConfig;
    const queryParamNames = [constructQueryParamName(key, scope)];
    const displayOverride = listingFieldDisplayOverrides[key];
    const groups =
      displayOverride?.saveConfig?.inputType === 'groupedMultiSelect'
        ? displayOverride.saveConfig.groups
        : null;

    if (groups) {
      return (
        <GroupedMultiSelectFilter
          id={componentId}
          label={label}
          getAriaLabel={getAriaLabel}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          groups={groups}
          searchMode={searchMode}
          {...rest}
        />
      );
    }

    // Color-swatch decoration for upstream multi-enum filters (no other override).
    const { filterType } = filterConfig;
    if (filterType === 'ColorSwatchFilter' || key === 'color') {
      return (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          getAriaLabel={getAriaLabel}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
          schemaType={schemaType}
          searchMode={searchMode}
          useSwatches={true}
          {...rest}
        />
      );
    }
  }

  // enum with ColorSwatchFilter decoration.
  if (schemaType === 'enum') {
    const { scope, enumOptions, filterConfig = {} } = config;
    const { label, filterType } = filterConfig;
    const queryParamNames = [constructQueryParamName(key, scope)];

    // Brand: searchable list with scroll.
    if (key === 'brand') {
      return (
        <BrandFilter
          id={componentId}
          label={label}
          getAriaLabel={getAriaLabel}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
          {...rest}
        />
      );
    }

    if (filterType === 'ColorSwatchFilter' || key === 'color') {
      // For enum + color, upstream uses SelectMultipleFilter (single-pick swatch UI).
      return (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          getAriaLabel={getAriaLabel}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
          schemaType={schemaType}
          useSwatches={true}
          {...rest}
        />
      );
    }
  }

  return null;
};
