/* eslint-disable no-console */
import EditListingDeliveryForm from './EditListingDeliveryForm';

export const Empty = {
  component: EditListingDeliveryForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingDeliveryForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save location',
    marketplaceCurrency: 'USD',
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
  },
  group: 'page:EditListingPage',
};
