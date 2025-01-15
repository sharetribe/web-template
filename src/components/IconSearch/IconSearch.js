import React from 'react';
import classNames from 'classnames';

import css from './IconSearch.module.css';

/**
 * Magnifier icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconSearch = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      width="21"
      height="22"
      viewBox="0 0 21 22"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="matrix(-1 0 0 1 20 1)"
        strokeWidth="2"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 14l5.241 5.241" />
        <circle cx="7.5" cy="7.5" r="7.5" />
      </g>
    </svg>
  );
};

export default IconSearch;
