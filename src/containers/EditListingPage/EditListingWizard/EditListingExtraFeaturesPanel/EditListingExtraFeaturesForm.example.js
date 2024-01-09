/* eslint-disable no-console */
import EditListingExtraFeaturesForm from './EditListingExtraFeaturesForm';

export const Empty = {
  component: EditListingExtraFeaturesForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingExtraFeaturesForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save extra features',
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
  },
  group: 'page:EditListingPage',
};