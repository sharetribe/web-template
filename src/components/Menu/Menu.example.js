import React from 'react';
import { InlineTextButton, MenuContent, MenuLabel, MenuItem } from '..';
import Menu from './Menu';

const noop = () => null;
const style = { padding: '24px' };
const btnStyle = { whiteSpace: 'nowrap', padding: '6px 0' };

function MenuWrapper() {
  return (
    <Menu>
      <MenuLabel>
        <span>Menu</span>
      </MenuLabel>
      <MenuContent style={style}>
        <MenuItem key="first item">
          <InlineTextButton onClick={noop} style={btnStyle}>
            Click this
          </InlineTextButton>
        </MenuItem>
        <MenuItem key="second item">
          <InlineTextButton onClick={noop} style={btnStyle}>
            Click this
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function MenuOnLeft() {
  return (
    <div style={{ width: '50px' }}>
      <MenuWrapper />
    </div>
  );
}

export const MenuBasic = {
  component: MenuOnLeft,
  props: {},
  group: 'navigation',
};

function MenuOnRight() {
  return (
    <div style={{ width: '68px', marginLeft: 'auto', marginRight: '36x' }}>
      <MenuWrapper />
    </div>
  );
}

export const MenuBasicOnRight = {
  component: MenuOnRight,
  props: {},
  group: 'navigation',
};
