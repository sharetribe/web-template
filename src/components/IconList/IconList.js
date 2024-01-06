import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import css from './IconList.module.css';

const IconList = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg className={classes} width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" role="presentation" focusable="false">
      <path
        d="M2.5 11.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM15 12v2H6v-2h9zM2.5 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM15 7v2H6V7h9zM2.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM15 2v2H6V2h9z"
        strokeWidth="1"
        fill="#fff"
      />
    </svg>
  );
};

IconList.defaultProps = { className: null };

IconList.propTypes = {
  className: string,
  rootClassName: string,
};

export default IconList;
