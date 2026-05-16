import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import { createListing, createUser, fakeIntl } from '../../../../util/testData';
import SectionTagCatListings from './SectionTagCatListings';

const { screen } = testingLibrary;

const defaultClasses = {
  sectionDetails: 'sectionDetails',
  sectionDetailsH: 'sectionDetailsH',
  title: 'title',
  description: 'description',
  ctaButton: 'ctaButton',
  blockContainer: 'blockContainer',
};

const makeListing = id => createListing(id, {}, { author: createUser(`user-${id}`) });

describe('SectionTagCatListings', () => {
  it('renders a carousel item for each listing', () => {
    const listings = [makeListing('listing-1'), makeListing('listing-2'), makeListing('listing-3')];

    render(
      <SectionTagCatListings
        sectionId="av-tag-listings-hot"
        defaultClasses={defaultClasses}
        numColumns={3}
        listings={listings}
        intl={fakeIntl}
      />
    );

    // AVListingCard renders a link per listing
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(listings.length);
  });

  it('renders nothing when listings array is empty', () => {
    const { container } = render(
      <SectionTagCatListings
        sectionId="av-tag-listings-hot"
        defaultClasses={defaultClasses}
        numColumns={3}
        listings={[]}
      />
    );
    expect(container.querySelector('.carouselOuter')).toBeNull();
  });

  it('renders section header when title is provided', () => {
    render(
      <SectionTagCatListings
        sectionId="av-tag-listings-hot"
        defaultClasses={defaultClasses}
        numColumns={3}
        listings={[makeListing('listing-1')]}
        title={{ fieldType: 'heading2', content: 'Hot List' }}
      />
    );
    expect(screen.getByText('Hot List')).toBeInTheDocument();
  });

  it('hides arrows when listing count does not exceed numColumns', () => {
    const { container } = render(
      <SectionTagCatListings
        sectionId="av-tag-listings-hot"
        defaultClasses={defaultClasses}
        numColumns={4}
        listings={[makeListing('listing-1'), makeListing('listing-2')]} // 2 ≤ 4
      />
    );
    const arrowsEl = container.querySelector('button[aria-label="AVCarousel.previous"]')
      ?.parentElement;
    expect(arrowsEl?.className).toMatch(/hideArrows/);
  });

  it('shows arrows when listing count exceeds numColumns', () => {
    const listings = [
      makeListing('l1'),
      makeListing('l2'),
      makeListing('l3'),
      makeListing('l4'),
      makeListing('l5'),
    ];
    const { container } = render(
      <SectionTagCatListings
        sectionId="av-tag-listings-hot"
        defaultClasses={defaultClasses}
        numColumns={3}
        listings={listings} // 5 > 3
      />
    );
    const arrowsEl = container.querySelector('button[aria-label="AVCarousel.previous"]')
      ?.parentElement;
    expect(arrowsEl?.className).not.toMatch(/hideArrows/);
  });

  it('uses translated carousel arrow labels', () => {
    const listings = [makeListing('l1'), makeListing('l2')];
    render(
      <SectionTagCatListings
        sectionId="av-tag-listings-hot"
        defaultClasses={defaultClasses}
        numColumns={1}
        listings={listings}
      />,
      {
        messages: {
          'AVCarousel.previous': 'Back',
          'AVCarousel.next': 'Forward',
        },
      }
    );

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
  });
});
