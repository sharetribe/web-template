import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import {
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  IconArrowHead,
  NamedLink,
  ExternalLink,
} from '../../../../../components';

import css from './LinksMenuDropdown.module.css';

const DropdownLink = ({ item, currentPage }) => {
  const { text, type, href, route } = item;
  const isActive = currentPage && currentPage.indexOf(route?.name) === 0;
  const linkClass = classNames(css.menuLink, { [css.currentPage]: isActive });

  return type === 'internal' && route ? (
    <NamedLink
      name={route.name}
      params={route.params}
      to={route.to}
      className={linkClass}
    >
      <span className={css.menuItemBorder} />
      {text}
    </NamedLink>
  ) : (
    <ExternalLink href={href} target="_self" className={linkClass}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

const MenuLabelContent = ({ label, isOpen }) => (
  <span className={css.linkMenuLabelWrapper}>
    {label}
    <IconArrowHead direction={isOpen ? 'up' : 'down'} size="small" rootClassName={css.arrowIcon} />
  </span>
);

const LinksMenuDropdown = ({ id, label, items, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Menu id={id} isOpen={isOpen} onToggleActive={setIsOpen}>
      <MenuLabel
        className={css.linkMenuLabel}
        isOpenClassName={css.linkMenuIsOpen}
      >
        <MenuLabelContent label={label} isOpen={isOpen} />
      </MenuLabel>
      <MenuContent className={css.linkMenuContent}>
        {items.map((item, i) => (
          <MenuItem key={`${item.text}-${i}`}>
            <DropdownLink item={item} currentPage={currentPage} />
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};

export default LinksMenuDropdown;