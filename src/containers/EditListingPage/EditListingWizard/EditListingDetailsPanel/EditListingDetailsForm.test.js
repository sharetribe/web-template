import React from 'react';
import { renderDeep } from '../../../../util/test-helpers';
import { fakeIntl } from '../../../../util/test-data';
import EditListingDetailsForm from './EditListingDetailsForm';

const noop = () => null;
const processInfos = [
  {
    name: 'flex-product-default-process',
    alias: 'release-1',
    unitTypes: ['item'],
  },
];

const listingExtendedDataConfig = [
  {
    key: 'category',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: ['Men', 'Women', 'Kids'],
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
    includeForProcessAliases: ['flex-booking-default-process/release-1'],
    schemaType: 'multi-enum',
    schemaOptions: ['Towels', 'Bathroom', 'Swimming pool', 'Barbeque'],
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
        processInfos={processInfos}
        listingExtendedDataConfig={listingExtendedDataConfig}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
