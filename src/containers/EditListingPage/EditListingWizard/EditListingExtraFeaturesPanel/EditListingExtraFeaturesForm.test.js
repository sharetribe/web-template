import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingExtraFeaturesForm from './EditListingExtraFeaturesForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('EditListingExtraFeaturesForm', () => {
  test('Check that extra features can be given and submit button activates', () => {
    const saveActionMsg = 'Save extra features';
    render(
      <EditListingExtraFeaturesForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        unitType="day"
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
    const extraFeatures = 'ExtraFeatures';
    userEvent.type(screen.getByRole('textbox', { name: extraFeatures }), 'Pannier rack');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});