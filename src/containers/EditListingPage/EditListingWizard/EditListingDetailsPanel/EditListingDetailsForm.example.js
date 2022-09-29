/* eslint-disable no-console */
import EditListingDetailsForm from './EditListingDetailsForm';
import defaultConfig from '../../../../config/configDefault';

const selectableTransactionTypes = [
  {
    transactionType: 'sell-bicycles',
    transactionProcessAlias: 'flex-product-default-process/release-1',
    unitType: 'item',
  },
];

export const WithInitialValues = {
  component: EditListingDetailsForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableTransactionTypes: selectableTransactionTypes,
    listingConfig: defaultConfig.listing,
    initialValues: {
      title: 'Listing',
      description: 'Lorem ipsum',
      transactionType: 'sell-bicycles',
      transactionProcessAlias: 'flex-product-default-process/release-1',
      unitType: 'item',
    },
  },
  group: 'page:EditListingPage',
};

const selectableTransactionTypes2 = [
  {
    transactionType: 'rent-bicycles',
    transactionProcessAlias: 'flex-booking-default-process/release-1',
    unitType: 'day',
  },
  {
    transactionType: 'sell-bicycles',
    transactionProcessAlias: 'flex-product-default-process/release-1',
    unitType: 'item',
  },
];

export const MultipleProcessInfos = {
  component: EditListingDetailsForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    disabled: false,
    ready: false,
    updated: false,
    updateInProgress: false,
    selectableTransactionTypes: selectableTransactionTypes2,
    listingConfig: defaultConfig.listing,
  },
  group: 'page:EditListingPage',
};
