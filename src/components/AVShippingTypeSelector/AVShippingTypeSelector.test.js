import React from 'react';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import '@testing-library/jest-dom';
import AVShippingTypeSelector from './AVShippingTypeSelector';

const { screen, fireEvent } = testingLibrary;

const cfg = require('../../config/configAVShipping');

describe('AVShippingTypeSelector', () => {
  let original;

  beforeEach(() => {
    original = JSON.parse(JSON.stringify(cfg.priceGrid));
    cfg.priceGrid.M.nacionalEstandar = 12900;
    cfg.priceGrid.M.nacionalExpress = 18900;
  });

  afterEach(() => {
    Object.assign(cfg.priceGrid, original);
  });

  test('renders a radio per available type with formatted price', () => {
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={['nacionalEstandar', 'nacionalExpress']}
        selectedType={null}
        onSelect={() => {}}
        currency="MXN"
      />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText(/129\.00/)).toBeInTheDocument();
  });

  test('calls onSelect with the chosen type', () => {
    const onSelect = jest.fn();
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={['nacionalEstandar', 'nacionalExpress']}
        selectedType={null}
        onSelect={onSelect}
        currency="MXN"
      />
    );
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(onSelect).toHaveBeenCalledWith('nacionalExpress');
  });

  test('renders no radios and shows the no-options message when availableTypes is empty', () => {
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={[]}
        selectedType={null}
        onSelect={() => {}}
        currency="MXN"
      />,
      {
        messages: {
          'AVShippingTypeSelector.noOptions':
            'Shipping is not available for this item — contact AV.',
        },
      }
    );
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByText(/contact AV/i)).toBeInTheDocument();
  });

  test('filters out unpriced types and renders only the priced radio', () => {
    cfg.priceGrid.M.nacionalExpress = null;
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={['nacionalEstandar', 'nacionalExpress']}
        selectedType={null}
        onSelect={() => {}}
        currency="MXN"
      />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });

  test('reflects selectedType on the matching radio only', () => {
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={['nacionalEstandar', 'nacionalExpress']}
        selectedType="nacionalExpress"
        onSelect={() => {}}
        currency="MXN"
      />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
  });

  test('renders the contact-seller alert and fires onContactSeller when provided', () => {
    const onContactSeller = jest.fn();
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={['nacionalEstandar']}
        selectedType={null}
        onSelect={() => {}}
        currency="MXN"
        onContactSeller={onContactSeller}
      />,
      {
        messages: {
          'AVShippingTypeSelector.confirmAlertTitle': 'Recuerda confirmar la venta',
          'AVShippingTypeSelector.confirmAlertText':
            'Contacta al vendedor para confirmar la fecha de envio.',
          'AVShippingTypeSelector.contactSellerCta': 'Contactar al vendedor',
        },
      }
    );
    expect(screen.getByText('Recuerda confirmar la venta')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Contactar al vendedor/i }));
    expect(onContactSeller).toHaveBeenCalledTimes(1);
  });

  test('omits the contact-seller alert when onContactSeller is not provided', () => {
    render(
      <AVShippingTypeSelector
        size="M"
        availableTypes={['nacionalEstandar']}
        selectedType={null}
        onSelect={() => {}}
        currency="MXN"
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
