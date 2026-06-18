import React from 'react';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import '@testing-library/jest-dom';

import SectionAllSizes from './SectionAllSizes';

const { screen } = testingLibrary;

const options = [
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
];

describe('SectionAllSizes', () => {
  it('renders the heading and the selected size chips', () => {
    render(<SectionAllSizes heading="Sizes" options={options} selectedOptions={['s', 'l']} />);
    expect(screen.getByText('Sizes')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('renders only the selected sizes', () => {
    render(<SectionAllSizes heading="Sizes" options={options} selectedOptions={['m']} />);
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.queryByText('S')).not.toBeInTheDocument();
  });

  it('renders nothing when no size is selected', () => {
    render(<SectionAllSizes heading="Sizes" options={options} selectedOptions={[]} />);
    expect(screen.queryByText('Sizes')).not.toBeInTheDocument();
  });

  it('renders nothing without a heading', () => {
    render(<SectionAllSizes options={options} selectedOptions={['s']} />);
    expect(screen.queryByText('S')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <SectionAllSizes heading="Sizes" options={options} selectedOptions={['s']} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
