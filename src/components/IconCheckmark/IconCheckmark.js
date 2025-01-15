import React from 'react';
import classNames from 'classnames';

import css from './IconCheckMark.module.css';

const SIZE_SMALL = 'small';
const SIZE_BIG = 'big';

/**
 * Checkmark icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @param {string?} props.rootClassName overwrite components own root class
 * @param {'big' | 'small'} props.size
 * @returns {JSX.Element} SVG icon
 */
const IconCheckmark = props => {
  const { rootClassName, className, size = SIZE_BIG } = props;
  const classes = classNames(rootClassName || css.root, className);
  if (size === SIZE_SMALL) {
    return (
      <svg className={classes} width="16" height="12" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 2l-8 8-4-4"
          strokeWidth="2.5"
          fill="none"
          fillRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  } else if (size === SIZE_BIG) {
    return (
      <svg className={classes} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.6 1.2c-.4-.3-1-.2-1.3.2L7.8 19l-5.2-5c-.4-.4-1-.4-1.3 0-.4.3-.4.8 0 1l6 5.6.6.2s.2 0 .4-.4l14.3-18c.3-.5.2-1-.2-1" />
      </svg>
    );
  }
};

export default IconCheckmark;
