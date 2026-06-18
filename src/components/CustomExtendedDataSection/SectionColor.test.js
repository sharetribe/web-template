import React from 'react';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import '@testing-library/jest-dom';

import SectionColor from './SectionColor';

const { screen } = testingLibrary;

const options = [
  { key: 'red', label: 'Red' },
  { key: 'blue', label: 'Blue' },
];

describe('SectionColor', () => {
  it('renders the heading and the selected color labels', () => {
    render(<SectionColor heading="Color" options={options} selectedOptions={['red', 'blue']} />);
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('renders only the selected colors', () => {
    render(<SectionColor heading="Color" options={options} selectedOptions={['red']} />);
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.queryByText('Blue')).not.toBeInTheDocument();
  });

  it('renders nothing when no option is selected', () => {
    render(<SectionColor heading="Color" options={options} selectedOptions={[]} />);
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
  });

  it('renders nothing without a heading', () => {
    render(<SectionColor options={options} selectedOptions={['red']} />);
    expect(screen.queryByText('Red')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <SectionColor heading="Color" options={options} selectedOptions={['red']} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
