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
});
