import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/test-helpers';

import EditListingDetailsForm from './EditListingDetailsForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('EditListingDetailsForm', () => {
  test('Check that shipping fees can be given and submit button activates', () => {
    const saveActionMsg = 'Save details';

    const selectableListingTypes = [
      {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    ];

    const listingExtendedDataConfig = [
      {
        key: 'category',
        scope: 'public',
        includeForListingTypes: ['sell-bicycles'],
        schemaType: 'enum',
        schemaOptions: [
          { option: 'men', label: 'Men' },
          { option: 'women', label: 'Women' },
          { option: 'kids', label: 'Kids' },
        ],
        indexForSearch: true,
        searchPageConfig: {
          label: 'Amenities',
        },
        listingPageConfig: {
          label: 'Category',
        },
        editListingPageConfig: {
          label: 'Category',
          isDetail: true,
        },
      },
      {
        key: 'amenities',
        scope: 'public',
        includeForListingTypes: [
          'rent-bicycles-daily',
          'rent-bicycles-nightly',
          'rent-bicycles-hourly',
        ],
        schemaType: 'multi-enum',
        schemaOptions: [
          { option: 'towels', label: 'Towels' },
          { option: 'bathroom', label: 'Bathroom' },
          { option: 'swimming_pool', label: 'Swimming pool' },
          { option: 'barbeque', label: 'Barbeque' },
        ],
        indexForSearch: true,
        searchPageConfig: {
          label: 'Amenities',
        },
        listingPageConfig: {
          label: 'Category',
        },
        editListingPageConfig: {
          label: 'Amenities',
        },
      },
    ];

    render(
      <EditListingDetailsForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        listingExtendedDataConfig={listingExtendedDataConfig}
        selectableListingTypes={selectableListingTypes}
        hasExistingListingType={true}
        initialValues={selectableListingTypes[0]}
      />
    );

    // Pickup fields
    const title = 'EditListingDetailsForm.title';
    expect(screen.getByText(title)).toBeInTheDocument();

    const description = 'EditListingDetailsForm.description';
    expect(screen.getByText(description)).toBeInTheDocument();

    // Test that save button is disabled at first
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();

    // Fill mandatory attributes
    userEvent.type(screen.getByRole('textbox', { name: title }), 'My Listing');
    userEvent.type(screen.getByRole('textbox', { name: description }), 'Lorem ipsum');

    // Fill custom listing field
    userEvent.selectOptions(screen.getByLabelText('Category'), 'kids');

    // Test that save button is enabled
    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});
