import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import BlockPriceSelector from './BlockPriceSelector';

const { screen } = testingLibrary;

const plans = {
  set1: [
    {
      title: 'Starter',
      description: 'Try it out',
      price: '$0',
      priceText: '',
      cta: { link: 'https://example.com/starter', text: 'Get started' },
      features: ['Feature A', 'Feature B'],
    },
  ],
};

describe('BlockPriceSelector', () => {
  it('renders the embedded PricingToggle with the provided plans', () => {
    render(<BlockPriceSelector blockId="block-price" plans={plans} toggles={{}} />);
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.getByText('Feature A')).toBeInTheDocument();
  });

  it('applies the block id to the container', () => {
    const { container } = render(
      <BlockPriceSelector blockId="block-abc" plans={plans} toggles={{}} />
    );
    expect(container.querySelector('#block-abc')).toBeInTheDocument();
  });
});
