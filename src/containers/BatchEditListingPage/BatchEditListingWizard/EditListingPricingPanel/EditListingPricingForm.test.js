import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingPricingForm from './EditListingPricingForm';

const { screen, userEvent, fireEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('Check that price can be given and submit button activates', () => {
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
    userEvent.type(screen.getByRole('textbox', { name: price }), '10');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});
