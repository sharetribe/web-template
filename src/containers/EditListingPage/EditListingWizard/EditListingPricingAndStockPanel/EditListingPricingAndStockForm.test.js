import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';

const { screen, userEvent, fireEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('Check that price can be given and submit button activates', () => {
    const saveActionMsg = 'Save price';
    render(
      <EditListingPricingAndStockForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        marketplaceCurrency="USD"
        listingMinimumPriceSubUnits={0}
        unitType="item"
        listingType={{ listingType: 'sell-bikes', stockType: 'multipleItems' }}
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
    const price = 'EditListingPricingAndStockForm.pricePerProduct';
    userEvent.type(screen.getByRole('textbox', { name: price }), '10');
    const stock = 'EditListingPricingAndStockForm.stockLabel';
    userEvent.type(screen.getByRole('spinbutton', { name: stock }), '10');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});
