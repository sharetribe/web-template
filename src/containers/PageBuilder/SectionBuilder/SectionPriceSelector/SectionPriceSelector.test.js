import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionPriceSelector from './SectionPriceSelector';

const { screen } = testingLibrary;

const defaultClasses = {
  sectionDetails: 'sectionDetails',
  title: 'title',
  description: 'description',
  ctaButton: 'ctaButton',
};

const plans = {
  set1: [
    {
      title: 'Free',
      description: 'Forever',
      price: '$0',
      priceText: '',
      cta: { link: 'https://example.com/free', text: 'Start' },
      features: ['One feature'],
    },
  ],
};

describe('SectionPriceSelector', () => {
  it('renders the embedded PricingToggle with provided plans', () => {
    render(
      <SectionPriceSelector
        sectionId="price-1"
        defaultClasses={defaultClasses}
        plans={plans}
        toggles={{}}
        customOption={{}}
      />
    );
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start' })).toBeInTheDocument();
  });

  it('renders header when title is provided', () => {
    render(
      <SectionPriceSelector
        sectionId="price-2"
        defaultClasses={defaultClasses}
        plans={plans}
        toggles={{}}
        customOption={{}}
        title={{ fieldType: 'heading2', content: 'Choose your plan' }}
      />
    );
    expect(screen.getByText('Choose your plan')).toBeInTheDocument();
  });
});
