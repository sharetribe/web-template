import React from 'react';
import classNames from 'classnames';

import css from './IconDelete.module.css';

/**
 * Delete icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconDelete = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg className={classes} width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.5 14h-7a1 1 0 0 1-1-1V4h9v9a1 1 0 0 1-1 1Zm-5-3V7m3 4V7m-8-3h13m-5-2h-3a1 1 0 0 0-1 1v1h5V3a1 1 0 0 0-1-1Z"
        strokeWidth="1.5"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconDelete;
