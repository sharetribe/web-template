import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingLocationForm from './EditListingLocationForm';

const { screen, userEvent, fireEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('Check that shipping fees can be given and submit button activates', () => {
    const saveActionMsg = 'Save location';
    render(
      <EditListingLocationForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
      />
    );

    // Pickup fields
    const address = 'EditListingLocationForm.address';
    expect(screen.getByText(address)).toBeInTheDocument();

    const building = 'EditListingLocationForm.building';
    expect(screen.getByText(building)).toBeInTheDocument();

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    // TODO: this should be tested some other way (address is actually a LocationAutocompleteInput, which is code-splitted)
    // userEvent.type(screen.getByRole('textbox', { name: address }), 'Erottajankatu 19, Helsinki');
    userEvent.type(screen.getByRole('textbox', { name: building }), 'B');
  });
});
