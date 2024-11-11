import React from 'react';
import PropTypes, { arrayOf } from 'prop-types';

// Import configs and util modules
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  LISTING_PAGE_PARAM_TYPES,
} from '../../../util/urlHelpers';
import { ensureListing } from '../../../util/data';
import { createResourceLocatorString } from '../../../util/routes';
import { propTypes } from '../../../util/types';

// Import modules from this directory
import EditListingAvailabilityPanel from './EditListingAvailabilityPanel/EditListingAvailabilityPanel';
import EditListingDetailsPanel from './EditListingDetailsPanel/EditListingDetailsPanel';
import EditListingDeliveryPanel from './EditListingDeliveryPanel/EditListingDeliveryPanel';
import EditListingLocationPanel from './EditListingLocationPanel/EditListingLocationPanel';
import EditListingPhotosPanel from './EditListingPhotosPanel/EditListingPhotosPanel';
import EditListingPricingPanel from './EditListingPricingPanel/EditListingPricingPanel';
import EditListingPricingAndStockPanel from './EditListingPricingAndStockPanel/EditListingPricingAndStockPanel';

import css from './EditListingWizardTab.module.css';

export const DETAILS = 'details';
export const PRICING = 'pricing';
export const PRICING_AND_STOCK = 'pricing-and-stock';
export const DELIVERY = 'delivery';
export const LOCATION = 'location';
export const AVAILABILITY = 'availability';
export const PHOTOS = 'photos';

// EditListingWizardTab component supports these tabs
export const SUPPORTED_TABS = [
  DETAILS,
  PRICING,
  PRICING_AND_STOCK,
  DELIVERY,
  LOCATION,
  AVAILABILITY,
  PHOTOS,
];

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

const EditListingWizardTab = props => {
  const {
    tab,
    marketplaceTabs,
    params,
    locationSearch,
    errors,
    fetchInProgress,
    newListingPublished,
    handleCreateFlowTabScrolling,
    handlePublishListing,
    history,
    images,
    listing,
    weeklyExceptionQueries,
    monthlyExceptionQueries,
    allExceptions,
    onFetchExceptions,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onUpdateListing,
    onCreateListingDraft,
    onImageUpload,
    onManageDisableScrolling,
    onListingTypeChange,
    onRemoveImage,
    updatedTab,
    updateInProgress,
    tabSubmitButtonText,
    config,
    routeConfiguration,
  } = props;

  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;

  const currentListing = ensureListing(listing);

  // New listing flow has automatic redirects to new tab on the wizard
  // and the last panel calls publishListing API endpoint.
  const automaticRedirectsForNewListingFlow = (tab, listingId) => {
    if (tab !== marketplaceTabs[marketplaceTabs.length - 1]) {
      // Create listing flow: smooth scrolling polyfill to scroll to correct tab
      handleCreateFlowTabScrolling(false);

      // After successful saving of draft data, user should be redirected to next tab
      redirectAfterDraftUpdate(
        listingId,
        params,
        tab,
        marketplaceTabs,
        history,
        routeConfiguration
      );
    } else {
      handlePublishListing(listingId);
    }
  };

  const onCompleteEditListingWizardTab = (tab, updateValues) => {
    const onUpdateListingOrCreateListingDraft = isNewURI
      ? (tab, values) => onCreateListingDraft(values, config)
      : (tab, values) => onUpdateListing(tab, values, config);

    const updateListingValues = isNewURI
      ? updateValues
      : { ...updateValues, id: currentListing.id };

    return onUpdateListingOrCreateListingDraft(tab, updateListingValues)
      .then(r => {
        // In Availability tab, the submitted data (plan) is inside a modal
        // We don't redirect provider immediately after plan is set
        if (isNewListingFlow && tab !== AVAILABILITY) {
          const listingId = r.data.data.id;
          automaticRedirectsForNewListingFlow(tab, listingId);
        }
      })
      .catch(e => {
        // No need for extra actions
      });
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
        return onCompleteEditListingWizardTab(tab, values);
      },
    };
  };

  // TODO: add missing cases for supported tabs
  switch (tab) {
    case DETAILS: {
      return (
        <EditListingDetailsPanel
          {...panelProps(DETAILS)}
          onListingTypeChange={onListingTypeChange}
          config={config}
        />
      );
    }
    case PRICING_AND_STOCK: {
      return (
        <EditListingPricingAndStockPanel
          {...panelProps(PRICING_AND_STOCK)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
        />
      );
    }
    case PRICING: {
      return (
        <EditListingPricingPanel
          {...panelProps(PRICING)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
        />
      );
    }
    case DELIVERY: {
      return (
        <EditListingDeliveryPanel {...panelProps(DELIVERY)} marketplaceCurrency={config.currency} />
      );
    }
    case LOCATION: {
      return <EditListingLocationPanel {...panelProps(LOCATION)} />;
    }
    case AVAILABILITY: {
      return (
        <EditListingAvailabilityPanel
          allExceptions={allExceptions}
          weeklyExceptionQueries={weeklyExceptionQueries}
          monthlyExceptionQueries={monthlyExceptionQueries}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onNextTab={() =>
            redirectAfterDraftUpdate(
              listing.id,
              params,
              tab,
              marketplaceTabs,
              history,
              routeConfiguration
            )
          }
          config={config}
          history={history}
          routeConfiguration={routeConfiguration}
          {...panelProps(AVAILABILITY)}
        />
      );
    }
    case PHOTOS: {
      return (
        <EditListingPhotosPanel
          {...panelProps(PHOTOS)}
          listingImageConfig={config.layout.listingImage}
          images={images}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
        />
      );
    }
    default:
      return null;
  }
};

EditListingWizardTab.defaultProps = {
  listing: null,
  updatedTab: null,
};

const { array, bool, func, object, oneOf, shape, string } = PropTypes;

EditListingWizardTab.propTypes = {
  params: shape({
    id: string.isRequired,
    slug: string.isRequired,
    type: oneOf(LISTING_PAGE_PARAM_TYPES).isRequired,
    tab: oneOf(SUPPORTED_TABS).isRequired,
  }).isRequired,
  locationSearch: object,
  errors: shape({
    createListingDraftError: object,
    publishListingError: object,
    updateListingError: object,
    showListingsError: object,
    uploadImageError: object,
  }).isRequired,
  fetchInProgress: bool.isRequired,
  newListingPublished: bool.isRequired,
  history: shape({
    push: func.isRequired,
    replace: func.isRequired,
  }).isRequired,
  images: array.isRequired,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: shape({
    attributes: shape({
      publicData: object,
      description: string,
      geolocation: object,
      pricing: object,
      title: string,
    }),
    images: array,
  }),

  handleCreateFlowTabScrolling: func.isRequired,
  handlePublishListing: func.isRequired,
  onUpdateListing: func.isRequired,
  onCreateListingDraft: func.isRequired,
  onImageUpload: func.isRequired,
  onRemoveImage: func.isRequired,
  onListingTypeChange: func.isRequired,
  updatedTab: string,
  updateInProgress: bool.isRequired,
  config: object.isRequired,
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

export default EditListingWizardTab;
