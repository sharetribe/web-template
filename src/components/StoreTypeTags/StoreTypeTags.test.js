import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import StoreTypeTags from './StoreTypeTags';

const { screen } = testingLibrary;

// No userFields configured here, so labels fall back to the raw values
// (label resolution is unit-tested in configAV.test.js).
const author = (tipoTienda, userType = 'vendedor-tienda') => ({
  attributes: { profile: { publicData: { userType, tipoTienda } } },
});

describe('StoreTypeTags', () => {
  it('renders a chip per tipoTienda value', () => {
    render(<StoreTypeTags author={author(['trending', 'holiday'])} />);
    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
  });

  it('renders nothing for non-store authors', () => {
    const { container } = render(<StoreTypeTags author={author(['trending'], 'comprador')} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('caps the number of chips at max', () => {
    render(<StoreTypeTags author={author(['trending', 'holiday', 'birthday'])} max={2} />);
    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
    expect(screen.queryByText('birthday')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<StoreTypeTags author={author(['trending', 'holiday'])} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
