import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionHeroCustom from './SectionHeroCustom';

const { screen } = testingLibrary;

const defaultClasses = {
  sectionDetails: 'sectionDetails',
  title: 'title',
  description: 'description',
  ctaButton: 'ctaButton',
  ctaButtonPrimary: 'ctaButtonPrimary',
  ctaButtonSecondary: 'ctaButtonSecondary',
};

describe('SectionHeroCustom', () => {
  it('renders title and description fields when provided', () => {
    render(
      <SectionHeroCustom
        sectionId="hero-1"
        defaultClasses={defaultClasses}
        title={{ fieldType: 'heading1', content: 'Welcome to Archivo Vintach' }}
        description={{ fieldType: 'paragraph', content: 'Curated vintage finds.' }}
        customOption={{}}
      />
    );
    expect(screen.getByText('Welcome to Archivo Vintach')).toBeInTheDocument();
    expect(screen.getByText('Curated vintage finds.')).toBeInTheDocument();
  });

  it('renders without a header when no title/description/cta are provided', () => {
    const { container } = render(
      <SectionHeroCustom sectionId="hero-empty" defaultClasses={defaultClasses} customOption={{}} />
    );
    expect(container.querySelector('header')).toBeNull();
  });

  it('applies shortHero modifier when customOption.isShortHero is true', () => {
    const { container } = render(
      <SectionHeroCustom
        sectionId="hero-short"
        defaultClasses={defaultClasses}
        customOption={{ isShortHero: true }}
        title={{ fieldType: 'heading1', content: 'Short hero' }}
      />
    );
    expect(container.querySelector('[class*="shortHero"]')).toBeTruthy();
  });
});
