import React from 'react';
import { createResourceLocatorString } from '../../../util/routes';
import EditListingUploaderPanel from './BatchEditListingUploaderPanel/EditListingUploaderPanel';
import { EditListingBatchProductDetails } from './BatchEditListingProductDetails/EditListingBatchProductDetails';

export const UPLOAD = 'upload';
export const PRODUCT_DETAILS = 'product-details';

const BatchEditListingWizardTab = props => {
  const { tab, params, history, routeConfiguration, uppy } = props;

  const onCompleteUploadTab = () => {
    const nextTab = { ...params, tab: PRODUCT_DETAILS };
    const to = createResourceLocatorString('BatchEditListingPage', routeConfiguration, nextTab, {});
    history.push(to);
  };

  switch (tab) {
    case UPLOAD: {
      return <EditListingUploaderPanel onSubmit={onCompleteUploadTab} uppy={uppy} />;
    }
    case PRODUCT_DETAILS: {
      return <EditListingBatchProductDetails />;
    }
    default:
      return null;
  }
};

export default BatchEditListingWizardTab;
