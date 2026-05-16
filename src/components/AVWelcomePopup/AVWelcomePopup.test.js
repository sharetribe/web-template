import React from 'react';
import '@testing-library/jest-dom';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import AVWelcomePopup from './AVWelcomePopup';

const { screen } = testingLibrary;
const noop = () => {};

describe('AVWelcomePopup', () => {
  it('renders without crashing when closed', () => {
    const { container } = render(
      <AVWelcomePopup
        userType="vendedor"
        isOpen={false}
        onClose={noop}
        onManageDisableScrolling={noop}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders without crashing when open', () => {
    const { container } = render(
      <AVWelcomePopup
        userType="vendedor-tienda"
        isOpen={true}
        onClose={noop}
        onManageDisableScrolling={noop}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('renders nothing when userType is null', () => {
    const { container } = render(
      <AVWelcomePopup
        userType={null}
        isOpen={true}
        onClose={noop}
        onManageDisableScrolling={noop}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
