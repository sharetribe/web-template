import React, { useState } from 'react';
import { arrayOf, func, number, shape, string } from 'prop-types';
import classNames from 'classnames';

import { Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';
import css from './SortByPopup.module.css';

const optionLabel = (options, key) => {
  const option = options.find(o => o.key === key);
  return option ? option.label : key;
};

const SortByIcon = props => {
  const classes = classNames(css.icon, props.className);
  // extra small arrow head (down)
  return (
    <svg className={classes} width="8" height="5" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.764 4.236c.131.13.341.13.472 0l2.666-2.667a.333.333 0 10-.471-.471L4 3.528l-2.43-2.43a.333.333 0 10-.471.471l2.665 2.667z"
        fill="#4A4A4A"
        stroke="#4A4A4A"
        fillRule="evenodd"
      />
    </svg>
  );
};

const SortByPopup = props => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    rootClassName,
    className,
    menuLabelRootClassName,
    urlParam,
    label,
    options,
    initialValue,
    contentPlacementOffset,
    onSelect,
  } = props;

  const onToggleActive = isOpenParam => {
    setIsOpen(isOpenParam);
  };

  const selectOption = (urlParameter, option) => {
    setIsOpen(false);
    onSelect(urlParameter, option);
  };

  // resolve menu label text and class
  const menuLabel = initialValue ? optionLabel(options, initialValue) : label;

  const classes = classNames(rootClassName || css.root, className);
  const menuLabelClasses = classNames(menuLabelRootClassName);
  const iconArrowClassName = isOpen ? css.iconArrowAnimation : null;

  return (
    <Menu
      className={classes}
      useArrow={false}
      contentPlacementOffset={contentPlacementOffset}
      contentPosition="left"
      onToggleActive={onToggleActive}
      isOpen={isOpen}
      preferScreenWidthOnMobile
    >
      <MenuLabel rootClassName={menuLabelClasses}>
        {menuLabel}
        <SortByIcon className={iconArrowClassName} />
      </MenuLabel>
      <MenuContent className={css.menuContent}>
        {options.map(option => {
          // check if this option is selected
          const selected = initialValue === option.key;
          // menu item border class
          const menuItemBorderClass = selected ? css.menuItemBorderSelected : css.menuItemBorder;

          return (
            <MenuItem key={option.key}>
              <button
                className={css.menuItem}
                disabled={option.disabled}
                onClick={() => (selected ? null : selectOption(urlParam, option.key))}
              >
                <span className={menuItemBorderClass} />
                {option.longLabel || option.label}
              </button>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
};

SortByPopup.defaultProps = {
  rootClassName: null,
  className: null,
  menuLabelRootClassName: null,
  initialValue: null,
  contentPlacementOffset: 0,
};

SortByPopup.propTypes = {
  rootClassName: string,
  className: string,
  menuLabelRootClassName: string,
  urlParam: string.isRequired,
  label: string.isRequired,
  onSelect: func.isRequired,
  options: arrayOf(
    shape({
      key: string.isRequired,
      label: string.isRequired,
    })
  ).isRequired,
  initialValue: string,
  contentPlacementOffset: number,
};

export default SortByPopup;
