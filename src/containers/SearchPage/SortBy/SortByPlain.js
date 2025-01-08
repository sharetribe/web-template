import React, { useState } from 'react';
import classNames from 'classnames';

import css from './SortByPlain.module.css';

/**
 * SortByPlain component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.urlParam - The url param
 * @param {string} props.label - The label
 * @param {Function} props.onSelect - The function to handle the select
 * @param {Array<Object>} props.options - The options [{ key: string, label: string }]
 * @param {string} [props.initialValue] - The initial value
 * @returns {JSX.Element}
 */
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

export default SortByPlain;
