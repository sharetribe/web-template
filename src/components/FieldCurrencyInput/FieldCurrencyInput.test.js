import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { types as sdkTypes } from '../../util/sdkLoader';
import appSettings from '../../config/settings';
import { CurrencyInput } from './FieldCurrencyInput';

const { Money } = sdkTypes;
const { screen, fireEvent } = testingLibrary;

// USD gives a deterministic en-US currency string ("$1,325.00") regardless of the
// marketplace locale, which is exactly the behavior under test.
const currencyConfig = appSettings.getCurrencyFormatting('USD');

const renderInput = value => {
  const input = {
    value,
    name: 'price',
    onChange: () => {},
    onBlur: () => {},
    onFocus: () => {},
  };
  return render(<CurrencyInput input={input} currencyConfig={currencyConfig} />);
};

describe('CurrencyInput (AV forced en-US formatting)', () => {
  it('formats a Money value en-US ($1,325.00), not the marketplace locale (1.325,00 $)', () => {
    renderInput(new Money(132500, 'USD'));
    const input = screen.getByRole('textbox');
    // Comma thousands + dot decimals + leading symbol — matches formatMoney() display.
    expect(input).toHaveValue('$1,325.00');
    expect(input.value).not.toContain('1.325,00');
  });

  it('uses "." for decimals and "," for thousands', () => {
    renderInput(new Money(100099, 'USD'));
    expect(screen.getByRole('textbox')).toHaveValue('$1,000.99');
  });

  it('reformats typed input to en-US on blur', () => {
    renderInput(new Money(0, 'USD'));
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2500.5' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('$2,500.50');
  });
});
