import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import AVListingDetails from './AVListingDetails';

const { screen, fireEvent } = testingLibrary;

const listingFieldConfigs = [
  {
    key: 'brand',
    schemaType: 'enum',
    enumOptions: [{ option: 'prada', label: 'Prada' }],
    showConfig: { label: 'Marca' },
  },
  {
    key: 'all_sizes',
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'xs', label: 'XS' }],
    showConfig: { label: 'Talla' },
  },
  {
    key: 'estado',
    schemaType: 'enum',
    enumOptions: [{ option: 'buen-estado', label: 'Buen estado' }],
    showConfig: { label: 'Condición' },
  },
  {
    key: 'color',
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'rojo', label: 'Rojo' }],
    showConfig: { label: 'Color' },
  },
  {
    key: 'genero',
    schemaType: 'enum',
    enumOptions: [{ option: 'unisex', label: 'Unisex' }],
    showConfig: { label: 'Género' },
  },
];

const categoryConfiguration = {
  key: 'categoryLevel',
  categories: [{ id: 'ropa', name: 'Ropa', subcategories: [] }],
};

const publicData = {
  brand: 'prada',
  all_sizes: ['xs'],
  estado: 'buen-estado',
  categoryLevel1: 'ropa',
  color: ['rojo'],
  genero: 'unisex',
};

const renderDetails = (overrides = {}) =>
  render(
    <AVListingDetails
      publicData={publicData}
      listingFieldConfigs={listingFieldConfigs}
      categoryConfiguration={categoryConfiguration}
      description="Short description"
      {...overrides}
    />
  );

describe('AVListingDetails', () => {
  it('renders the brand as a search link with the resolved label', () => {
    renderDetails();
    const brand = screen.getByRole('link', { name: 'Prada' });
    expect(brand).toHaveAttribute('href', expect.stringContaining('pub_brand=prada'));
  });

  it('renders size, estado, category, color and genero search links', () => {
    renderDetails();
    expect(screen.getByRole('link', { name: 'XS' })).toHaveAttribute(
      'href',
      expect.stringContaining('pub_all_sizes=xs')
    );
    expect(screen.getByRole('link', { name: 'Buen estado' })).toHaveAttribute(
      'href',
      expect.stringContaining('pub_estado=buen-estado')
    );
    expect(screen.getByRole('link', { name: 'Ropa' })).toHaveAttribute(
      'href',
      expect.stringContaining('pub_categoryLevel1=ropa')
    );
    expect(screen.getByRole('link', { name: 'Rojo' })).toHaveAttribute(
      'href',
      expect.stringContaining('pub_color=rojo')
    );
    expect(screen.getByRole('link', { name: 'Unisex' })).toHaveAttribute(
      'href',
      expect.stringContaining('pub_genero=unisex')
    );
  });

  it('toggles a long description with a show-more button', () => {
    const longText = 'x'.repeat(300);
    renderDetails({ description: longText });
    // Excerpt is truncated, toggle button present
    const toggle = screen.getByRole('button');
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    // After expanding, the full text is shown
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('does not render a toggle for short descriptions', () => {
    renderDetails({ description: 'tiny' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = renderDetails();
    expect(asFragment()).toMatchSnapshot();
  });
});
