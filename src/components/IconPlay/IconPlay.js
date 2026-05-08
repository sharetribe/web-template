import React from 'react';
import classNames from 'classnames';

import css from './IconPlay.module.css';

/**
 * Play icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @returns {JSX.Element} SVG icon
 */
const IconPlay = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      className={classes}
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="none"
    >
      <path d="M40 0C62.0914 0 80 17.9086 80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0ZM33.75 25.3281C32.0834 24.3966 30 25.5607 30 27.4238V52.5762C30 54.4393 32.0834 55.6034 33.75 54.6719L56.25 42.0957C57.9165 41.1641 57.9165 38.8359 56.25 37.9043L33.75 25.3281Z" />
    </svg>
  );
};

export default IconPlay;
