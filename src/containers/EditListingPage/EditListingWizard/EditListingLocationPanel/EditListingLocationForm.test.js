import React, { act } from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingLocationForm from './EditListingLocationForm';

const { screen, userEvent, fireEvent } = testingLibrary;

const noop = () => null;

beforeAll(() => {
  // Mock window.scroll - otherwise, Jest/JSDOM will print a not-implemented error.
  window.mapboxgl = { accessToken: 'test' };
  window.mapboxSdk = () => ({
    geocoding: {
      forwardGeocode: () => ({
        send: () =>
          Promise.resolve({
            body: { features: [] },
          }),
      }),
    },
  });
});

describe('EditListingDeliveryForm', () => {
  it('Check that shipping fees can be given and submit button activates', async () => {
    const saveActionMsg = 'Save location';
    await act(async () => {
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
    });

    // Pickup fields
    const address = 'EditListingLocationForm.address';
    expect(screen.getByText(address)).toBeInTheDocument();

    const building = 'EditListingLocationForm.building';
    expect(screen.getByText(building)).toBeInTheDocument();

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    await act(async () => {
      userEvent.type(screen.getByTestId('location-search'), 'Erottajankatu 19, Helsinki');
      userEvent.type(screen.getByRole('textbox', { name: building }), 'B');
    });
  });
});
