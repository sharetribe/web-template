import React from 'react';

import { listingFieldDisplayOverrides } from '../../config/configListingDisplay';
import GroupedEnumFilter from '../../containers/SearchPage/GroupedEnumFilter/GroupedEnumFilter';
import GroupedMultiSelectFilter from '../../containers/SearchPage/GroupedMultiSelectFilter/GroupedMultiSelectFilter';
import SelectMultipleFilter from '../../containers/SearchPage/SelectMultipleFilter/SelectMultipleFilter';

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
    if (filterType === 'ColorSwatchFilter' || key === 'color') {
      const queryParamNames = [constructQueryParamName(key, scope)];
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
