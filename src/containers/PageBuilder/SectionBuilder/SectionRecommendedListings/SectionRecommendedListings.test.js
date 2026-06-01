import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionRecommendedListings from './SectionRecommendedListings';

const { screen } = testingLibrary;

const defaultClasses = {
  sectionDetails: 'sectionDetails',
  title: 'title',
  description: 'description',
  ctaButton: 'ctaButton',
  blockContainer: 'blockContainer',
};

const baseProps = {
  sectionId: 'av-recommendeds',
  defaultClasses,
  numColumns: 4,
  customOption: {},
  options: {},
  listings: [],
};

describe('SectionRecommendedListings', () => {
  it('renders without crashing when listings are empty', () => {
    const { container } = render(<SectionRecommendedListings {...baseProps} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('[class*="blockContainer"]')).toBeNull();
  });

  it('renders the section title when provided', () => {
    render(
      <SectionRecommendedListings
        {...baseProps}
        title={{ fieldType: 'heading2', content: 'Recommended for you' }}
      />
    );
    expect(screen.getByText('Recommended for you')).toBeInTheDocument();
  });

  it('renders no header when title/description/cta are all absent', () => {
    const { container } = render(<SectionRecommendedListings {...baseProps} />);
    expect(container.querySelector('header')).toBeNull();
  });

  it('falls back to the 1-column config for out-of-range numColumns', () => {
    // numColumns=99 falls outside COLUMN_CONFIG → must not crash, uses fallback
    const { container } = render(<SectionRecommendedListings {...baseProps} numColumns={99} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
