import React from 'react';
import classNames from 'classnames';

import css from './IconClose.module.css';
const SIZE_SMALL = 'small';

/**
 * Close icon. "x"
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {'small' | null} props.size
 * @returns {JSX.Element} SVG icon
 */
const IconClose = props => {
  const { className, rootClassName, size, ariaLabel } = props;
  const classes = classNames(rootClassName || css.root, className);
  const ariaLabelMaybe = ariaLabel ? { ['aria-label']: ariaLabel } : {};

  if (size === SIZE_SMALL) {
    return (
      <svg className={classes} width="9" height="9" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2.175 8.396l2.482-2.482 2.482 2.482a.889.889 0 1 0 1.258-1.257L5.914 4.657l2.482-2.483A.89.89 0 0 0 7.139.917L4.657 3.4 2.175.918A.888.888 0 1 0 .917 2.174L3.4 4.657.918 7.139a.889.889 0 1 0 1.257 1.257"
          fillRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      className={classes}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      {...ariaLabelMaybe}
    >
      <g transform="translate(-1 -1)" fillRule="evenodd">
        <rect transform="rotate(45 7 7)" x="-1" y="6" width="16" height="2" rx="1" />
        <rect transform="rotate(-45 7 7)" x="-1" y="6" width="16" height="2" rx="1" />
      </g>
    </svg>
  );
};

export default IconClose;
