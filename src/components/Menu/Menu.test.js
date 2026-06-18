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

  // AV: guards the deliberate removal of upstream's off-screen positioning trick.
  // The closed menu is hidden by MenuContent's `.isClosed` collapse
  // (max-height: 0; overflow: hidden), not by parking it at `left: -10000px`.
  it('hides the closed menu via .isClosed, not an off-screen offset', () => {
    const { container } = render(
      <Menu>
        <MenuLabel>Label</MenuLabel>
        <MenuContent>
          <MenuItem key="1">Menu item 1</MenuItem>
          <MenuItem key="2">Menu item 2</MenuItem>
        </MenuContent>
      </Menu>
    );

    const content = container.querySelector('.isClosed');
    expect(content).toBeInTheDocument();
    expect(content).not.toHaveStyle({ left: '-10000px' });
  });
});
