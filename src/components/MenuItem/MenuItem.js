import React from 'react';
import classNames from 'classnames';

import css from './MenuItem.module.css';

/**
 * MenuItem is part of Menu and specifically a child of MenuContent.
 * MenuItems should have a 'key' prop specified.
 * https://facebook.github.io/react/docs/lists-and-keys.html#keys
 *
 * @example
 * <MenuItem key="item 1">
 *   <a href="example.com">Click me</a>
 * <MenuItem>
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @returns {JSX.Element} menu item
 */
const MenuItem = props => {
  const { children, className, rootClassName } = props;
  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);

  return (
    <li className={classes} role="menuitem">
      {children}
    </li>
  );
};

export default MenuItem;
