// src/components/FieldSearchableSelect/FieldSearchableSelect.test.js
import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import FieldSearchableSelect from './FieldSearchableSelect';

const { screen, userEvent } = testingLibrary;

const options = [
  { key: 'adidas', label: 'Adidas' },
  { key: 'nike', label: 'Nike' },
  { key: 'zara', label: 'Zara' },
  { key: 'zara-home', label: 'Zara Home' },
];

const messages = {
  'FieldSearchableSelect.placeholder': 'Search brand…',
  'FieldSearchableSelect.clear': 'Clear',
};

const FormWrapper = ({ initialValues = {}, onSubmit = () => {} } = {}) => (
  <FinalForm
    initialValues={initialValues}
    onSubmit={onSubmit}
    render={({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <FieldSearchableSelect id="brand" name="brand" label="Brand" options={options} />
        <button type="submit">Submit</button>
      </form>
    )}
  />
);

describe('FieldSearchableSelect', () => {
  it('renders the field label', () => {
    render(<FormWrapper />, { messages });
    expect(screen.getByText('Brand')).toBeInTheDocument();
  });

  it('renders the text input with placeholder', () => {
    render(<FormWrapper />, { messages });
    expect(screen.getByPlaceholderText('Search brand…')).toBeInTheDocument();
  });

  it('opens the dropdown when the input is focused', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />, { messages });
    await user.click(screen.getByPlaceholderText('Search brand…'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Adidas')).toBeInTheDocument();
    expect(screen.getByText('Nike')).toBeInTheDocument();
  });

  it('filters options as the user types', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />, { messages });
    const input = screen.getByPlaceholderText('Search brand…');
    await user.click(input);
    await user.type(input, 'zar');
    expect(screen.getByText('Zara')).toBeInTheDocument();
    expect(screen.getByText('Zara Home')).toBeInTheDocument();
    expect(screen.queryByText('Adidas')).not.toBeInTheDocument();
    expect(screen.queryByText('Nike')).not.toBeInTheDocument();
  });

  it('selects an option and closes the dropdown', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />, { messages });
    await user.click(screen.getByPlaceholderText('Search brand…'));
    await user.click(screen.getByText('Nike'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Nike')).toBeInTheDocument();
  });

  it('displays the label of a pre-selected value', () => {
    render(<FormWrapper initialValues={{ brand: 'adidas' }} />, { messages });
    expect(screen.getByDisplayValue('Adidas')).toBeInTheDocument();
  });

  it('shows a clear button when a value is selected', async () => {
    render(<FormWrapper initialValues={{ brand: 'adidas' }} />, { messages });
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('clears the selection when the clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<FormWrapper initialValues={{ brand: 'adidas' }} />, { messages });
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('matches snapshot (empty state)', () => {
    const { asFragment } = render(<FormWrapper />, { messages });
    expect(asFragment().firstChild).toMatchSnapshot();
  });
});
