import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionSelectedCat from './SectionSelectedCat';

const { screen } = testingLibrary;

const mockBlocks = [
  {
    blockId: 'block-1',
    blockName: 'blazers',
    title: { content: 'Blazers' },
    media: {
      fieldType: 'image',
      alt: 'Blazers',
      image: {
        attributes: {
          variants: {
            'scaled-medium': { url: 'https://example.com/blazers.jpg' },
          },
        },
      },
    },
  },
  {
    blockId: 'block-2',
    blockName: 'dresses',
    // no title — should fall back to formatted blockName
    media: {
      fieldType: 'image',
      alt: 'Dresses',
      image: {
        attributes: {
          variants: {
            'scaled-medium': { url: 'https://example.com/dresses.jpg' },
          },
        },
      },
    },
  },
];

const defaultClasses = {
  sectionDetails: 'sectionDetails',
  sectionDetailsH: 'sectionDetailsH',
  title: 'title',
  description: 'description',
  ctaButton: 'ctaButton',
  blockContainer: 'blockContainer',
};

describe('SectionSelectedCat', () => {
  it('renders a category card for each block', () => {
    render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={4}
        blocks={mockBlocks}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('pub_categoryLevel1=blazers'));
    expect(links[1]).toHaveAttribute('href', expect.stringContaining('pub_categoryLevel1=dresses'));
  });

  it('shows block title as card name when provided', () => {
    render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={4}
        blocks={mockBlocks}
      />
    );
    expect(screen.getByText('Blazers')).toBeInTheDocument();
  });

  it('formats blockName as card name when no title provided', () => {
    render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={4}
        blocks={mockBlocks}
      />
    );
    expect(screen.getByText('Dresses')).toBeInTheDocument();
  });

  it('renders nothing when blocks are empty', () => {
    const { container } = render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={4}
        blocks={[]}
      />
    );
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('renders section header when title is provided', () => {
    render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={4}
        blocks={mockBlocks}
        title={{ fieldType: 'heading2', content: 'Shop by Category' }}
      />
    );
    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
  });

  it('hides arrows when block count does not exceed numColumns', () => {
    const { container } = render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={4}
        blocks={mockBlocks} // 2 blocks ≤ 4 columns
      />
    );
    // arrows container should have hideArrows class applied
    const arrowsEl = container.querySelector('button[aria-label="AVCarousel.previous"]')
      ?.parentElement;
    expect(arrowsEl?.className).toMatch(/hideArrows/);
  });

  it('uses translated carousel arrow labels', () => {
    render(
      <SectionSelectedCat
        sectionId="av-selected-cats"
        defaultClasses={defaultClasses}
        numColumns={1}
        blocks={mockBlocks}
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
