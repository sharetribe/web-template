import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../util/testHelpers';

import { MenuItem, MenuLabel, MenuContent } from '../../components';
import Menu from './Menu';

describe('Menu', () => {
  // This is quite small component what comes to rendered HTML
  // For now, we rely on snapshot-testing.
  it('matches snapshot', () => {
    const tree = render(
      <Menu>
        <MenuLabel>Label</MenuLabel>
        <MenuContent>
          <MenuItem key="1">Menu item 1</MenuItem>
          <MenuItem key="2">Menu item 2</MenuItem>
        </MenuContent>
      </Menu>
    );
    expect(tree.asFragment()).toMatchSnapshot();
  });
});
