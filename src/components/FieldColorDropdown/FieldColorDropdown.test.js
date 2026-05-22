import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import FieldColorDropdown from './FieldColorDropdown';

const { screen, userEvent } = testingLibrary;

const options = [
  { key: 'negro', label: 'Negro' },
  { key: 'blanco', label: 'Blanco' },
  { key: 'rosa', label: 'Rosa' },
];

const messages = {
  'FieldColorDropdown.toggle': 'Choose colors',
  'FieldColorDropdown.noSelection': 'No color selected',
};

const FormWrapper = ({ initialValues = {}, onSubmit = () => {} } = {}) => (
  <FinalForm
    initialValues={initialValues}
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <FieldColorDropdown id="color" name="color" label="Color" options={options} />
        <button type="submit">Submit</button>
      </form>
    )}
  />
);

describe('FieldColorDropdown', () => {
  it('renders the field label', () => {
    render(<FormWrapper />, { messages });
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('opens the color panel on toggle click', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />, { messages });
    const toggle = screen.getByRole('button', { name: /▼/ });
    await user.click(toggle);
    expect(screen.getByText('Negro')).toBeInTheDocument();
    expect(screen.getByText('Blanco')).toBeInTheDocument();
    expect(screen.getByText('Rosa')).toBeInTheDocument();
  });

  it('selects a color when clicked', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />, { messages });
    await user.click(screen.getByRole('button', { name: /▼/ }));
    await user.click(screen.getByText('Negro'));
    // panel stays open after selection
    expect(screen.getByText('Negro')).toBeInTheDocument();
  });

  it('renders with pre-selected values from initialValues', async () => {
    const user = userEvent.setup();
    render(<FormWrapper initialValues={{ color: ['rosa'] }} />, { messages });
    await user.click(screen.getByRole('button', { name: /▼/ }));
    expect(screen.getByText('Rosa')).toBeInTheDocument();
  });

  it('matches snapshot (closed state)', () => {
    const { asFragment } = render(<FormWrapper />, { messages });
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
