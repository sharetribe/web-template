import React from 'react';
import classNames from 'classnames';

import css from './Topbar.module.css';

/**
 * Search icon (magnifier icon)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} search icon
 */
const SearchIcon = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.rootSearchIcon, className);

  return (
    <svg
      className={classes}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="matrix(-1 0 0 1 17 1)"
        strokeWidth="2"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.733 11.733l3.727 3.727" />
        <circle cx="6.4" cy="6.4" r="6.4" />
      </g>
    </svg>
  );
};

export default SearchIcon;
