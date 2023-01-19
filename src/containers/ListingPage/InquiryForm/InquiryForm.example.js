import InquiryForm from './InquiryForm';

export const Empty = {
  component: InquiryForm,
  props: {
    formId: 'InquiryFormExample',
    listingTitle: 'Sneaky sneaker',
    authorDisplayName: 'Janne',
    onSubmit(values) {
      console.log('submit with values:', values);
    },
  },
  group: 'page:ListingPage',
};
