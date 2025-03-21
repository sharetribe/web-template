import React from 'react';
import classNames from 'classnames';

import css from './Topbar.module.css';

/**
 * Menu icon (hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} menu icon
 */
const MenuIcon = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.rootMenuIcon, className);

  return (
    <svg
      className={classes}
      width="18"
      height="12"
      viewBox="0 0 18 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fillRule="evenodd">
        <rect width="18" height="2" rx="1" />
        <rect y="5" width="18" height="2" rx="1" />
        <rect y="10" width="18" height="2" rx="1" />
      </g>
    </svg>
  );
};

export default MenuIcon;
