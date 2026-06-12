import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionHeroCustom2 from './SectionHeroCustom2';

const { screen } = testingLibrary;

const defaultProps = {
  sectionId: 'av-hero2-home',
  defaultClasses: {},
  options: {},
  blocks: [],
};

describe('SectionHeroCustom2', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectionHeroCustom2 {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <SectionHeroCustom2
        {...defaultProps}
        title={{ fieldType: 'heading1', content: 'Bienvenidos' }}
      />
    );
    expect(screen.getByText('Bienvenidos')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <SectionHeroCustom2
        {...defaultProps}
        description={{ fieldType: 'paragraph', content: 'Tienda de ropa vintage' }}
      />
    );
    expect(screen.getByText('Tienda de ropa vintage')).toBeInTheDocument();
  });

  it('renders no full-section link when bgLink is absent', () => {
    // Previously a missing translation key produced a bogus "AVHero2.<id>.bgLink" link.
    const { container } = render(<SectionHeroCustom2 {...defaultProps} />);
    expect(container.querySelector('a[aria-hidden="true"]')).toBeNull();
  });

  it('renders a full-section background link when bgLink is provided', () => {
    const { container } = render(<SectionHeroCustom2 {...defaultProps} bgLink="/s" />);
    const overlay = container.querySelector('a[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('href', '/s');
  });

  const ctaDefaultClasses = {
    ctaButtonBlue: 'ctaButtonBlue',
    ctaButtonPurple: 'ctaButtonPurple',
    rounded: 'rounded',
    ctaButtonPrimary: 'primary',
    ctaButtonSecondary: 'secondary',
  };
  const cta = (content, href) => ({ fieldType: 'internalButtonLink', href, content });

  it('flows Section Name CTA tokens to both buttons when no cta1Style/cta2Style', () => {
    render(
      <SectionHeroCustom2
        {...defaultProps}
        sectionName="Hero - SectionCtaBtnBlue - Rounded"
        defaultClasses={ctaDefaultClasses}
        callToAction={cta('One', '/a')}
        callToAction2={cta('Two', '/b')}
      />
    );
    const b1 = screen.getByText('One').closest('a');
    const b2 = screen.getByText('Two').closest('a');
    expect(b1.className).toContain('ctaButtonBlue');
    expect(b1.className).toContain('rounded');
    expect(b2.className).toContain('ctaButtonBlue');
    expect(b2.className).toContain('rounded');
  });

  it('lets explicit cta1Style/cta2Style win over Section Name tokens', () => {
    render(
      <SectionHeroCustom2
        {...defaultProps}
        sectionName="Hero - SectionCtaBtnBlue"
        cta1Style="purple"
        defaultClasses={ctaDefaultClasses}
        callToAction={cta('One', '/a')}
      />
    );
    const b1 = screen.getByText('One').closest('a');
    expect(b1.className).toContain('ctaButtonPurple');
    expect(b1.className).not.toContain('ctaButtonBlue');
  });

  it('falls back to primary/secondary when neither style nor section tokens are set', () => {
    render(
      <SectionHeroCustom2
        {...defaultProps}
        sectionName="Hero"
        defaultClasses={ctaDefaultClasses}
        callToAction={cta('One', '/a')}
        callToAction2={cta('Two', '/b')}
      />
    );
    expect(screen.getByText('One').closest('a').className).toContain('primary');
    expect(screen.getByText('Two').closest('a').className).toContain('secondary');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<SectionHeroCustom2 {...defaultProps} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
