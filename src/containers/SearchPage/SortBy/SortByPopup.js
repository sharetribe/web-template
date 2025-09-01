import React, { useState } from 'react';
import classNames from 'classnames';

import { IconArrowHead, Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';
import css from './SortByPopup.module.css';

const optionLabel = (options, key) => {
  const option = options.find(o => o.key === key);
  return option ? option.label : key;
};

/**
 * SortByPopup component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.menuLabelRootClassName] - Custom class that extends the default class for the menu label
 * @param {string} props.urlParam - The url param
 * @param {string} props.label - The label
 * @param {Function} props.onSelect - The function to handle the select
 * @param {Array<Object>} props.options - The options [{ key: string, label: string }]
 * @param {string} [props.initialValue] - The initial value
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @returns {JSX.Element}
 */
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
    contentPlacementOffset = 0,
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
  const iconArrowClassName = classNames(css.iconArrow, { [css.iconArrowAnimation]: isOpen });

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
        <IconArrowHead className={iconArrowClassName} direction="down" size="tiny" />
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

export default SortByPopup;
