import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import FieldSwatch, { swatchColors, swatchBg } from './FieldSwatch';

const { screen } = testingLibrary;

const FormWrapper = ({ initialValues = {}, value = 'rojo' } = {}) => (
  <FinalForm
    initialValues={initialValues}
    onSubmit={() => {}}
    render={() => <FieldSwatch id={`swatch-${value}`} name="color" value={value} label={value} />}
  />
);

describe('FieldSwatch', () => {
  it('exports a swatchColors map with the expected AV colors', () => {
    expect(swatchColors.rojo).toBe('#ff0000');
    expect(swatchColors.negro).toBe('black');
    expect(swatchColors.blanco).toBe('white');
    expect(Object.keys(swatchColors).length).toBeGreaterThanOrEqual(14);
  });

  it('exports a swatchBg map for printed pattern swatches', () => {
    expect(swatchBg).toEqual(
      expect.objectContaining({
        'animal-print': expect.any(String),
        'floral-print': expect.any(String),
        multicolor: expect.any(String),
      })
    );
  });

  it('renders an input + label for the given value', () => {
    render(<FormWrapper value="rojo" />);
    expect(screen.getByLabelText('rojo')).toBeInTheDocument();
  });

  it('renders the swatch when value matches a color', () => {
    const { container } = render(<FormWrapper value="azul" />);
    const swatch = container.querySelector('span[style*="background"]');
    expect(swatch).toBeTruthy();
  });

  it('renders without a background style for unknown values', () => {
    const { container } = render(<FormWrapper value="not-a-color" />);
    const swatch = container.querySelector('span[style*="background"]');
    expect(swatch).toBeNull();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<FormWrapper value="negro" />);
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
