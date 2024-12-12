import React from 'react';
import classNames from 'classnames';

import css from './IconEdit.module.css';

/**
 * Edit icon. (pencil)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.pencilClassName overwrite components own css.pencil
 * @returns {JSX.Element} SVG icon
 */
const IconEdit = props => {
  const { rootClassName, className, pencilClassName } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg className={classes} width="14" height="14" xmlns="http://www.w3.org/2000/svg">
      <g
        className={pencilClassName || css.pencil}
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.307 11.155L1 13l1.846-4.308L10.539 1 13 3.461zM11 5L9 3M5 11L3 9" />
      </g>
    </svg>
  );
};

export default IconEdit;
