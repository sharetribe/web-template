/* eslint-disable no-console */
import EditListingPhotosForm from './EditListingPhotosForm';

const listingImageConfig = { aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' };
export const Empty = {
  component: EditListingPhotosForm,
  props: {
    initialValues: { country: 'US', images: [] },
    stripeConnected: false,
    onImageUpload: values => {
      console.log(`onImageUpload with id (${values.id}) and file name (${values.file.name})`);
    },
    onSubmit: values => {
      console.log('Submit EditListingPhotosForm with (unformatted) values:', values);
    },
    saveActionMsg: 'Save photos',
    updated: false,
    ready: false,
    updateInProgress: false,
    disabled: false,
    onRemoveImage: imageId => {
      console.log('remove image:', imageId);
    },
    listingImageConfig,
  },
  group: 'page:EditListingPage',
};
