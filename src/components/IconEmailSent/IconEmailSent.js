import React from 'react';
import classNames from 'classnames';

import css from './IconEmailSent.module.css';

/**
 * Email sent icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconEmailSent = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      width="70"
      height="33"
      viewBox="0 0 70 33"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        strokeWidth="3"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M59.592 26.65c-.958 2.4-3.67 4.35-6.056 4.35H18.93c-2.387 0-3.552-1.95-2.595-4.35l8.075-20.3C25.364 3.95 28.078 2 30.466 2H65.07c2.39 0 3.55 1.95 2.596 4.35l-8.074 20.3z" />
        <path d="M62 8L41.345 19 30 8M22 26l10-7M54 26l-4.5-5.5M17 5H2M6.528 25H2M11.513 15.5H2" />
      </g>
    </svg>
  );
};

export default IconEmailSent;
