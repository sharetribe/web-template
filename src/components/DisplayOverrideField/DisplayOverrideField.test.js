import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import DisplayOverrideField from './DisplayOverrideField';

const { screen, userEvent } = testingLibrary;

const noop = () => {};

const allSizesFieldConfig = {
  key: 'all_sizes',
  scope: 'public',
  schemaType: 'multi-enum',
  enumOptions: [
    { option: 'unitalla', label: 'One size' },
    { option: 'xxs', label: 'Double extra small' },
    { option: 'xs', label: 'Extra small' },
    { option: 's', label: 'Small' },
    { option: 'm', label: 'Medium' },
    { option: 'l', label: 'Large' },
    { option: 'xl', label: 'Extra large' },
    { option: 'xxl', label: 'Double extra large' },
    { option: 'xxxl', label: 'Triple extra large' },
    { option: 'mx_22', label: 'MX 22' },
    { option: 'mx_24', label: 'MX 24' },
    { option: 'mx_26', label: 'MX 26' },
    { option: 'mx_28', label: 'MX 28' },
    { option: 'mx_30', label: 'MX 30' },
    { option: 'mx_32', label: 'MX 32' },
    { option: 'mx_34', label: 'MX 34' },
    { option: 'mx_36', label: 'MX 36' },
    { option: 'mx_38', label: 'MX 38' },
    { option: 'mx_40', label: 'MX 40' },
    { option: 'mx_42', label: 'MX 42' },
    { option: 'mx_44', label: 'MX 44' },
    { option: 'us_00', label: 'US 00' },
    { option: 'us_0', label: 'US 0' },
    { option: 'us_2', label: 'US 2' },
    { option: 'us_4', label: 'US 4' },
    { option: 'us_6', label: 'US 6' },
    { option: 'us_8', label: 'US 8' },
    { option: 'us_10', label: 'US 10' },
    { option: 'us_12', label: 'US 12' },
    { option: 'us_14', label: 'US 14' },
    { option: 'us_16', label: 'US 16' },
    { option: 'curvy_1x', label: '1X' },
    { option: 'curvy_2x', label: '2X' },
    { option: 'curvy_3x', label: '3X' },
    { option: 'curvy_4x', label: '4X' },
    { option: 'curvy_5x', label: '5X' },
    { option: 'curvy_6x', label: '6X' },
  ],
  saveConfig: {
    label: 'Sizes',
  },
};

const FormComponent = () => (
  <FinalForm
    onSubmit={noop}
    render={({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <DisplayOverrideField
          name="pub_all_sizes"
          fieldConfig={allSizesFieldConfig}
          formId="listing"
        />
      </form>
    )}
  />
);

describe('DisplayOverrideField', () => {
  it('localizes grouped size labels and derives option labels from enumOptions', async () => {
    const user = userEvent.setup();

    render(<FormComponent />, {
      messages: {
        'ListingField.allSizes.group.standard': 'Translated standard sizes',
        'FieldGroupedMultiSelect.placeholder': 'Select sizes',
        'FieldGroupedMultiSelect.expand': 'Expand',
        'FieldGroupedMultiSelect.collapse': 'Collapse',
      },
    });

    await user.click(screen.getByRole('combobox', { name: 'Sizes' }));

    expect(screen.getByText('Translated standard sizes')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'One size' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Double extra small' })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('option')
        .slice(0, 4)
        .map(option => option.textContent.trim())
    ).toEqual(['One size', 'Double extra small', 'Extra small', 'Small']);
  });
});
