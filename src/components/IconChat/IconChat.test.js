import React from 'react';

import { renderWithProviders as render } from '../../util/testHelpers';
import '@testing-library/jest-dom';

import IconChat from './IconChat';

describe('IconChat', () => {
  it('renders an svg icon', () => {
    const { container } = render(<IconChat />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies a custom className to the svg', () => {
    const { container } = render(<IconChat className="customClass" />);
    expect(container.querySelector('svg')).toHaveClass('customClass');
  });

  it('matches snapshot', () => {
    const { container } = render(<IconChat />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
