import React from 'react';

import css from './IconBannedUser.module.css';

/**
 * Banned icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @returns {JSX.Element} SVG icon
 */
const IconBannedUser = props => {
  const { className } = props;
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="background" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" className={css.backgroundLight} />
          <stop offset="100%" className={css.backgroundDark} />
        </linearGradient>
      </defs>
      <g fill="none" fillRule="evenodd">
        <circle fill="url(#background)" cx="20" cy="20" r="20" />
        <circle className={css.foregroundStroke} strokeWidth="3" cx="20" cy="20" r="13" />
        <path className={css.foregroundFill} d="M28.34 9.04l2.12 2.12-19.8 19.8-2.12-2.12z" />
      </g>
    </svg>
  );
};

export default IconBannedUser;
