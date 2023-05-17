import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';

import css from './Text.module.css';

export const Text = React.forwardRef((props, ref) => {
  const { className, rootClassName, as, ...otherProps } = props;
  const Tag = as || 'span';
  const classes = classNames(rootClassName || css.span, className);

  return <Tag className={classes} {...otherProps} ref={ref} />;
});

Text.displayName = 'Text';

Text.defaultProps = {
  rootClassName: null,
  className: null,
  children: null,
  as: 'span',
};

Text.propTypes = {
  rootClassName: string,
  className: string,
  children: node,
  as: string,
};
