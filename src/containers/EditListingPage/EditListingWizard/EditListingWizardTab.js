import React, { useMemo } from 'react';

// Import configs and util modules
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
} from '../../../util/urlHelpers';
import { ensureListing } from '../../../util/data';
import { createResourceLocatorString } from '../../../util/routes';

// Import modules from this directory
import EditListingAvailabilityPanel from './EditListingAvailabilityPanel/EditListingAvailabilityPanel';
import EditListingDetailsPanel from './EditListingDetailsPanel/EditListingDetailsPanel';
import EditListingDeliveryPanel from './EditListingDeliveryPanel/EditListingDeliveryPanel';
import EditListingLocationPanel from './EditListingLocationPanel/EditListingLocationPanel';
import EditListingPhotosPanel from './EditListingPhotosPanel/EditListingPhotosPanel';
import EditListingPricingPanel from './EditListingPricingPanel/EditListingPricingPanel';
import EditListingPricingAndStockPanel from './EditListingPricingAndStockPanel/EditListingPricingAndStockPanel';

import css from './EditListingWizardTab.module.css';
import { markTabUpdated } from '../EditListingPage.duck';

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

/**
 * A single tab on the EditListingWizard.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element} EditListingWizardTab component
 */
const EditListingWizardTab = props => {
  console.log('[DEBUG] EditListingWizardTab render', { tab: props.tab, params: props.params, listing: props.listing });
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
    dispatch,
  } = props;

  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;

  // Memoize the pathParamsToNextTab function
  const pathParamsToNextTab = useMemo(() => {
    return (params, tab, marketplaceTabs) => {
      console.log('[DEBUG] pathParamsToNextTab called with:', { params, tab, marketplaceTabs });
      const nextTabIndex = marketplaceTabs.findIndex(s => s === tab) + 1;
      console.log('[DEBUG] nextTabIndex:', nextTabIndex, 'marketplaceTabs.length:', marketplaceTabs.length);
      const nextTab =
        nextTabIndex < marketplaceTabs.length
          ? marketplaceTabs[nextTabIndex]
          : marketplaceTabs[marketplaceTabs.length - 1];
      console.log('[DEBUG] nextTab:', nextTab);
      const result = { ...params, tab: nextTab };
      console.log('[DEBUG] pathParamsToNextTab result:', result);
      return result;
    };
  }, [marketplaceTabs]);

  // Memoize the redirectAfterDraftUpdate function
  const redirectAfterDraftUpdate = useMemo(() => {
    return (listingId, params, tab, marketplaceTabs, history, routes) => {
      console.log('[DEBUG] redirectAfterDraftUpdate called with:', { listingId, params, tab, marketplaceTabs });
      const listingUUID = listingId.uuid;
      const currentPathParams = {
        ...params,
        type: LISTING_PAGE_PARAM_TYPE_DRAFT,
        id: listingUUID,
      };

      console.log('[DEBUG] currentPathParams:', currentPathParams);

      // Redirect to next tab
      const nextPathParams = pathParamsToNextTab(currentPathParams, tab, marketplaceTabs);
      console.log('[DEBUG] nextPathParams:', nextPathParams);
      const to = createResourceLocatorString('EditListingPage', routes, nextPathParams, {});
      console.log('[DEBUG] Redirecting to:', to);
      console.log('🟣 [DEBUG] Navigation target:', to);
      // Use setTimeout to ensure the current async operation completes before navigation
      setTimeout(() => {
        console.log('[DEBUG] Executing navigation timeout');
        // Replace current "new" path to "draft" path if needed
        if (params.type === LISTING_PAGE_PARAM_TYPE_NEW) {
          console.log('[DEBUG] Replacing NEW path with DRAFT path');
          const draftURI = createResourceLocatorString('EditListingPage', routes, currentPathParams, {});
          console.log('[DEBUG] Draft URI:', draftURI);
          history.replace(draftURI);
        }
        // Then navigate to next tab
        history.push(to);
        console.log('[DEBUG] Calling history.push with:', to);
        console.log('[DEBUG] Navigation completed');
      }, 0);
    };
  }, [pathParamsToNextTab]);

  // New listing flow has automatic redirects to new tab on the wizard
  // and the last panel calls publishListing API endpoint.
  const automaticRedirectsForNewListingFlow = useMemo(() => {
    return (tab, listingId) => {
      console.log('[DEBUG] automaticRedirectsForNewListingFlow called with:', { tab, listingId, marketplaceTabs });
      const isLastTab = tab === marketplaceTabs[marketplaceTabs.length - 1];
      console.log('[DEBUG] isLastTab:', isLastTab, 'current tab:', tab, 'last tab:', marketplaceTabs[marketplaceTabs.length - 1]);
      
      if (!isLastTab) {
        console.log('[DEBUG] Not last tab - redirecting to next tab');
        // Create listing flow: smooth scrolling polyfill to scroll to correct tab
        handleCreateFlowTabScrolling(false);

        // After successful saving of draft data, user should be redirected to next tab
        console.log('[DEBUG] Calling redirectAfterDraftUpdate');
        redirectAfterDraftUpdate(
          listingId,
          params,
          tab,
          marketplaceTabs,
          history,
          routeConfiguration
        );
        console.log('[DEBUG] redirectAfterDraftUpdate called');
      } else {
        console.log('[DEBUG] Last tab - calling handlePublishListing');
        handlePublishListing(listingId);
      }
    };
  }, [marketplaceTabs, handleCreateFlowTabScrolling, params, history, routeConfiguration, handlePublishListing, redirectAfterDraftUpdate]);

  const onCompleteEditListingWizardTab = useMemo(() => {
    return (tab, updateValues) => {
      console.log('🟢 [DEBUG] onCompleteEditListingWizardTab called', { tab, updateValues });
      const onUpdateListingOrCreateListingDraft = isNewURI
        ? (tab, values) => {
            console.log('[DEBUG] Calling onCreateListingDraft with:', { tab, values });
            console.log("onCreateListingDraft invoked");
            try {
              const result = onCreateListingDraft(values, config);
              console.log("onCreateListingDraft returned:", result);
              return result;
            } catch (error) {
              console.error("onCreateListingDraft failed:", error);
              throw error;
            }
          }
        : (tab, values) => {
            console.log('[DEBUG] Calling onUpdateListing with:', { tab, values });
            console.log("onUpdateListing invoked");
            try {
              const result = onUpdateListing(tab, values, config);
              console.log("onUpdateListing returned:", result);
              return result;
            } catch (error) {
              console.error("onUpdateListing failed:", error);
              throw error;
            }
          };

      const updateListingValues = isNewURI
        ? updateValues
        : { ...updateValues, id: listing.id };

      console.log('[DEBUG] onCompleteEditListingWizardTab called with:', { 
        tab, 
        updateValues, 
        updateListingValues,
        isNewURI,
        listingId: listing?.id,
        hasDispatch: !!dispatch,
        marketplaceTabs,
        isNewListingFlow
      });

      // For AVAILABILITY tab, always mark as updated after API call (or immediately if no call needed)
      if (tab === AVAILABILITY) {
        console.log('[DEBUG] Processing AVAILABILITY tab');
        console.log('[DEBUG] Calling onUpdateListingOrCreateListingDraft with:', { tab, updateListingValues });
        
        console.log('[DEBUG] About to call onUpdateListingOrCreateListingDraft with:', { tab, updateListingValues });
        return onUpdateListingOrCreateListingDraft(tab, updateListingValues)
          .then(r => {
            console.log('🔵 [DEBUG] API call succeeded in onCompleteEditListingWizardTab', r);
            if (dispatch) {
              console.log('[DEBUG] Dispatching markTabUpdated');
              dispatch(markTabUpdated(tab));
            }
            if (isNewListingFlow) {
              const listingId = r?.data?.data?.id || listing.id;
              console.log('[DEBUG] New listing flow - calling automaticRedirectsForNewListingFlow with:', { tab, listingId });
              console.log('[DEBUG] isNewListingFlow:', isNewListingFlow);
              console.log('[DEBUG] listingId:', listingId);
              // Use setTimeout to ensure the dispatch completes before navigation
              setTimeout(() => {
                console.log('[DEBUG] setTimeout callback - calling automaticRedirectsForNewListingFlow');
                automaticRedirectsForNewListingFlow(tab, listingId);
              }, 0);
            } else {
              console.log('[DEBUG] Not new listing flow - no navigation needed');
            }
            return r;
          })
          .catch(e => {
            console.error('[DEBUG] API call failed in onCompleteEditListingWizardTab', e);
            throw e;
          });
      } else {
        console.log('[DEBUG] Processing non-AVAILABILITY tab:', tab);
        return onUpdateListingOrCreateListingDraft(tab, updateListingValues)
          .then(r => {
            console.log('[DEBUG] API call succeeded in onCompleteEditListingWizardTab', r);
            console.log('[DEBUG] Response structure:', {
              hasR: !!r,
              hasData: !!r?.data,
              hasDataData: !!r?.data?.data,
              hasId: !!r?.data?.data?.id,
              responseType: typeof r,
              dataType: typeof r?.data,
              dataDataType: typeof r?.data?.data
            });
            if (isNewListingFlow) {
              // Try different possible response structures
              let listingId = null;
              if (r?.data?.data?.id) {
                listingId = r.data.data.id;
              } else if (r?.data?.id) {
                listingId = r.data.id;
              } else if (r?.id) {
                listingId = r.id;
              } else if (r?.listingId) {
                listingId = r.listingId;
              }
              
              if (listingId) {
                console.log('[DEBUG] New listing flow - calling automaticRedirectsForNewListingFlow with:', { tab, listingId });
                // Use setTimeout to ensure the dispatch completes before navigation
                setTimeout(() => {
                  console.log('[DEBUG] setTimeout callback - calling automaticRedirectsForNewListingFlow');
                  automaticRedirectsForNewListingFlow(tab, listingId);
                }, 0);
              } else {
                console.error('[DEBUG] Could not find listingId in response structure:', r);
                console.error('[DEBUG] Response keys:', r ? Object.keys(r) : 'null');
                if (r?.data) {
                  console.error('[DEBUG] Data keys:', Object.keys(r.data));
                }
                if (r?.data?.data) {
                  console.error('[DEBUG] Data.data keys:', Object.keys(r.data.data));
                }
                // Don't throw error, just log and continue
                console.warn('[DEBUG] Continuing without automatic redirect due to missing listingId');
              }
            }
          })
          .catch(e => {
            console.error('[DEBUG] API call failed in onCompleteEditListingWizardTab', e);
            throw e;
          });
      }
    };
  }, [isNewURI, onCreateListingDraft, onUpdateListing, config, listing?.id, dispatch, marketplaceTabs, isNewListingFlow, automaticRedirectsForNewListingFlow]);

  const panelProps = React.useMemo(() => (tab) => {
    console.log('[DEBUG] panelProps called for tab:', tab);
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
  }, [errors, listing, updatedTab, params, locationSearch, updateInProgress, newListingPublished, fetchInProgress, tabSubmitButtonText, config.listing.listingTypes, onManageDisableScrolling, onCompleteEditListingWizardTab]);

  // TODO: add missing cases for supported tabs
  switch (tab) {
    case DETAILS: {
      console.log('[DEBUG] Rendering DETAILS panel', { tab, props });
      return (
        <EditListingDetailsPanel
          {...panelProps(DETAILS)}
          onListingTypeChange={onListingTypeChange}
          config={config}
        />
      );
    }
    case PRICING_AND_STOCK: {
      console.log('[DEBUG] Rendering PRICING_AND_STOCK panel', { tab, props });
      return (
        <EditListingPricingAndStockPanel
          {...panelProps(PRICING_AND_STOCK)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
        />
      );
    }
    case PRICING: {
      console.log('[DEBUG] Rendering PRICING panel', { tab, props });
      return (
        <EditListingPricingPanel
          {...panelProps(PRICING)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
        />
      );
    }
    case DELIVERY: {
      console.log('[DEBUG] Rendering DELIVERY panel', { tab, props });
      return (
        <EditListingDeliveryPanel {...panelProps(DELIVERY)} marketplaceCurrency={config.currency} />
      );
    }
    case LOCATION: {
      console.log('[DEBUG] Rendering LOCATION panel', { tab, props });
      return <EditListingLocationPanel {...panelProps(LOCATION)} />;
    }
    case AVAILABILITY: {
      console.log('[DEBUG] Rendering AVAILABILITY panel', { tab, props });
      // Define onNextTab to accept and forward the payload
      const onNextTab = payload => {
        console.log('[DEBUG] onNextTab called with:', payload);
        return onCompleteEditListingWizardTab(AVAILABILITY, payload);
      };
      console.log('[DEBUG] Passing onNextTab to EditListingAvailabilityPanel:', {
        isFunction: typeof onNextTab === 'function',
        functionName: onNextTab?.name
      });
      return (
        <EditListingAvailabilityPanel
          {...panelProps(AVAILABILITY)}
          handlePublishListing={handlePublishListing}
          allExceptions={allExceptions}
          weeklyExceptionQueries={weeklyExceptionQueries}
          monthlyExceptionQueries={monthlyExceptionQueries}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          config={config}
          history={history}
          routeConfiguration={routeConfiguration}
          onNextTab={onNextTab}
        />
      );
    }
    case PHOTOS: {
      console.log('[DEBUG] Rendering PHOTOS panel', { tab, props });
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

export default EditListingWizardTab;
