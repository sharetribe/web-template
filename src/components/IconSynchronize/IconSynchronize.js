import React from 'react';
import classNames from 'classnames';

import css from './IconSynchronize.module.css';

/**
 * Synchronize icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconSynchronize = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      viewBox="-1.5 -1.5 50 50"
    >
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M16.156 7.833h16.157a5.875 5.875 0 0 1 5.874 5.875v13.22M30.844 40.146H14.688a5.875 5.875 0 0 1-5.875-5.875V21.052"
      />
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="m30.844 19.577 7.344 7.344 7.343-7.344M16.156 28.39l-7.343-7.344-7.344 7.344"
      />
    </svg>
  );
};

export default IconSynchronize;
