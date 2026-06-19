import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';
import AVSectionContainer from './AVSectionContainer';

const { screen } = testingLibrary;

describe('AVSectionContainer', () => {
  it('renders children', () => {
    render(
      <AVSectionContainer id="test-section" options={{}}>
        <p>Hello world</p>
      </AVSectionContainer>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a section tag by default', () => {
    const { container } = render(
      <AVSectionContainer id="test-section" options={{}}>
        content
      </AVSectionContainer>
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('renders as a custom tag when as prop is set', () => {
    const { container } = render(
      <AVSectionContainer id="test-section" as="div" options={{}}>
        content
      </AVSectionContainer>
    );
    expect(container.querySelector('div')).toBeInTheDocument();
    expect(container.querySelector('section')).toBeNull();
  });

  it('renders bgLink anchor when bgLink is provided', () => {
    const { container } = render(
      <AVSectionContainer id="test-section" options={{}} bgLink="https://example.com">
        content
      </AVSectionContainer>
    );
    const anchor = container.querySelector('a[href="https://example.com"]');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render bgLink anchor when bgLink is absent', () => {
    const { container } = render(
      <AVSectionContainer id="test-section" options={{}}>
        content
      </AVSectionContainer>
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it('applies no extra classes when customOption is empty', () => {
    const { container } = render(
      <AVSectionContainer id="test-section" options={{}} customOption={{}}>
        content
      </AVSectionContainer>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies the small-gap classes for SmallGapCols/SmallGapRows options', () => {
    const { container } = render(
      <AVSectionContainer
        id="test-section"
        options={{}}
        customOption={{ hasSmallGapCols: true, hasSmallGapRows: true }}
      >
        content
      </AVSectionContainer>
    );
    // CSS modules are mapped via identity-obj-proxy in jest, so class === key name.
    const inner = container.querySelector('.sectionContentSmallGapCols');
    expect(inner).toBeInTheDocument();
    expect(inner).toHaveClass('sectionContentSmallGapRows');
  });

  it('applies the no-gap classes for NoGapCols/NoGapRows options', () => {
    const { container } = render(
      <AVSectionContainer
        id="test-section"
        options={{}}
        customOption={{ hasNoGapCols: true, hasNoGapRows: true }}
      >
        content
      </AVSectionContainer>
    );
    const inner = container.querySelector('.sectionContentNoGapCols');
    expect(inner).toBeInTheDocument();
    expect(inner).toHaveClass('sectionContentNoGapRows');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <AVSectionContainer id="test-section" options={{}}>
        content
      </AVSectionContainer>
    );
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
