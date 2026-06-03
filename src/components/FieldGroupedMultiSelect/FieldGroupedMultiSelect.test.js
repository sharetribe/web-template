import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import FieldGroupedMultiSelect from './FieldGroupedMultiSelect';

const { screen, userEvent } = testingLibrary;

const noop = () => {};

const groups = [
  {
    key: 'standard',
    label: 'Standard',
    options: [
      { option: 's', label: 'Small' },
      { option: 'm', label: 'Medium' },
    ],
  },
  {
    key: 'us',
    label: 'US',
    options: [{ option: 'us-4', label: 'US 4' }],
  },
];

const messages = {
  'FieldGroupedMultiSelect.clearAll': 'Clear all',
  'FieldGroupedMultiSelect.placeholder': 'Select sizes',
  'FieldGroupedMultiSelect.expand': 'Expand',
  'FieldGroupedMultiSelect.collapse': 'Collapse',
  'FieldGroupedMultiSelect.removeOption': 'Remove {label}',
  'FieldGroupedMultiSelect.maxHint': 'Select up to {max}',
};

const FormComponent = props => {
  const { fieldGroups = groups, max, ...rest } = props;

  return (
    <FinalForm
      {...rest}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <FieldGroupedMultiSelect
            id="sizes"
            name="sizes"
            label="Sizes"
            groups={fieldGroups}
            max={max}
          />
          <button type="submit">Submit</button>
        </form>
      )}
    />
  );
};

const renderField = props => render(<FormComponent onSubmit={noop} {...props} />, { messages });

describe('FieldGroupedMultiSelect', () => {
  it('renders a focusable combobox trigger with listbox controls', () => {
    renderField();

    const trigger = screen.getByRole('combobox', { name: 'Sizes' });
    expect(trigger).toHaveAttribute('id', 'sizes');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', 'sizes-listbox');

    trigger.focus();
    expect(trigger).toHaveFocus();
  });

  it('opens with Enter and closes with Escape', async () => {
    const user = userEvent.setup();
    renderField();

    const trigger = screen.getByRole('combobox', { name: 'Sizes' });
    trigger.focus();

    await user.keyboard('[Enter]');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toHaveAttribute('id', 'sizes-listbox');

    await user.keyboard('[Escape]');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens with Space', async () => {
    const user = userEvent.setup();
    renderField();

    const trigger = screen.getByRole('combobox', { name: 'Sizes' });
    trigger.focus();

    await user.keyboard('[Space]');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('moves through options with arrows and toggles the active option with Enter', async () => {
    const user = userEvent.setup();
    renderField();

    const trigger = screen.getByRole('combobox', { name: 'Sizes' });
    trigger.focus();

    await user.keyboard('[ArrowDown]');
    expect(trigger).toHaveAttribute('aria-activedescendant', 'sizes-option-s');

    await user.keyboard('[ArrowDown]');
    expect(trigger).toHaveAttribute('aria-activedescendant', 'sizes-option-m');

    await user.keyboard('[Enter]');
    expect(screen.getByRole('button', { name: 'Remove Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toHaveAttribute('aria-selected', 'true');
  });

  it('removes one selected value without opening the dropdown', async () => {
    const user = userEvent.setup();
    renderField({ initialValues: { sizes: ['s', 'm'] } });

    await user.click(screen.getByRole('button', { name: 'Remove Small' }));

    expect(screen.queryByText('Small')).not.toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears all selected values without opening the dropdown', async () => {
    const user = userEvent.setup();
    renderField({ initialValues: { sizes: ['s', 'm'] } });

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(screen.queryByText('Small')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
    expect(screen.getByText('Select sizes')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not throw when keyboarding an empty option set', async () => {
    const user = userEvent.setup();
    renderField({ fieldGroups: [] });

    const trigger = screen.getByRole('combobox', { name: 'Sizes' });
    trigger.focus();

    await user.keyboard('[ArrowDown][Enter][Escape]');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  describe('with a max', () => {
    it('shows the max hint and disables unselected options once the max is reached', async () => {
      const user = userEvent.setup();
      renderField({ max: 2, initialValues: { sizes: ['s', 'm'] } });

      await user.click(screen.getByRole('combobox', { name: 'Sizes' }));

      expect(screen.getByText('Select up to 2')).toBeInTheDocument();

      const usOption = screen.getByRole('option', { name: 'US 4' });
      expect(usOption).toBeDisabled();
      expect(usOption).toHaveAttribute('aria-disabled', 'true');
    });

    it('blocks selecting a third value', async () => {
      const user = userEvent.setup();
      renderField({ max: 2, initialValues: { sizes: ['s', 'm'] } });

      await user.click(screen.getByRole('combobox', { name: 'Sizes' }));
      await user.click(screen.getByRole('option', { name: 'US 4' }));

      // Not added as a chip — still only the two original values.
      expect(screen.queryByRole('button', { name: 'Remove US 4' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Small' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Medium' })).toBeInTheDocument();
    });

    it('still allows deselecting a value when at the max', async () => {
      const user = userEvent.setup();
      renderField({ max: 2, initialValues: { sizes: ['s', 'm'] } });

      await user.click(screen.getByRole('combobox', { name: 'Sizes' }));
      await user.click(screen.getByRole('option', { name: 'Medium' }));

      expect(screen.queryByRole('button', { name: 'Remove Medium' })).not.toBeInTheDocument();
      // US 4 is now selectable again (back under the max).
      expect(screen.getByRole('option', { name: 'US 4' })).not.toBeDisabled();
    });
  });
});
