import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import BlockWithCols from './BlockWithCols';

const { screen } = testingLibrary;

describe('BlockWithCols', () => {
  it('renders both column titles and texts', () => {
    render(
      <BlockWithCols
        blockId="block-1"
        title={{ fieldType: 'heading2', content: 'Two columns' }}
        col1Title="Left title"
        col1Text="Left body"
        col2Title="Right title"
        col2Text="Right body"
      />
    );
    expect(screen.getByText('Left title')).toBeInTheDocument();
    expect(screen.getByText('Left body')).toBeInTheDocument();
    expect(screen.getByText('Right title')).toBeInTheDocument();
    expect(screen.getByText('Right body')).toBeInTheDocument();
  });

  it('renders the title eyebrow when provided', () => {
    render(
      <BlockWithCols
        blockId="block-eyebrow"
        title={{ fieldType: 'heading2', content: 'Section' }}
        titleEyebrow="Eyebrow"
      />
    );
    expect(screen.getByText('Eyebrow')).toBeInTheDocument();
  });

  it('renders without crashing when no text fields are provided', () => {
    const { container } = render(<BlockWithCols blockId="block-empty" />);
    expect(container.querySelector('#block-empty')).toBeInTheDocument();
  });

  it('applies center alignment when alignment="center"', () => {
    const { container } = render(
      <BlockWithCols
        blockId="block-aligned"
        alignment="center"
        title={{ fieldType: 'heading2', content: 'Centered' }}
      />
    );
    expect(container.querySelector('[class*="alignCenter"]')).toBeTruthy();
  });
});
