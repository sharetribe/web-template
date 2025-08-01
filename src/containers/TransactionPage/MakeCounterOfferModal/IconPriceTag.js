import React from 'react';
import classNames from 'classnames';

import css from './IconPriceTag.module.css';

/**
 * Synchronize icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconPriceTag = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      fill="none"
      viewBox="-1.5 -1.5 50 50"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.625 37.577a2.938 2.938 0 0 1-4.154 0L2.937 27.045a2.938 2.938 0 0 1 0-4.156L23.5 2.326a2.938 2.938 0 0 1 2.078-.86H36.11a2.938 2.938 0 0 1 2.937 2.938v10.534a2.938 2.938 0 0 1-.86 2.076"
      />
      <path d="M31.703 9.545a.734.734 0 0 1 0-1.469M31.703 9.545a.734.734 0 0 0 0-1.469" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M33.172 27.904v-1.468M36.112 27.904h-3.984a2.624 2.624 0 0 0-.979 5.067l4.04 1.617a2.628 2.628 0 0 1-.979 5.066h-3.975M33.172 41.123v-1.469"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M33.172 45.53a11.75 11.75 0 1 0 0-23.5 11.75 11.75 0 0 0 0 23.5Z"
      />
    </svg>
  );
};

export default IconPriceTag;
