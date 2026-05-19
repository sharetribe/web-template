import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingFilesForm from './EditListingFilesForm';

const { screen } = testingLibrary;

const noop = () => null;

describe('EditListingFilesForm', () => {
  it('renders with submit button enabled', () => {
    const saveActionMsg = 'Next';
    render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
      />
    );

    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});
