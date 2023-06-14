import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import css from './IconTrash.module.css';


const IconTrash = props => {
  const { rootClassName, className, trashClassName } = props;
  const classes = classNames(rootClassName || css.root, className);
  console.log(classes);

  return (
    <svg className={classes} width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <g
        className={trashClassName}
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 22H7C5.89543 22 5 21.1046 5 20V7H3V5H7V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V5H21V7H19V20C19 21.1046 18.1046 22 17 22ZM7 7V20H17V7H7ZM9 4V5H15V4H9ZM15 18H13V9H15V18ZM11 18H9V9H11V18Z" />
      </g>
    </svg>
  );
};

IconTrash.defaultProps = {
  rootClassName: null,
  className: null,
  pencilClassName: null,
};

const { string } = PropTypes;

IconTrash.propTypes = {
  rootClassName: string,
  className: string,
  pencilClassName: string,
};

export default IconTrash;
