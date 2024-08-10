/* eslint-disable no-console */
import EditListingDocumentsForm from './EditListingDocumentsForm';

export const Empty = {
  component: EditListingDocumentsForm,
  props: {
    onSubmit: values => {
      console.log('Submit EditListingDocumentsForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save extra features',
    updated: false,
    updateInProgress: false,
    disabled: false,
    ready: false,
  },
  group: 'page:EditListingPage',
};
