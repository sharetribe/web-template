import React, { useState } from 'react';
import classNames from 'classnames';

import css from './MenuLabel.module.css';

/**
 * The label button of the menu. MenuLabel is the only always visible part of Menu.
 * Clicking it toggles visibility of MenuContent.
 * Note: the state is kept outside this component. <Menu> keeps track of it.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.isOpenClassName overwrite components own css.isOpen
 * @param {ReactNode} props.children
 * @param {boolean} props.isOpen
 * @param {Function} props.onToggleActive
 * @returns {JSX.Element} label button
 */
const MenuLabel = props => {
  const [clicked, setClicked] = useState(false);
  const { children, className, rootClassName, isOpen, isOpenClassName, onToggleActive } = props;

  const onClick = e => {
    e.stopPropagation();
    e.preventDefault();
    onToggleActive();

    // Don't show focus outline if user just clicked the element with mouse
    // tab + enter creates also a click event, but its location is origin.
    const nativeEvent = e.nativeEvent;
    const isRealClick = !(nativeEvent.clientX === 0 && nativeEvent.clientY === 0);
    if (isRealClick) {
      setClicked(true);
    }
  };

  const onBlur = () => {
    setClicked(false);
  };

  const rootClass = rootClassName || css.root;
  const isOpenClass = isOpenClassName || css.isOpen;
  const classes = classNames(rootClass, className, {
    [css.clicked]: clicked,
    [isOpenClass]: isOpen,
  });

  return (
    <button className={classes} onClick={onClick} onBlur={onBlur}>
      {children}
    </button>
  );
};

export default MenuLabel;
