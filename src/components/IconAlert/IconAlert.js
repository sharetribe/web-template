import React from 'react';
import classNames from 'classnames';

import css from './IconAlert.module.css';

/**
 * Alert icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @returns {JSX.Element} SVG icon
 */
const IconAlert = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      className={classes}
      viewBox="-1.375 -1.375 40 40"
      height="40"
      width="40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        strokeWidth="2.75"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18.625 26.773a.582.582 0 0 1 0-1.164M18.625 26.773a.582.582 0 0 0 0-1.164" />
        <path strokeMiterlimit="10" d="M18.625 20.953V8.148" />
        <path
          strokeMiterlimit="10"
          d="M18.625 36.086c9.643 0 17.46-7.818 17.46-17.461s-7.817-17.46-17.46-17.46-17.46 7.817-17.46 17.46 7.817 17.46 17.46 17.46Z"
        />
      </g>
    </svg>
  );
};

export default IconAlert;
