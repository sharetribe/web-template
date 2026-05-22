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

  it('matches snapshot', () => {
    const { asFragment } = render(<SectionHeroCustom2 {...defaultProps} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
