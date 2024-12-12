import React from 'react';
import classNames from 'classnames';
import { MenuItem } from '../../components';

import css from './MenuContent.module.css';

/**
 * MenuContent is a immediate child of Menu component sibling to MenuLabel.
 * Clicking MenuLabel toggles visibility of MenuContent.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.contentClassName overwrite components own css.content, which is given to <ul>
 * @param {ReactNode} props.children
 * @param {number?} props.arrowPosition
 * @param {Function} props.contentRef
 * @param {boolean} props.isOpen
 * @param {Object?} props.style
 * @returns {JSX.Element} content container
 */
const MenuContent = props => {
  const {
    arrowPosition,
    children,
    className,
    contentClassName,
    contentRef,
    isOpen,
    rootClassName,
    style,
  } = props;

  const rootClass = rootClassName || css.root;
  const openClasses = isOpen ? css.isOpen : css.isClosed;
  const classes = classNames(rootClass, className, openClasses);
  const contentClasses = classNames(contentClassName || css.content);

  const arrowPositionStyle =
    arrowPosition && style.right != null
      ? { position: 'absolute', right: arrowPosition, top: 0 }
      : { position: 'absolute', left: arrowPosition, top: 0 };

  const arrow = arrowPosition ? (
    <div style={arrowPositionStyle}>
      <div className={css.arrowBelow} />
      <div className={css.arrowTop} />
    </div>
  ) : null;

  React.Children.forEach(children, child => {
    if (child.type !== MenuItem) {
      throw new Error('All children of MenuContent must be MenuItems.');
    }
    if (child.key == null) {
      throw new Error('All children of MenuContent must have a "key" prop.');
    }
  });

  return (
    <div className={classes} ref={contentRef} style={style}>
      {arrow}
      <ul className={contentClasses}>{children}</ul>
    </div>
  );
};

export default MenuContent;
