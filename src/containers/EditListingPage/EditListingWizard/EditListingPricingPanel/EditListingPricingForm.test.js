import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingPricingForm, {
  EditListingPricingForm as NamedEditListingPricingForm,
} from './EditListingPricingForm';

const { screen, userEvent, fireEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('Check that price can be given and submit button activates', async () => {
    const user = userEvent.setup();
    const saveActionMsg = 'Save price';
    render(
      <EditListingPricingForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        marketplaceCurrency="USD"
        unitType="day"
        listingMinimumPriceSubUnits={0}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
      />
    );

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    // Fill mandatory attributes
    const price = 'EditListingPricingForm.pricePerProduct';
    await user.type(screen.getByRole('textbox', { name: price }), '10');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});

const baseProps = {
  marketplaceCurrency: 'MXN',
  unitType: 'item',
  listingTypeConfig: { transactionType: { process: 'default-purchase' } },
  saveActionMsg: 'Save',
  onSubmit: () => {},
  showPackageSize: true,
  packageSizeLocked: false,
};

describe('EditListingPricingForm package size', () => {
  test('renders the package size select when showPackageSize is true', () => {
    render(<NamedEditListingPricingForm {...baseProps} />);
    expect(screen.getByLabelText(/EditListingPricingForm.packageSizeLabel/i)).toBeInTheDocument();
  });

  test('does not render the select when showPackageSize is false', () => {
    render(<NamedEditListingPricingForm {...baseProps} showPackageSize={false} />);
    expect(
      screen.queryByLabelText(/EditListingPricingForm.packageSizeLabel/i)
    ).not.toBeInTheDocument();
  });
});
