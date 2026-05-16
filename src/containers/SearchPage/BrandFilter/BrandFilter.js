import React, { useState } from 'react';

import { useIntl } from '../../../util/reactIntl';
import { parseSelectFilterOptions } from '../../../util/search';
import { FieldCheckbox } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';

import css from './BrandFilter.module.css';

const getQueryParamName = queryParamNames =>
  Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;

const formatValue = (selectedOptions, queryParamName) => {
  const value = selectedOptions?.length > 0 ? selectedOptions.join(',') : null;
  return { [queryParamName]: value };
};

/**
 * Brand-specific filter for the search sidebar.
 * Extends SelectMultipleFilter with a search input and a scrollable option list.
 *
 * @param {Object} props - Same interface as SelectMultipleFilter (plain/sidebar variant).
 */
const BrandFilter = props => {
  const {
    id,
    name,
    label,
    getAriaLabel,
    options,
    initialValues,
    onSubmit,
    queryParamNames,
    ...rest
  } = props;

  const intl = useIntl();
  const [searchQuery, setSearchQuery] = useState('');

  const queryParamName = getQueryParamName(queryParamNames);
  const hasInitialValues = !!initialValues?.[queryParamName];
  const selectedOptions = hasInitialValues
    ? parseSelectFilterOptions(initialValues[queryParamName])
    : [];

  const labelSelection = hasInitialValues
    ? intl.formatMessage(
        { id: 'SelectMultipleFilterPlainForm.labelSelected' },
        { count: selectedOptions.length }
      )
    : '';

  const namedInitialValues = { [name]: selectedOptions };

  const filteredOptions = searchQuery
    ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleSubmit = values => {
    const usedValue = values ? values[name] : values;
    onSubmit(formatValue(usedValue, queryParamName));
  };

  return (
    <FilterPlain
      label={label}
      labelSelection={labelSelection}
      ariaLabel={getAriaLabel(label, selectedOptions.join(', '))}
      isSelected={hasInitialValues}
      id={`${id}.plain`}
      liveEdit
      onSubmit={handleSubmit}
      initialValues={namedInitialValues}
      {...rest}
    >
      <div className={css.searchWrapper}>
        <input
          type="text"
          className={css.searchInput}
          placeholder="Buscar marca…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
      </div>
      <fieldset className={css.fieldGroup}>
        <legend className={css.accessibilityLegend}>{label}</legend>
        <div className={css.scrollContainer}>
          <ul className={css.list}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(({ option, label: optLabel }) => (
                <li key={`${id}.${option}`} className={css.item}>
                  <FieldCheckbox
                    id={`${id}.${option}`}
                    name={name}
                    label={optLabel}
                    value={option}
                  />
                </li>
              ))
            ) : (
              <li className={css.noResults}>Sin resultados</li>
            )}
          </ul>
        </div>
      </fieldset>
    </FilterPlain>
  );
};

export default BrandFilter;
