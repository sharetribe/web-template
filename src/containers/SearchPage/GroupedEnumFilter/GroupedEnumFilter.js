import React, { useState } from 'react';
import classNames from 'classnames';

import SelectMultipleFilter from '../SelectMultipleFilter/SelectMultipleFilter';
import IconPlus from '../IconPlus/IconPlus';
import FilterPlainCss from '../FilterPlain/FilterPlain.module.css';

/**
 * GroupedEnumFilter — AV filter that renders a parent labeled section that
 * expands to show a stack of `SelectMultipleFilter`s, one per child filter
 * config. Used when a `grouped_enum` schema type appears with
 * `filterConfig.filterType === 'GroupedSelectMultipleFilter'`.
 *
 * Props match what FilterComponent already passes plus `childFilters` and the
 * pre-resolved component-id prefix.
 */
const GroupedEnumFilter = props => {
  const {
    componentId,
    label,
    childFilters,
    constructQueryParamName,
    initialValues,
    getHandleChangedValueFn,
    getAriaLabel,
    liveEdit,
    useHistoryPush,
    prefix,
    rest = {},
  } = props;

  const [isOpen, setOpened] = useState(false);
  const toggleIsOpen = () => setOpened(!isOpen);

  return (
    <div className={FilterPlainCss.root}>
      <button className={FilterPlainCss.labelButton} onClick={toggleIsOpen}>
        <span className={FilterPlainCss.labelButtonContent}>
          <span className={FilterPlainCss.labelWrapper}>
            <span className={FilterPlainCss.label}>{label}</span>
          </span>
          <span className={FilterPlainCss.openSign}>
            <IconPlus isOpen={isOpen} isSelected={true} />
          </span>
        </span>
      </button>

      <div
        id={componentId}
        className={classNames(FilterPlainCss.plain, FilterPlainCss.grouped, {
          [FilterPlainCss.isOpen]: isOpen,
        })}
      >
        {childFilters.map(elementConfig => {
          const { key, schemaType, scope, enumOptions, filterConfig = {} } = elementConfig;
          const { label: childLabel } = filterConfig;
          const childComponentId = `${prefix}.${key.toLowerCase()}`;
          const name = key.replace(/\s+/g, '-');
          const queryParamNames = [constructQueryParamName(key, scope)];

          return (
            <div key={childComponentId}>
              <SelectMultipleFilter
                id={childComponentId}
                label={childLabel}
                name={name}
                queryParamNames={queryParamNames}
                initialValues={initialValues(queryParamNames, liveEdit)}
                onSubmit={getHandleChangedValueFn(useHistoryPush)}
                options={enumOptions}
                schemaType={schemaType}
                getAriaLabel={getAriaLabel}
                {...rest}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupedEnumFilter;
