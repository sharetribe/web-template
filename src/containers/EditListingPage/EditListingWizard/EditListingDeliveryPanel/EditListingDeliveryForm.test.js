import React, { act } from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingDeliveryForm from './EditListingDeliveryForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('Check that shipping fees can be given and submit button activates', async () => {
    const saveActionMsg = 'Save location';
    render(
      <EditListingDeliveryForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        marketplaceCurrency="USD"
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
      />
    );

    // Pickup fields
    const address = 'EditListingDeliveryForm.address';
    expect(screen.getByText(address)).toBeInTheDocument();

    const building = 'EditListingDeliveryForm.building';
    expect(screen.getByText(building)).toBeInTheDocument();

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    await act(async () => {
      // Add shipping price
      userEvent.click(screen.getByLabelText(/EditListingDeliveryForm.shippingLabel/i));
    });
    const shippingOneItemLabel = 'EditListingDeliveryForm.shippingOneItemLabel';
    const shippingAdditionalItemsLabel = 'EditListingDeliveryForm.shippingAdditionalItemsLabel';
    userEvent.type(screen.getByRole('textbox', { name: shippingOneItemLabel }), '10');
    userEvent.type(screen.getByRole('textbox', { name: shippingAdditionalItemsLabel }), '5');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});
