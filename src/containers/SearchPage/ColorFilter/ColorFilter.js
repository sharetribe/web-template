import React from 'react';
import { parseSelectFilterOptions } from '../../../util/search';
import { swatchColors } from '../../../components/FieldSwatch/FieldSwatch';
import classNames from 'classnames';
import css from './ColorFilter.module.css';

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

const ColorFilterComponent = props => {
  const { options, initialValues, onSelect, queryParamNames } = props;

  const queryParamName = getQueryParamName(queryParamNames);
  const hasInitialValues = !!initialValues && !!initialValues[queryParamName];
  // Parse options from param strings like "has_all:a,b,c" or "a,b,c"
  const selectedOptions = hasInitialValues
    ? parseSelectFilterOptions(initialValues[queryParamName])
    : [];

  return (
    <div className={css.container}>
      {options.map(opt => {
        const hex = hexFromName(opt.option);
        const isSelected = selectedOptions.includes(opt.option);
        return (
          <button
            key={opt.key}
            className={classNames(css.swatch, { [css.selected]: isSelected })}
            style={{ backgroundColor: hex }}
            onClick={() => onSelect(opt.key)}
            aria-label={opt.label}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
};

function hexFromName(name) {
  return swatchColors[name] || '#000000';
}

export default ColorFilterComponent;
