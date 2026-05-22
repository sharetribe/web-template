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

  it('matches snapshot', () => {
    const { asFragment } = render(<SectionHeroCustom3 {...defaultProps} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
