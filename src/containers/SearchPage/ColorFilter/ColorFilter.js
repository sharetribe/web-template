import React from 'react';
import { parseSelectFilterOptions } from '../../../util/search';
import classNames from 'classnames';
import css from './ColorFilter.module.css';

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

const ColorFilterComponent = props => {
  const {
    options,
    initialValues,
    onSelect,
    name,

    onSubmit,
    queryParamNames,
  } = props;

  const queryParamName = getQueryParamName(queryParamNames);
  const hasInitialValues = !!initialValues && !!initialValues[queryParamName];
  // Parse options from param strings like "has_all:a,b,c" or "a,b,c"
  const selectedOptions = hasInitialValues
    ? parseSelectFilterOptions(initialValues[queryParamName])
    : [];

    console.log(selectedOptions)

  // pass the initial values with the name key so that
  // they can be passed to the correct field
  //const namedInitialValues = { [name]: selectedOptions };

  return (
    <div className={css.container}>
      {options.map(opt => {
        console.log(selectedOptions, opt)
        //const hex = opt.metadata && opt.metadata.hex;
        const hex2 = hexFromName(opt.option);
        const isSelected = selectedOptions.includes(opt.option);
        return (
          <button
            key={opt.key}
            className={classNames(css.swatch, { [css.selected]: isSelected })}
            style={{ backgroundColor: hex2 }}
            onClick={() => onSelect(opt.key)}
            title={opt.label}
          />
        );
      })}
    </div>
  );
};

function hexFromName(name) {
//    console.log(name)
    // const hex = opt.metadata && opt.metadata.hex;

    return '#000000';
}

export default ColorFilterComponent;
