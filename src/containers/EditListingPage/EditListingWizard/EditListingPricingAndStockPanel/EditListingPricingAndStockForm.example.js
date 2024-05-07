/* eslint-disable no-console */
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';

export const InfinityMultipleItems = {
  component: EditListingPricingAndStockForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingPricingAndStockForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save price',
    marketplaceCurrency: 'USD',
    unitType: 'item',
    listingType: { type: 'sell-bikes', stockType: 'infiniteMultipleItems' },
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
    initialValues: { stock: 1000000000000 },
    formId: 'InfinityMultipleItems',
  },
  group: 'page:EditListingPage',
};

export const InfinityOneItem = {
  component: EditListingPricingAndStockForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingPricingAndStockForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save price',
    marketplaceCurrency: 'USD',
    unitType: 'item',
    listingType: { type: 'sell-bikes', stockType: 'infiniteOneItem' },
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
    initialValues: { stock: 1000000000000 },
    formId: 'InfinityOneItem',
  },
  group: 'page:EditListingPage',
};

export const InfinityOneItem_stockOf3 = {
  component: EditListingPricingAndStockForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingPricingAndStockForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save price',
    marketplaceCurrency: 'USD',
    unitType: 'item',
    listingType: { type: 'sell-bikes', stockType: 'infiniteOneItem' },
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
    initialValues: { stock: 3 },
    formId: 'InfinityOneItem_stockOf3',
  },
  group: 'page:EditListingPage',
};

export const MultipleItems = {
  component: EditListingPricingAndStockForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingPricingAndStockForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save price',
    marketplaceCurrency: 'USD',
    unitType: 'item',
    listingType: { type: 'sell-bikes', stockType: 'multipleItems' },
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
    initialValues: { stock: 3 },
    formId: 'MultipleItems',
  },
  group: 'page:EditListingPage',
};

export const OneItem = {
  component: EditListingPricingAndStockForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingPricingAndStockForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save price',
    marketplaceCurrency: 'USD',
    unitType: 'item',
    listingType: { type: 'sell-bikes', stockType: 'oneItem' },
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
  },
  group: 'page:EditListingPage',
};
