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
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M12 12.5c1.6569 0 3-1.3431 3-3 0-1.65685-1.3431-3-3-3s-3 1.34315-3 3c0 1.6569 1.3431 3 3 3Z" />
      <path d="M19.5 9.5c0 6.5833-5.7762 11.6103-7.1904 12.4178-.0943.0539-.201.0822-.3096.0822-.1086 0-.2153-.0283-.3096-.0822C10.2763 21.1095 4.5 16.0817 4.5 9.5c0-1.98912.79018-3.89678 2.1967-5.3033S10.0109 2 12 2s3.8968.79018 5.3033 2.1967C18.7098 5.60322 19.5 7.51088 19.5 9.5Z" />
    </svg>
  );
};

export default IconLocation;
