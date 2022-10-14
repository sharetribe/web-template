import React from 'react';
import { renderDeep } from '../../../../util/test-helpers';
import { fakeIntl } from '../../../../util/test-data';
import EditListingDetailsForm from './EditListingDetailsForm';

const noop = () => null;
const selectableTransactionTypes = [
  {
    transactionType: 'sell-bicycles',
    transactionProcessAlias: 'flex-product-default-process/release-1',
    unitType: 'item',
  },
];

const listingExtendedDataConfig = [
  {
    key: 'category',
    scope: 'public',
    includeForTransactionTypes: ['sell-bicycles'],
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
    includeForTransactionTypes: [
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

describe('EditListingDetailsForm', () => {
  it('matches snapshot', () => {
    const tree = renderDeep(
      <EditListingDetailsForm
        intl={fakeIntl}
        dispatch={noop}
        onSubmit={v => v}
        saveActionMsg="Save details"
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        listingExtendedDataConfig={listingExtendedDataConfig}
        selectableTransactionTypes={selectableTransactionTypes}
        hasExistingTransactionType={true}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
