import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import PricingToggle from './PricingToggle';

const { screen, userEvent } = testingLibrary;

const samplePlans = {
  set1: [
    {
      title: 'Basic',
      description: 'For starters',
      price: '$10',
      priceText: 'per month',
      cta: { link: 'https://example.com/basic', text: 'Choose Basic' },
      features: ['One thing', 'Another thing'],
    },
  ],
  set2: [
    {
      title: 'Pro',
      description: 'For power users',
      price: '$100',
      priceText: 'per year',
      cta: { link: 'https://example.com/pro', text: 'Choose Pro' },
      features: ['Everything in Basic', 'And more'],
    },
  ],
};

describe('PricingToggle', () => {
  it('renders nothing in the grid when plans is empty', () => {
    const { container } = render(<PricingToggle plans={{}} toggles={{}} />);
    expect(container.querySelectorAll('h3').length).toBe(0);
  });

  it('renders set1 plans by default', () => {
    render(<PricingToggle plans={samplePlans} toggles={{}} />);
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('hides toggle buttons when no toggle labels are provided', () => {
    render(<PricingToggle plans={samplePlans} toggles={{}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows toggle buttons when toggle labels are provided', () => {
    render(<PricingToggle plans={samplePlans} toggles={{ cta1: 'Monthly', cta2: 'Yearly' }} />);
    expect(screen.getByRole('button', { name: 'Monthly' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yearly' })).toBeInTheDocument();
  });

  it('switches to set2 when the second toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<PricingToggle plans={samplePlans} toggles={{ cta1: 'Monthly', cta2: 'Yearly' }} />);
    await user.click(screen.getByRole('button', { name: 'Yearly' }));
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.queryByText('Basic')).not.toBeInTheDocument();
  });

  it('renders the CTA link with the configured href', () => {
    render(<PricingToggle plans={samplePlans} toggles={{}} />);
    const link = screen.getByRole('link', { name: 'Choose Basic' });
    expect(link).toHaveAttribute('href', 'https://example.com/basic');
  });

  it('renders each feature in the plan', () => {
    render(<PricingToggle plans={samplePlans} toggles={{}} />);
    expect(screen.getByText('One thing')).toBeInTheDocument();
    expect(screen.getByText('Another thing')).toBeInTheDocument();
  });
});
