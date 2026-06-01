import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import { createListing } from '../../../../util/testData';
import SectionSelectedListings from './SectionSelectedListings';

const { screen } = testingLibrary;

const defaultClasses = {
  sectionDetails: 'sectionDetails',
  sectionDetailsH: 'sectionDetailsH',
  title: 'title',
  description: 'description',
  ctaButton: 'ctaButton',
  blockContainer: 'blockContainer',
};

const baseProps = {
  sectionId: 'av-selections',
  defaultClasses,
  numColumns: 4,
  customOption: {},
  options: {},
  listings: [],
};

describe('SectionSelectedListings', () => {
  it('renders without crashing when listings are empty', () => {
    const { container } = render(<SectionSelectedListings {...baseProps} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('[class*="carouselOuter"]')).toBeNull();
  });

  it('renders the section title when provided', () => {
    render(
      <SectionSelectedListings
        {...baseProps}
        title={{ fieldType: 'heading2', content: 'Hand-picked' }}
      />
    );
    expect(screen.getByText('Hand-picked')).toBeInTheDocument();
  });

  it('uses translated carousel arrow labels when listings render', () => {
    const listings = [createListing('a'), createListing('b')];
    render(<SectionSelectedListings {...baseProps} listings={listings} />, {
      messages: { 'AVCarousel.previous': 'Atrás', 'AVCarousel.next': 'Adelante' },
    });
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adelante' })).toBeInTheDocument();
  });

  it('does not render a header when title/description/cta are absent', () => {
    const { container } = render(<SectionSelectedListings {...baseProps} />);
    expect(container.querySelector('header')).toBeNull();
  });
});
