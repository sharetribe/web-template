/* eslint-disable no-console */
import EditListingDetailsForm from './EditListingDetailsForm';
import config from '../../../../config';

const oneProcessInfo = [
  {
    name: 'flex-product-default-process',
    alias: 'release-1',
    unitTypes: ['item'],
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
    processInfos: oneProcessInfo,
    customConfig: config.custom,
    initialValues: {
      title: 'Listing',
      description: 'Lorem ipsum',
      transactionProcessAlias: 'flex-product-default-process/release-1',
      unitType: 'item',
    },
  },
  group: 'page:EditListingPage',
};

const processInfos = [
  {
    name: 'flex-product-default-process',
    alias: 'release-1',
    unitTypes: ['item'],
  },
  {
    name: 'flex-booking-default-process',
    alias: 'release-1',
    unitTypes: ['day', 'night'],
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
    processInfos: processInfos,
    customConfig: config.custom,
  },
  group: 'page:EditListingPage',
};
