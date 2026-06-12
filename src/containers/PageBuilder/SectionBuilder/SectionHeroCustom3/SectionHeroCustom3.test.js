import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionHeroCustom3 from './SectionHeroCustom3';

const { screen } = testingLibrary;

const block = (id, title) => ({
  blockId: id,
  blockName: id,
  title: { fieldType: 'heading2', content: title },
  media: null,
  callToAction: null,
});

const mediaBlock = (id, title, { imageHref, ctaHref } = {}) => ({
  blockId: id,
  blockName: id,
  title: { fieldType: 'heading2', content: title },
  text: null,
  media: {
    fieldType: 'image',
    alt: `${title} alt`,
    image: {
      attributes: {
        variants: { original800: { url: 'http://img/x.jpg', width: 800, height: 600 } },
      },
    },
    ...(imageHref ? { link: { fieldType: 'internalButtonLink', href: imageHref } } : {}),
  },
  callToAction: ctaHref
    ? { fieldType: 'internalButtonLink', content: `${title} CTA`, href: ctaHref }
    : null,
  alignment: 'left',
});

const defaultProps = {
  sectionId: 'av-hero3-main',
  defaultClasses: {},
  options: {},
  blocks: [block('left', 'Colección Primavera')],
};

describe('SectionHeroCustom3', () => {
  it('returns null with no blocks', () => {
    const { container } = render(<SectionHeroCustom3 {...defaultProps} blocks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders block titles', () => {
    render(
      <SectionHeroCustom3
        {...defaultProps}
        blocks={[block('left', 'Colección Primavera'), block('right', 'Colección Otoño')]}
      />
    );
    expect(screen.getByText('Colección Primavera')).toBeInTheDocument();
    expect(screen.getByText('Colección Otoño')).toBeInTheDocument();
  });

  it('uses the block media image as the panel background', () => {
    const { container } = render(
      <SectionHeroCustom3 {...defaultProps} blocks={[mediaBlock('left', 'Spring')]} />
    );
    const half = container.querySelector('[style*="background-image"]');
    expect(half).toBeInTheDocument();
    expect(half.getAttribute('style')).toContain('http://img/x.jpg');
  });

  it('links the whole panel via the block image link, separate from the CTA button link', () => {
    const { container } = render(
      <SectionHeroCustom3
        {...defaultProps}
        blocks={[mediaBlock('left', 'Spring', { imageHref: '/image-dest', ctaHref: '/cta-dest' })]}
      />
    );

    // The CTA button keeps its own link from callToAction.
    const button = screen.getByText('Spring CTA').closest('a');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/cta-dest');

    // The whole-panel overlay link comes from the block image link — a different
    // destination — labelled by the block title.
    const overlay = container.querySelector(`.${'bgLinkOverlay'}`);
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('href', '/image-dest');
    expect(overlay).toHaveAttribute('aria-label', 'Spring');

    // No invalid nested anchors: overlay and button are siblings.
    expect(overlay.querySelector('a')).toBeNull();
    expect(button.querySelector('a')).toBeNull();
  });

  it('renders the panel overlay link from the image link even with no CTA', () => {
    const { container } = render(
      <SectionHeroCustom3
        {...defaultProps}
        blocks={[mediaBlock('left', 'Spring', { imageHref: '/image-dest' })]}
      />
    );
    const overlay = container.querySelector(`.${'bgLinkOverlay'}`);
    expect(overlay).toHaveAttribute('href', '/image-dest');
    expect(screen.queryByText('Spring CTA')).not.toBeInTheDocument();
  });

  it('does not render a panel overlay link when the block has no image link', () => {
    const { container } = render(
      <SectionHeroCustom3
        {...defaultProps}
        blocks={[mediaBlock('left', 'Spring', { ctaHref: '/cta-dest' })]}
      />
    );
    expect(container.querySelector(`.${'bgLinkOverlay'}`)).toBeNull();
    // ...but the CTA button still renders.
    expect(screen.getByText('Spring CTA')).toBeInTheDocument();
  });

  it('styles the CTA button from block name tokens', () => {
    const blk = mediaBlock('left', 'Spring', { ctaHref: '/cta' });
    blk.blockName = 'left blockCtaBtnBlue :: rounded ::';
    render(
      <SectionHeroCustom3
        {...defaultProps}
        defaultClasses={{
          ctaButtonBlue: 'ctaButtonBlue',
          rounded: 'rounded',
          ctaButtonPrimary: 'primary',
        }}
        blocks={[blk]}
      />
    );
    const button = screen.getByText('Spring CTA').closest('a');
    expect(button.className).toContain('ctaButtonBlue');
    expect(button.className).toContain('rounded');
  });

  it('falls back to the section primary button when the block has no style tokens', () => {
    render(
      <SectionHeroCustom3
        {...defaultProps}
        defaultClasses={{ ctaButtonPrimary: 'primary' }}
        blocks={[mediaBlock('left', 'Spring', { ctaHref: '/cta' })]}
      />
    );
    const button = screen.getByText('Spring CTA').closest('a');
    expect(button.className).toContain('primary');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<SectionHeroCustom3 {...defaultProps} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
