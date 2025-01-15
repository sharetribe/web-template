import React from 'react';
import classNames from 'classnames';

import css from './IconDisputeOrder.module.css';

/**
 * Delete icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconDisputeOrder = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg className={classes} width="45" height="45" xmlns="http://www.w3.org/2000/svg">
      <g
        strokeWidth="2.75"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.063 33.25H7.718a5.375 5.375 0 01-5.375-5.375V22.5a5.375 5.375 0 015.375-5.375h1.343c.743 0 1.344.602 1.344 1.344v13.437c0 .742-.601 1.344-1.344 1.344zm28.218 0h-1.343a1.344 1.344 0 01-1.344-1.344V18.47c0-.742.601-1.344 1.343-1.344h1.344a5.375 5.375 0 015.375 5.375v5.375a5.375 5.375 0 01-5.375 5.375zM7.719 17.125c0-8.163 6.618-14.781 14.781-14.781h0a14.781 14.781 0 0114.781 14.781" />
        <path d="M27.875 39.969h4.031a5.375 5.375 0 005.375-5.375h0V33.25" />
        <path d="M25.188 42.656H22.5a2.687 2.687 0 01-2.688-2.687h0A2.687 2.687 0 0122.5 37.28h2.688a2.687 2.687 0 012.687 2.688h0a2.687 2.687 0 01-2.688 2.687zm-8.063-13.989a7.98 7.98 0 0010.75 0m-10.75-9.777v2.35m10.75-2.35v2.35" />
      </g>
    </svg>
  );
};

export default IconDisputeOrder;
