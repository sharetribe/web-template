import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';

import css from './Span.module.css';

export const Span = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.span, className);

  return <span className={classes} {...otherProps} ref={ref} />;
});

Span.displayName = 'Span';

Span.defaultProps = {
  rootClassName: null,
  className: null,
  children: null,
};

Span.propTypes = {
  rootClassName: string,
  className: string,
  children: node,
};
