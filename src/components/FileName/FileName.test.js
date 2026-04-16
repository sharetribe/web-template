import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import FileName from './FileName';

const { screen } = testingLibrary;

describe('FileName', () => {
  it('renders base name and extension as separate elements', () => {
    const { container } = render(<FileName name="document.pdf" />);
    expect(screen.getByText('document')).toBeInTheDocument();
    expect(screen.getByText('.pdf')).toBeInTheDocument();
    expect(container.firstChild.children).toHaveLength(2);
  });

  it('renders only base name span when filename has no extension', () => {
    const { container } = render(<FileName name="README" />);
    expect(screen.getByText('README')).toBeInTheDocument();
    expect(container.firstChild.children).toHaveLength(1);
  });

  it('splits at the last dot for compound extensions', () => {
    render(<FileName name="archive.tar.gz" />);
    expect(screen.getByText('archive.tar')).toBeInTheDocument();
    expect(screen.getByText('.gz')).toBeInTheDocument();
  });

  it('treats dot-first filenames as having no extension', () => {
    const { container } = render(<FileName name=".gitignore" />);
    expect(screen.getByText('.gitignore')).toBeInTheDocument();
    expect(container.firstChild.children).toHaveLength(1);
  });

  it('uses className prop instead of the default root class', () => {
    const { container } = render(<FileName name="document.pdf" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without crashing when name is undefined', () => {
    const { container } = render(<FileName name={undefined} />);
    expect(container.firstChild).not.toBeNull();
    expect(container.firstChild.children).toHaveLength(1);
  });
});
