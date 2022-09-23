/* eslint-disable no-console */
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';

export const Empty = {
  component: EditListingPricingAndStockForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingPricingAndStockForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save price',
    marketplaceCurrency: 'USD',
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
  },
  group: 'page:EditListingPage',
};
