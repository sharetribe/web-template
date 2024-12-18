import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import css from './IconLink.module.css';

const IconLink = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      fill="none"
      viewBox="0 0 14 14"
    >
      <g>
        <path
          fill="#000"
          fillRule="evenodd"
          d="M7.671 2.743l-.964.964a1 1 0 01-1.414-1.414l.964-.965a4.536 4.536 0 016.415 6.415l-.965.964a1 1 0 11-1.414-1.414l.964-.965a2.536 2.536 0 00-3.585-3.585zm-3.964 2.55a1 1 0 010 1.414l-.964.965a2.536 2.536 0 003.585 3.585l.965-.964a1 1 0 011.414 1.414l-.964.964a4.536 4.536 0 01-6.415-6.414l.965-.964a1 1 0 011.414 0zm5.5.914a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414l3-3z"
          clipRule="evenodd"
        ></path>
      </g>
    </svg>
  );
};

const { string } = PropTypes;

IconLink.defaultProps = {
  className: null,
  rootClassName: null,
};

IconLink.propTypes = {
  className: string,
  rootClassName: string,
};

export default IconLink;
