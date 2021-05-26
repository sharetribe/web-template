import React from 'react';
import { bool, string } from 'prop-types';
import classNames from 'classnames';

import css from './IconPlus.module.css';

const IconPlus = props => {
  const { className, rootClassName, isOpen } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg className={classes} width="12" height="12" xmlns="http://www.w3.org/2000/svg">
      <line className={css.horizontalLine} x1="0" y1="6" x2="11" y2="6" strokeWidth="1.9" />
      <line
        className={classNames(css.verticalLine, { [css.lineVerticalOpen]: isOpen })}
        x1="0"
        y1="6"
        x2="11"
        y2="6"
        strokeWidth="1.9"
      />
    </svg>
  );
};

IconPlus.defaultProps = {
  className: null,
  rootClassName: null,
  isOpen: true,
};

IconPlus.propTypes = {
  className: string,
  rootClassName: string,
  isOpen: bool,
};

export default IconPlus;
