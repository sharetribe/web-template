import React from 'react';
import PropTypes from 'prop-types';

// Import configs and util modules
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
} from '../../../util/urlHelpers';
import { createResourceLocatorString } from '../../../util/routes';

import css from './BatchEditListingWizardTab.module.css';
import EditListingUploaderPanel from './EditListingUploaderPanel/EditListingUploaderPanel';
import { EditListingBatchProductDetails } from './EditListingBatchProductDetails/EditListingBatchProductDetails';

export const UPLOAD = 'upload';
export const PRODUCT_DETAILS = 'product-details';

const pathParamsToNextTab = (params, tab, marketplaceTabs) => {
  const nextTabIndex = marketplaceTabs.findIndex(s => s === tab) + 1;
  const nextTab =
    nextTabIndex < marketplaceTabs.length
      ? marketplaceTabs[nextTabIndex]
      : marketplaceTabs[marketplaceTabs.length - 1];
  return { ...params, tab: nextTab };
};

// When user has update draft listing, he should be redirected to next EditListingWizardTab
const redirectAfterDraftUpdate = (listingId, params, tab, marketplaceTabs, history, routes) => {
  const listingUUID = listingId.uuid;
  const currentPathParams = {
    ...params,
    type: LISTING_PAGE_PARAM_TYPE_DRAFT,
    id: listingUUID,
  };

  // Replace current "new" path to "draft" path.
  // Browser's back button should lead to editing current draft instead of creating a new one.
  if (params.type === LISTING_PAGE_PARAM_TYPE_NEW) {
    const draftURI = createResourceLocatorString('EditListingPage', routes, currentPathParams, {});
    history.replace(draftURI);
  }

  // Redirect to next tab
  const nextPathParams = pathParamsToNextTab(currentPathParams, tab, marketplaceTabs);
  const to = createResourceLocatorString('EditListingPage', routes, nextPathParams, {});
  history.push(to);
};

const BatchEditListingWizardTab = props => {
  const {
    tab,
    params,
    locationSearch,
    errors,
    fetchInProgress,
    newListingPublished,
    history,
    images,
    listing = null,
    onImageUpload,
    onManageDisableScrolling,
    onRemoveImage,
    updatedTab = null,
    updateInProgress,
    tabSubmitButtonText,
    config,
    routeConfiguration,
    uppy,
  } = props;


  const onCompleteEditListingWizardTab = (tab, updateValues) => {
    console.log('Save listings');
  };

  const panelProps = tab => {
    return {
      className: css.panel,
      errors,
      listing,
      panelUpdated: updatedTab === tab,
      params,
      locationSearch,
      updateInProgress,
      // newListingPublished and fetchInProgress are flags for the last wizard tab
      ready: newListingPublished,
      disabled: fetchInProgress,
      submitButtonText: tabSubmitButtonText,
      listingTypes: config.listing.listingTypes,
      onManageDisableScrolling,
      onSubmit: values => {
        if (tab === UPLOAD) {
          const nextTab = { ...params, tab: PRODUCT_DETAILS };
          const to = createResourceLocatorString(
            'BatchEditListingPage',
            routeConfiguration,
            nextTab,
            {}
          );
          history.push(to);
          return;
        }
        return onCompleteEditListingWizardTab(tab, values);
      },
    };
  };

  switch (tab) {
    case UPLOAD: {
      return (
        <EditListingUploaderPanel
          {...panelProps(UPLOAD)}
          listingImageConfig={config.layout.listingImage}
          images={images}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          uppy={uppy}
        />
      );
    }
    case PRODUCT_DETAILS: {
      return <EditListingBatchProductDetails />;
    }
    default:
      return null;
  }
};

BatchEditListingWizardTab.defaultProps = {
  listing: null,
  updatedTab: null,
};

const { array, bool, func, object, oneOf, shape, string } = PropTypes;

export default BatchEditListingWizardTab;
