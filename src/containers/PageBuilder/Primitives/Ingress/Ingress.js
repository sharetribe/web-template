import React from 'react';
import classNames from 'classnames';

import css from './Ingress.module.css';

/**
 * Ingress: a lead paragraph or an opening paragraph
 * It's usually between a headline and the article
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @returns {JSX.Element} ingress (using 'p' element)
 */
export const Ingress = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.ingress, className);

  return <p className={classes} {...otherProps} ref={ref} />;
});

Ingress.displayName = 'Ingress';
