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

  it('persists onboarding before navigating when a CTA button is clicked', async () => {
    // jsdom can't navigate; mock window.location.assign to observe it.
    const assignMock = jest.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, assign: assignMock };

    // onClose returns a resolved promise (mirrors handlePopupClose returning the
    // persistence promise) so the click waits for it before navigating.
    const onClose = jest.fn(() => Promise.resolve());
    render(
      <AVWelcomePopup
        userType="vendedor"
        isOpen={true}
        onClose={onClose}
        onManageDisableScrolling={noop}
      />,
      {
        withPortals: true,
        messages: {
          'AVWelcomePopup.vendedor.primaryButtonLabel': 'Get started',
          'AVWelcomePopup.vendedor.primaryButtonUrl': '/listings/new',
        },
      }
    );

    testingLibrary.fireEvent.click(screen.getByText('Get started'));
    // onClose (persistence) fires synchronously on click...
    expect(onClose).toHaveBeenCalledTimes(1);
    // ...and navigation only happens after the persistence promise settles.
    await testingLibrary.waitFor(() => expect(assignMock).toHaveBeenCalledWith('/listings/new'));

    window.location = originalLocation;
  });

  it('renders the eyebrow above the title when set', () => {
    render(
      <AVWelcomePopup
        userType="vendedor"
        isOpen={true}
        onClose={noop}
        onManageDisableScrolling={noop}
      />,
      {
        withPortals: true,
        messages: {
          'AVWelcomePopup.vendedor.eyebrow': 'YA ERES PARTE DE ARCHIVO',
          'AVWelcomePopup.vendedor.title': 'Ahora sube tu primera prenda',
        },
      }
    );
    expect(screen.getByText('YA ERES PARTE DE ARCHIVO')).toBeInTheDocument();
    expect(screen.getByText('Ahora sube tu primera prenda')).toBeInTheDocument();
  });
});
