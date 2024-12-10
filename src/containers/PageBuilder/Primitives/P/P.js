import React from 'react';
import classNames from 'classnames';

import css from './P.module.css';

/**
 * Paragraph <p>
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @returns {JSX.Element} <p> element
 */
export const P = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.p, className);

  return <p className={classes} {...otherProps} ref={ref} />;
});

P.displayName = 'P';
