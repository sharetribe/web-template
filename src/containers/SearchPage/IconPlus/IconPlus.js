import React from 'react';
import classNames from 'classnames';

import css from './IconPlus.module.css';

/**
 * IconPlus component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} [props.isOpen] - Whether the icon is showing the 'open' mode
 * @returns {JSX.Element}
 */
const IconPlus = props => {
  const { className, rootClassName, isOpen = true } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg className={classes} width="12" height="12" xmlns="http://www.w3.org/2000/svg">
      <line className={css.horizontalLine} x1="0" y1="6" x2="11" y2="6" strokeWidth="1.9" />
      <line
        className={classNames(css.verticalLine, { [css.lineVerticalOpen]: isOpen })}
        x1="0"
        y1="6"
        x2="11"
        y2="6"
        strokeWidth="1.9"
      />
    </svg>
  );
};

export default IconPlus;
