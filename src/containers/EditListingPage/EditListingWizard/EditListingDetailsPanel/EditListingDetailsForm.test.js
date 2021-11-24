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

const filters = [
  {
    id: 'category',
    label: 'Category',
    wizardPlaceholder: 'Choose…',
    wizardRequired: 'You need to select a category.',
    type: 'SelectSingleFilter',
    group: 'primary',
    queryParamNames: ['pub_category'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'enum',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'men', label: 'Men' },
        { key: 'women', label: 'Women' },
        { key: 'kids', label: 'Kids' },
      ],
    },
  },
  {
    id: 'amenities',
    label: 'Amenities',
    type: 'SelectMultipleFilter',
    group: 'secondary',
    queryParamNames: ['pub_amenities'],
    config: {
      // Schema type options: 'enum', 'multi-enum'
      // Both types can work so that user selects multiple values when filtering search results.
      // With "enum" the functionality will be OR-semantics (Nike OR Adidas OR Salomon)
      // With "multi-enum" it's possible to use both AND and OR semantics with searchMode config.
      schemaType: 'multi-enum',

      // Optional modes: 'has_all', 'has_any'
      // Note: this is relevant only for schema type 'multi-enum'
      // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
      searchMode: 'has_all',

      // "key" is the option you see in Flex Console.
      // "label" is set here for this web app's UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'towels', label: 'Towels' },
        { key: 'bathroom', label: 'Bathroom' },
        { key: 'swimming_pool', label: 'Swimming pool' },
        { key: 'barbeque', label: 'Barbeque' },
      ],
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
        filterConfigs={filters}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
