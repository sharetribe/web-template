/* eslint-disable no-console */
import EditListingDetailsForm from './EditListingDetailsForm';
import defaultConfig from '../../../../config/configDefault';

const noop = () => {};
const selectableListingTypes = [
  {
    listingType: 'sell-bicycles',
    transactionProcessAlias: 'default-purchase/release-1',
    unitType: 'item',
  },
];

export const WithInitialValues = {
  component: EditListingDetailsForm,
  props: {
    formId: 'WithInitialValues',
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableListingTypes: selectableListingTypes,
    onListingTypeChange: noop,
    listingConfig: defaultConfig.listing,
    initialValues: {
      title: 'Listing',
      description: 'Lorem ipsum',
      listingType: 'sell-bicycles',
      transactionProcessAlias: 'default-purchase/release-1',
      unitType: 'item',
    },
  },
  group: 'page:EditListingPage',
};

const selectableListingTypes2 = [
  {
    listingType: 'rent-bicycles',
    transactionProcessAlias: 'default-booking/release-1',
    unitType: 'day',
  },
  {
    listingType: 'sell-bicycles',
    transactionProcessAlias: 'default-purchase/release-1',
    unitType: 'item',
  },
];

export const MultipleProcessInfos = {
  component: EditListingDetailsForm,
  props: {
    formId: 'MultipleProcessInfos',
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableListingTypes: selectableListingTypes2,
    onListingTypeChange: noop,
    listingConfig: defaultConfig.listing,
  },
  group: 'page:EditListingPage',
};
