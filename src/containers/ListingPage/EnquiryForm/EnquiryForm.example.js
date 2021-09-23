import EnquiryForm from './EnquiryForm';

export const Empty = {
  component: EnquiryForm,
  props: {
    formId: 'EnquiryFormExample',
    listingTitle: 'Sneaky sneaker',
    authorDisplayName: 'Janne',
    onSubmit(values) {
      console.log('submit with values:', values);
    },
  },
  group: 'page:ListingPage',
};
