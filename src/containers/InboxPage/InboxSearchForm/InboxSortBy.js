import React, { useState } from 'react';
import classNames from 'classnames';

import { IconArrowHead, Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';
import css from './InboxSortBy.module.css';

const SORT_DROPDOWN_OFFSET = -14;

const optionLabel = (options, key) => {
  const option = options.find(o => o.key === key);
  return option ? option.label : key;
};

/**
 * A component that allows sorting of inbox messages based on a definied, limited selection of values
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} initialValue - Sets starting value for dropdown selection
 * @param {Object} intl - react-intl object from injectIntl
 * @param {Function} props.onSelect - The function to handle the select
 * @returns {JSX.Element} InboxSortBy component
 */
const InboxSortBy = props => {
  const [isOpen, setIsOpen] = useState(false);
  const { rootClassName, className, intl, initialValue, onSelect } = props;

  const onToggleActive = isOpenParam => {
    setIsOpen(isOpenParam);
  };

  const selectOption = option => {
    setIsOpen(false);
    onSelect(option.key);
  };

  const classes = classNames(rootClassName || css.root, className);
  const iconArrowClassName = classNames(css.iconArrow, { [css.iconArrowAnimation]: isOpen });

  const sortOptions = [
    { key: 'createdAt', label: intl.formatMessage({ id: 'InboxPage.sortBy.createdAt' }) },
    {
      key: 'lastMessageAt',
      label: intl.formatMessage({ id: 'InboxPage.sortBy.lastMessageAt' }),
    },
    {
      key: 'lastTransitionedAt',
      label: intl.formatMessage({ id: 'InboxPage.sortBy.lastTransitionedAt' }),
    },
  ];

  const menuLabel = optionLabel(sortOptions, initialValue);

  return (
    <Menu
      className={classes}
      useArrow={false}
      contentPlacementOffset={SORT_DROPDOWN_OFFSET}
      contentPosition="left"
      onToggleActive={onToggleActive}
      isOpen={isOpen}
      preferScreenWidthOnMobile
    >
      <MenuLabel rootClassName={css.sortLabel}>
        {menuLabel}
        <IconArrowHead className={iconArrowClassName} direction="down" size="tiny" />
      </MenuLabel>
      <MenuContent className={css.menuContent}>
        {sortOptions.map(option => {
          // check if this option is selected
          const selected = initialValue === option.key;
          // menu item border class
          const menuItemBorderClass = selected ? css.menuItemBorderSelected : css.menuItemBorder;

          return (
            <MenuItem key={option.key}>
              <button
                className={css.menuItem}
                disabled={option.disabled}
                onClick={() => {
                  return selected ? null : selectOption(option);
                }}
              >
                <span className={menuItemBorderClass} />
                {option.label}
              </button>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
};

export default InboxSortBy;
