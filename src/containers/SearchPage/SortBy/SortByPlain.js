import React, { useState } from 'react';
import { arrayOf, func, shape, string } from 'prop-types';
import classNames from 'classnames';

import css from './SortByPlain.module.css';

const SortByPlain = props => {
  const [isOpen, setIsOpen] = useState(true);
  const { rootClassName, className, label, options, initialValue } = props;

  const selectOption = (option, e) => {
    const { urlParam, onSelect } = props;
    onSelect(urlParam, option);

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  };

  const toggleIsOpen = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  const labelClass = initialValue ? css.filterLabelSelected : css.filterLabel;

  const optionsContainerClass = classNames({
    [css.optionsContainerOpen]: isOpen,
    [css.optionsContainerClosed]: !isOpen,
  });

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={labelClass}>
        <button className={css.labelButton} onClick={toggleIsOpen}>
          <span className={labelClass}>{label}</span>
        </button>
      </div>
      <div className={optionsContainerClass}>
        {options.map(option => {
          // check if this option is selected
          const selected = initialValue === option.key;
          const optionClass = selected ? css.optionSelected : css.option;
          // menu item selected or border class
          const optionBorderClass = classNames({
            [css.optionBorderSelected]: selected,
            [css.optionBorder]: !selected,
          });
          return (
            <button
              key={option.key}
              className={optionClass}
              disabled={option.disabled}
              onClick={() => (selected ? null : selectOption(option.key))}
            >
              <span className={optionBorderClass} />
              {option.longLabel || option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

SortByPlain.defaultProps = {
  rootClassName: null,
  className: null,
  initialValue: null,
};

SortByPlain.propTypes = {
  rootClassName: string,
  className: string,
  urlParam: string.isRequired,
  label: string.isRequired,
  onSelect: func.isRequired,

  options: arrayOf(
    shape({
      key: string.isRequired,
      label: string.isRequired,
    })
  ).isRequired,
  initialValue: string,
};

export default SortByPlain;
