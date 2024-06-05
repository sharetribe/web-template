/* eslint-disable no-console */
import EditListingDeliveryForm from './EditListingDeliveryForm';

export const BothPickupAndShipping = {
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
    formId: 'BothPickupAndShipping',
  },
  group: 'page:EditListingPage',
};

export const NoShipping = {
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
    listingTypeConfig: { type: 'sell-bikes', defaultListingFields: { shipping: false } },
    initialValues: { deliveryOptions: ['pickup'] },
    formId: 'NoShipping',
  },
  group: 'page:EditListingPage',
};

export const NoPickup = {
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
    listingTypeConfig: { type: 'sell-bikes', defaultListingFields: { pickup: false } },
    initialValues: { deliveryOptions: ['shipping'] },
    formId: 'NoPickup',
  },
  group: 'page:EditListingPage',
};
