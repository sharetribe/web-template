import React from 'react';
import classNames from 'classnames';

import css from './ManageListingCard.module.css';

/**
 * Menu icon
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {boolean} [props.isActive] - Whether the menu is active
 * @returns {JSX.Element} Menu icon components
 */
const MenuIcon = props => {
  const { className, isActive = false } = props;
  const classes = classNames(css.menuIcon, className);
  const filter = isActive ? '' : 'url(#a)';
  return (
    <svg
      className={classes}
      width="26"
      height="12"
      viewBox="0 0 26 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter x="-38.9%" y="-125%" width="177.8%" height="450%" filterUnits="objectBoundingBox">
          <feOffset dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur stdDeviation="2" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" in="shadowBlurOuter1" />
        </filter>
      </defs>
      <g transform="translate(-342 -18)" filter={filter}>
        <path d="M348 24c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm7 0c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm7 0c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
      </g>
      <g transform="translate(-342 -18)">
        <path d="M348 24c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm7 0c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm7 0c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
      </g>
    </svg>
  );
};

export default MenuIcon;
