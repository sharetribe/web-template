import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import SectionVideoSection from './SectionVideoSection';

const { screen } = testingLibrary;

const defaultProps = {
  sectionId: 'av-video-home',
  defaultClasses: {},
  options: {},
};

describe('SectionVideoSection', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectionVideoSection {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a video element when videoUrl is provided', () => {
    const { container } = render(
      <SectionVideoSection {...defaultProps} videoUrl="https://example.com/video.mp4" />
    );
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it('renders title field when provided', () => {
    render(
      <SectionVideoSection
        {...defaultProps}
        title={{ fieldType: 'heading2', content: 'Nuestra Historia' }}
      />
    );
    expect(screen.getByText('Nuestra Historia')).toBeInTheDocument();
  });

  it('renders description field when provided', () => {
    render(
      <SectionVideoSection
        {...defaultProps}
        description={{ fieldType: 'paragraph', content: 'Moda con propósito' }}
      />
    );
    expect(screen.getByText('Moda con propósito')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<SectionVideoSection {...defaultProps} />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
