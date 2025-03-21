import React from 'react';
import classNames from 'classnames';

import css from './Text.module.css';

/**
 * Text element (e.g. <span>)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @param {string?} props.as tag/element to be used. Default is 'span'.
 * @returns {JSX.Element} <p> element
 */
export const Text = React.forwardRef((props, ref) => {
  const { className, rootClassName, as, ...otherProps } = props;
  const Tag = as || 'span';
  const classes = classNames(rootClassName || css.span, className);

  return <Tag className={classes} {...otherProps} ref={ref} />;
});

Text.displayName = 'Text';
