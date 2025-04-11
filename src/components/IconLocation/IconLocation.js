import React from 'react';
import classNames from 'classnames';

import css from './IconLocation.module.css';

/**
 * Map pin icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconLocation = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.5C13.6569 12.5 15 11.1569 15 9.5C15 7.84315 13.6569 6.5 12 6.5C10.3431 6.5 9 7.84315 9 9.5C9 11.1569 10.3431 12.5 12 12.5Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 9.5C19.5 16.0833 13.7238 21.1103 12.3096 21.9178C12.2153 21.9717 12.1086 22 12 22C11.8914 22 11.7847 21.9717 11.6904 21.9178C10.2763 21.1095 4.5 16.0817 4.5 9.5C4.5 7.51088 5.29018 5.60322 6.6967 4.1967C8.10322 2.79018 10.0109 2 12 2C13.9891 2 15.8968 2.79018 17.3033 4.1967C18.7098 5.60322 19.5 7.51088 19.5 9.5Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconLocation;
