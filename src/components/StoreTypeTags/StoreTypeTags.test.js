import React from 'react';
import '@testing-library/jest-dom';

import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';
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

  it('resolves labels from hosted tipoTienda user-field config', () => {
    const config = {
      ...getHostedConfiguration(),
      userFields: {
        userFields: [
          {
            key: 'tipoTienda',
            scope: 'public',
            schemaType: 'multi-enum',
            enumOptions: [
              { option: 'trending', label: 'Trending' },
              { option: 'holiday', label: 'Holiday' },
            ],
            userTypeConfig: { limitToUserTypeIds: false },
          },
        ],
      },
    };

    render(<StoreTypeTags author={author(['trending'])} />, { config });
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('renders all chips when max is 0', () => {
    render(<StoreTypeTags author={author(['trending', 'holiday', 'birthday'])} max={0} />);
    expect(screen.getByText('trending')).toBeInTheDocument();
    expect(screen.getByText('holiday')).toBeInTheDocument();
    expect(screen.getByText('birthday')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<StoreTypeTags author={author(['trending', 'holiday'])} />, {
      messages: { 'StoreTypeTags.ariaLabel': 'Store type tags' },
    });
    expect(asFragment()).toMatchSnapshot();
  });
});
