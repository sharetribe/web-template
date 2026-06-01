import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import AVCategoryCard from './AVCategoryCard';

const { screen } = testingLibrary;

// AVCategoryCard requests `original400/800/1200/2400` variants from ResponsiveImage,
// which builds a `srcset` (not `src`) from whichever of those keys are present.
const mockMedia = {
  fieldType: 'image',
  alt: 'Blazers category',
  image: {
    attributes: {
      variants: {
        original400: { url: 'https://example.com/blazers-400.jpg', width: 400, height: 533 },
        original800: { url: 'https://example.com/blazers-800.jpg', width: 800, height: 1066 },
      },
    },
  },
};

describe('AVCategoryCard', () => {
  it('renders with category name from media alt and links to search page', () => {
    render(<AVCategoryCard categoryId="blazers" media={mockMedia} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('pub_categoryLevel1=blazers'));

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('srcset', expect.stringContaining('blazers-400.jpg 400w'));
    expect(img).toHaveAttribute('alt', 'Blazers category');
  });

  it('uses explicit name prop over formatted blockName', () => {
    render(<AVCategoryCard categoryId="dress-party" name="Party Dresses" media={mockMedia} />);
    expect(screen.getByText('Party Dresses')).toBeInTheDocument();
  });

  it('formats categoryId as display name when no name or alt provided', () => {
    // formatCategoryName follows Spanish convention: only first word capitalized
    render(<AVCategoryCard categoryId="dress-party" />);
    expect(screen.getByText('Dress party')).toBeInTheDocument();
  });

  it('renders placeholder div when no media provided', () => {
    const { container } = render(<AVCategoryCard categoryId="blazers" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[class*="imagePlaceholder"]')).not.toBeNull();
  });

  it('builds srcset with multiple variants when available', () => {
    render(<AVCategoryCard categoryId="blazers" media={mockMedia} />);
    const srcset = screen.getByRole('img').getAttribute('srcset');
    expect(srcset).toContain('blazers-400.jpg 400w');
    expect(srcset).toContain('blazers-800.jpg 800w');
  });

  it('omits missing variants from srcset rather than erroring', () => {
    const partialMedia = {
      ...mockMedia,
      image: {
        attributes: {
          variants: {
            original400: { url: 'https://example.com/blazers-400.jpg', width: 400, height: 533 },
          },
        },
      },
    };
    render(<AVCategoryCard categoryId="blazers" media={partialMedia} />);
    const srcset = screen.getByRole('img').getAttribute('srcset');
    expect(srcset).toBe('https://example.com/blazers-400.jpg 400w');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <AVCategoryCard categoryId="blazers" name="Blazers" media={mockMedia} />
    );
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
