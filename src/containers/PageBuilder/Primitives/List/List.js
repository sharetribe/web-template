import React from 'react';
import classNames from 'classnames';

import css from './List.module.css';

/**
 * Unordered list.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @returns {JSX.Element} <ul> element
 */
export const Ul = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.ul, className);

  return <ul className={classes} {...otherProps} ref={ref} />;
});
Ul.displayName = 'Ul';

/**
 * Ordered list.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @returns {JSX.Element} <ol> element
 */
export const Ol = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.ol, className);

  return <ol className={classes} {...otherProps} ref={ref} />;
});
Ol.displayName = 'Ol';

/**
 * List item.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @returns {JSX.Element} <li> element
 */
export const Li = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.li, className);

  return <li className={classes} {...otherProps} ref={ref} />;
});
Li.displayName = 'Li';
