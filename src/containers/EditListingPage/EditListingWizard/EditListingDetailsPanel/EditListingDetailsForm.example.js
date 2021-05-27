/* eslint-disable no-console */
import EditListingDetailsForm from './EditListingDetailsForm';

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
  },
  group: 'page:EditListingPage',
};
