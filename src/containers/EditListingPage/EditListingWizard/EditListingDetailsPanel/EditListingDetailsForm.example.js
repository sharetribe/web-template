/* eslint-disable no-console */
import EditListingDetailsForm from './EditListingDetailsForm';
import config from '../../../../config';

const processInfos = [
  {
    name: 'flex-product-default-process',
    alias: 'release-1',
    unitTypes: ['item'],
  },
];

export const Empty = {
  component: EditListingDetailsForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingDetailsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save description',
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
    processInfos: processInfos,
    filterConfigs: config.custom.filters,
  },
  group: 'page:EditListingPage',
};
