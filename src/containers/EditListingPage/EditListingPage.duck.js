import omit from 'lodash/omit';

import config from '../../config';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../util/data';
import { getStartOf } from '../../util/dates';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  createStripeAccount,
  updateStripeAccount,
  fetchStripeAccount,
} from '../../ducks/stripeConnectAccount.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

const { UUID } = sdkTypes;

// Return an array of image ids
const imageIds = images => {
  // For newly uploaded image the UUID can be found from "img.imageId"
  // and for existing listing images the id is "img.id"
  return images ? images.map(img => img.imageId || img.id) : null;
};

// After listing creation & update, we want to make sure that uploadedImages state is cleaned
const updateUploadedImagesState = (state, payload) => {
  const { uploadedImages, uploadedImagesOrder } = state;

  // Images attached to listing entity
  const attachedImages = payload?.data?.relationships?.images?.data || [];
  const attachedImageUUIDStrings = attachedImages.map(img => img.id.uuid);

  // Uploaded images (which are propably not yet attached to listing)
  const unattachedImages = Object.values(state.uploadedImages);
  const duplicateImageEntities = unattachedImages.filter(unattachedImg =>
    attachedImageUUIDStrings.includes(unattachedImg.imageId?.uuid)
  );
  return duplicateImageEntities.length > 0
    ? {
        uploadedImages: {},
        uploadedImagesOrder: [],
      }
    : {
        uploadedImages,
        uploadedImagesOrder,
      };
};

const getImageVariantInfo = () => {
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
  const aspectRatio = aspectHeight / aspectWidth;
  const fieldsImage = [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`];

  return {
    fieldsImage,
    imageVariants: {
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    },
  };
};

const requestAction = actionType => params => ({ type: actionType, payload: { params } });

const successAction = actionType => result => ({ type: actionType, payload: result.data });

const errorAction = actionType => error => ({ type: actionType, payload: error, error: true });

// ================ Action types ================ //

export const MARK_TAB_UPDATED = 'app/EditListingPage/MARK_TAB_UPDATED';
export const CLEAR_UPDATED_TAB = 'app/EditListingPage/CLEAR_UPDATED_TAB';

export const CREATE_LISTING_DRAFT_REQUEST = 'app/EditListingPage/CREATE_LISTING_DRAFT_REQUEST';
export const CREATE_LISTING_DRAFT_SUCCESS = 'app/EditListingPage/CREATE_LISTING_DRAFT_SUCCESS';
export const CREATE_LISTING_DRAFT_ERROR = 'app/EditListingPage/CREATE_LISTING_DRAFT_ERROR';

export const PUBLISH_LISTING_REQUEST = 'app/EditListingPage/PUBLISH_LISTING_REQUEST';
export const PUBLISH_LISTING_SUCCESS = 'app/EditListingPage/PUBLISH_LISTING_SUCCESS';
export const PUBLISH_LISTING_ERROR = 'app/EditListingPage/PUBLISH_LISTING_ERROR';

export const UPDATE_LISTING_REQUEST = 'app/EditListingPage/UPDATE_LISTING_REQUEST';
export const UPDATE_LISTING_SUCCESS = 'app/EditListingPage/UPDATE_LISTING_SUCCESS';
export const UPDATE_LISTING_ERROR = 'app/EditListingPage/UPDATE_LISTING_ERROR';

export const SHOW_LISTINGS_REQUEST = 'app/EditListingPage/SHOW_LISTINGS_REQUEST';
export const SHOW_LISTINGS_SUCCESS = 'app/EditListingPage/SHOW_LISTINGS_SUCCESS';
export const SHOW_LISTINGS_ERROR = 'app/EditListingPage/SHOW_LISTINGS_ERROR';

export const FETCH_EXCEPTIONS_REQUEST = 'app/EditListingPage/FETCH_AVAILABILITY_EXCEPTIONS_REQUEST';
export const FETCH_EXCEPTIONS_SUCCESS = 'app/EditListingPage/FETCH_AVAILABILITY_EXCEPTIONS_SUCCESS';
export const FETCH_EXCEPTIONS_ERROR = 'app/EditListingPage/FETCH_AVAILABILITY_EXCEPTIONS_ERROR';

export const ADD_EXCEPTION_REQUEST = 'app/EditListingPage/ADD_AVAILABILITY_EXCEPTION_REQUEST';
export const ADD_EXCEPTION_SUCCESS = 'app/EditListingPage/ADD_AVAILABILITY_EXCEPTION_SUCCESS';
export const ADD_EXCEPTION_ERROR = 'app/EditListingPage/ADD_AVAILABILITY_EXCEPTION_ERROR';

export const DELETE_EXCEPTION_REQUEST = 'app/EditListingPage/DELETE_AVAILABILITY_EXCEPTION_REQUEST';
export const DELETE_EXCEPTION_SUCCESS = 'app/EditListingPage/DELETE_AVAILABILITY_EXCEPTION_SUCCESS';
export const DELETE_EXCEPTION_ERROR = 'app/EditListingPage/DELETE_AVAILABILITY_EXCEPTION_ERROR';

export const SET_STOCK_REQUEST = 'app/EditListingPage/SET_STOCK_REQUEST';
export const SET_STOCK_SUCCESS = 'app/EditListingPage/SET_STOCK_SUCCESS';
export const SET_STOCK_ERROR = 'app/EditListingPage/SET_STOCK_ERROR';

export const UPLOAD_IMAGE_REQUEST = 'app/EditListingPage/UPLOAD_IMAGE_REQUEST';
export const UPLOAD_IMAGE_SUCCESS = 'app/EditListingPage/UPLOAD_IMAGE_SUCCESS';
export const UPLOAD_IMAGE_ERROR = 'app/EditListingPage/UPLOAD_IMAGE_ERROR';

export const REMOVE_LISTING_IMAGE = 'app/EditListingPage/REMOVE_LISTING_IMAGE';

export const SAVE_PAYOUT_DETAILS_REQUEST = 'app/EditListingPage/SAVE_PAYOUT_DETAILS_REQUEST';
export const SAVE_PAYOUT_DETAILS_SUCCESS = 'app/EditListingPage/SAVE_PAYOUT_DETAILS_SUCCESS';
export const SAVE_PAYOUT_DETAILS_ERROR = 'app/EditListingPage/SAVE_PAYOUT_DETAILS_ERROR';

// ================ Reducer ================ //

const initialState = {
  // Error instance placeholders for each endpoint
  createListingDraftError: null,
  publishingListing: null,
  publishListingError: null,
  updateListingError: null,
  showListingsError: null,
  uploadImageError: null,
  setStockError: null,
  setStockInProgress: false,
  createListingDraftInProgress: false,
  submittedListingId: null,
  redirectToListing: false,
  uploadedImages: {},
  uploadedImagesOrder: [],
  removedImageIds: [],
  fetchExceptionsError: null,
  fetchExceptionsInProgress: false,
  availabilityExceptions: [],
  addExceptionError: null,
  addExceptionInProgress: false,
  deleteExceptionError: null,
  deleteExceptionInProgress: false,
  listingDraft: null,
  updatedTab: null,
  updateInProgress: false,
  payoutDetailsSaveInProgress: false,
  payoutDetailsSaved: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case MARK_TAB_UPDATED:
      return { ...state, updatedTab: payload };
    case CLEAR_UPDATED_TAB:
      return { ...state, updatedTab: null, updateListingError: null };

    case CREATE_LISTING_DRAFT_REQUEST:
      return {
        ...state,
        createListingDraftInProgress: true,
        createListingDraftError: null,
        submittedListingId: null,
        listingDraft: null,
      };

    case CREATE_LISTING_DRAFT_SUCCESS:
      return {
        ...state,
        ...updateUploadedImagesState(state, payload),
        createListingDraftInProgress: false,
        submittedListingId: payload.data.id,
        listingDraft: payload.data,
      };
    case CREATE_LISTING_DRAFT_ERROR:
      return {
        ...state,
        createListingDraftInProgress: false,
        createListingDraftError: payload,
      };

    case PUBLISH_LISTING_REQUEST:
      return {
        ...state,
        publishingListing: payload.listingId,
        publishListingError: null,
      };
    case PUBLISH_LISTING_SUCCESS:
      return {
        ...state,
        redirectToListing: true,
        publishingListing: null,
        createListingDraftError: null,
        updateListingError: null,
        showListingsError: null,
        uploadImageError: null,
        createListingDraftInProgress: false,
        updateInProgress: false,
      };
    case PUBLISH_LISTING_ERROR: {
      // eslint-disable-next-line no-console
      console.error(payload);
      return {
        ...state,
        publishingListing: null,
        publishListingError: {
          listingId: state.publishingListing,
          error: payload,
        },
      };
    }

    case UPDATE_LISTING_REQUEST:
      return { ...state, updateInProgress: true, updateListingError: null };
    case UPDATE_LISTING_SUCCESS:
      return {
        ...state,
        ...updateUploadedImagesState(state, payload),
        updateInProgress: false,
        // availabilityCalendar: { ...state.availabilityCalendar },
      };
    case UPDATE_LISTING_ERROR:
      return { ...state, updateInProgress: false, updateListingError: payload };

    case SHOW_LISTINGS_REQUEST:
      return { ...state, showListingsError: null };
    case SHOW_LISTINGS_SUCCESS:
      return initialState; // { ...initialState, availabilityCalendar: { ...state.availabilityCalendar } };

    case SHOW_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, showListingsError: payload, redirectToListing: false };

    case FETCH_EXCEPTIONS_REQUEST:
      return {
        ...state,
        availabilityExceptions: [],
        fetchExceptionsError: null,
        fetchExceptionsInProgress: true,
      };
    case FETCH_EXCEPTIONS_SUCCESS:
      return {
        ...state,
        availabilityExceptions: payload,
        fetchExceptionsError: null,
        fetchExceptionsInProgress: false,
      };
    case FETCH_EXCEPTIONS_ERROR:
      return {
        ...state,
        fetchExceptionsError: payload.error,
        fetchExceptionsInProgress: false,
      };

    case ADD_EXCEPTION_REQUEST:
      return {
        ...state,
        addExceptionError: null,
        addExceptionInProgress: true,
      };
    case ADD_EXCEPTION_SUCCESS:
      return {
        ...state,
        availabilityExceptions: [...state.availabilityExceptions, payload],
        addExceptionInProgress: false,
      };
    case ADD_EXCEPTION_ERROR:
      return {
        ...state,
        addExceptionError: payload.error,
        addExceptionInProgress: false,
      };

    case DELETE_EXCEPTION_REQUEST:
      return {
        ...state,
        deleteExceptionError: null,
        deleteExceptionInProgress: true,
      };
    case DELETE_EXCEPTION_SUCCESS: {
      const deletedExceptionId = payload.id;
      const availabilityExceptions = state.availabilityExceptions.filter(
        e => e.id.uuid !== deletedExceptionId.uuid
      );
      return {
        ...state,
        availabilityExceptions,
        deleteExceptionInProgress: false,
      };
    }
    case DELETE_EXCEPTION_ERROR:
      return {
        ...state,
        deleteExceptionError: payload.error,
        deleteExceptionInProgress: false,
      };

    case UPLOAD_IMAGE_REQUEST: {
      // payload.params: { id: 'tempId', file }
      const uploadedImages = {
        ...state.uploadedImages,
        [payload.params.id]: { ...payload.params },
      };
      return {
        ...state,
        uploadedImages,
        uploadedImagesOrder: state.uploadedImagesOrder.concat([payload.params.id]),
        uploadImageError: null,
      };
    }
    case UPLOAD_IMAGE_SUCCESS: {
      // payload.params: { id: 'tempId', imageId: 'some-real-id', attributes, type }
      const { id, ...rest } = payload;
      const uploadedImages = { ...state.uploadedImages, [id]: { id, ...rest } };
      return { ...state, uploadedImages };
    }
    case UPLOAD_IMAGE_ERROR: {
      // eslint-disable-next-line no-console
      const { id, error } = payload;
      const uploadedImagesOrder = state.uploadedImagesOrder.filter(i => i !== id);
      const uploadedImages = omit(state.uploadedImages, id);
      return { ...state, uploadedImagesOrder, uploadedImages, uploadImageError: error };
    }

    case REMOVE_LISTING_IMAGE: {
      const id = payload.imageId;

      // Only mark the image removed if it hasn't been added to the
      // listing already
      const removedImageIds = state.uploadedImages[id]
        ? state.removedImageIds
        : state.removedImageIds.concat(id);

      // Always remove from the draft since it might be a new image to
      // an existing listing.
      const uploadedImages = omit(state.uploadedImages, id);
      const uploadedImagesOrder = state.uploadedImagesOrder.filter(i => i !== id);

      return { ...state, uploadedImages, uploadedImagesOrder, removedImageIds };
    }

    case SET_STOCK_REQUEST:
      return { ...state, setStockInProgress: true, setStockError: null };
    case SET_STOCK_SUCCESS:
      return { ...state, setStockInProgress: false };
    case SET_STOCK_ERROR:
      return { ...state, setStockInProgress: false, setStockError: payload };

    case SAVE_PAYOUT_DETAILS_REQUEST:
      return { ...state, payoutDetailsSaveInProgress: true };
    case SAVE_PAYOUT_DETAILS_ERROR:
      return { ...state, payoutDetailsSaveInProgress: false };
    case SAVE_PAYOUT_DETAILS_SUCCESS:
      return { ...state, payoutDetailsSaveInProgress: false, payoutDetailsSaved: true };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const markTabUpdated = tab => ({
  type: MARK_TAB_UPDATED,
  payload: tab,
});

export const clearUpdatedTab = () => ({
  type: CLEAR_UPDATED_TAB,
});

export const removeListingImage = imageId => ({
  type: REMOVE_LISTING_IMAGE,
  payload: { imageId },
});

// All the action creators that don't have the {Success, Error} suffix
// take the params object that the corresponding SDK endpoint method
// expects.

// SDK method: ownListings.create
export const createListingDraftRequest = requestAction(CREATE_LISTING_DRAFT_REQUEST);
export const createListingDraftSuccess = successAction(CREATE_LISTING_DRAFT_SUCCESS);
export const createListingDraftError = errorAction(CREATE_LISTING_DRAFT_ERROR);

// SDK method: ownListings.publish
export const publishListingRequest = requestAction(PUBLISH_LISTING_REQUEST);
export const publishListingSuccess = successAction(PUBLISH_LISTING_SUCCESS);
export const publishListingError = errorAction(PUBLISH_LISTING_ERROR);

// SDK method: ownListings.update
export const updateListingRequest = requestAction(UPDATE_LISTING_REQUEST);
export const updateListingSuccess = successAction(UPDATE_LISTING_SUCCESS);
export const updateListingError = errorAction(UPDATE_LISTING_ERROR);

// SDK method: ownListings.show
export const showListingsRequest = requestAction(SHOW_LISTINGS_REQUEST);
export const showListingsSuccess = successAction(SHOW_LISTINGS_SUCCESS);
export const showListingsError = errorAction(SHOW_LISTINGS_ERROR);

// SDK method: images.upload
export const uploadImageRequest = requestAction(UPLOAD_IMAGE_REQUEST);
export const uploadImageSuccess = successAction(UPLOAD_IMAGE_SUCCESS);
export const uploadImageError = errorAction(UPLOAD_IMAGE_ERROR);

// SDK method: stock.compareAndSet
export const setStockRequest = requestAction(SET_STOCK_REQUEST);
export const setStockSuccess = successAction(SET_STOCK_SUCCESS);
export const setStockError = errorAction(SET_STOCK_ERROR);

// SDK method: availabilityExceptions.query
export const fetchAvailabilityExceptionsRequest = requestAction(FETCH_EXCEPTIONS_REQUEST);
export const fetchAvailabilityExceptionsSuccess = successAction(FETCH_EXCEPTIONS_SUCCESS);
export const fetchAvailabilityExceptionsError = errorAction(FETCH_EXCEPTIONS_ERROR);

// SDK method: availabilityExceptions.create
export const addAvailabilityExceptionRequest = requestAction(ADD_EXCEPTION_REQUEST);
export const addAvailabilityExceptionSuccess = successAction(ADD_EXCEPTION_SUCCESS);
export const addAvailabilityExceptionError = errorAction(ADD_EXCEPTION_ERROR);

// SDK method: availabilityExceptions.delete
export const deleteAvailabilityExceptionRequest = requestAction(DELETE_EXCEPTION_REQUEST);
export const deleteAvailabilityExceptionSuccess = successAction(DELETE_EXCEPTION_SUCCESS);
export const deleteAvailabilityExceptionError = errorAction(DELETE_EXCEPTION_ERROR);

export const savePayoutDetailsRequest = requestAction(SAVE_PAYOUT_DETAILS_REQUEST);
export const savePayoutDetailsSuccess = successAction(SAVE_PAYOUT_DETAILS_SUCCESS);
export const savePayoutDetailsError = errorAction(SAVE_PAYOUT_DETAILS_ERROR);

// ================ Thunk ================ //

export function requestShowListing(actionPayload) {
  return (dispatch, getState, sdk) => {
    const imageVariantInfo = getImageVariantInfo();
    const queryParams = {
      include: ['author', 'images', 'currentStock'],
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };

    dispatch(showListingsRequest(actionPayload));
    return sdk.ownListings
      .show({ ...actionPayload, ...queryParams })
      .then(response => {
        // EditListingPage fetches new listing data, which also needs to be added to global data
        dispatch(addMarketplaceEntities(response));
        // In case of success, we'll clear state.EditListingPage (user will be redirected away)
        dispatch(showListingsSuccess(response));
        return response;
      })
      .catch(e => dispatch(showListingsError(storableError(e))));
  };
}

// Set stock if requested among listing update info
export function compareAndSetStock(listingId, oldTotal, newTotal) {
  return (dispatch, getState, sdk) => {
    dispatch(setStockRequest());

    return sdk.stock
      .compareAndSet({ listingId, oldTotal, newTotal }, { expand: true })
      .then(response => {
        // NOTE: compareAndSet returns the stock resource of the listing.
        // We update client app's internal state with these updated API entities.
        dispatch(addMarketplaceEntities(response));
        dispatch(setStockSuccess(response));
      })
      .catch(e => {
        log.error(e, 'update-stock-failed', { listingId, oldTotal, newTotal });
        return dispatch(setStockError(storableError(e)));
      });
  };
}

// Helper function to make compareAndSetStock call if stock update is needed.
const updateStockOfListingMaybe = (listingId, stockTotals, dispatch) => {
  const { oldTotal, newTotal } = stockTotals || {};
  // Note: newTotal and oldTotal must be given, but oldTotal can be null
  const hasStockTotals = newTotal >= 0 && typeof oldTotal !== 'undefined';

  if (listingId && hasStockTotals) {
    return dispatch(compareAndSetStock(listingId, oldTotal, newTotal));
  }
  return Promise.resolve();
};

// Create listing in draft state
// NOTE: we want to keep it possible to include stock management field to the first wizard form.
// this means that there needs to be a sequence of calls:
// create, set stock, show listing (to get updated currentStock entity)
export function requestCreateListingDraft(data) {
  return (dispatch, getState, sdk) => {
    dispatch(createListingDraftRequest(data));
    const { stockUpdate, images, ...rest } = data;

    // If images should be saved, create array out of the image UUIDs for the API call
    // Note: in FTW, image upload is not happening at the same time as listing creation.
    const imageProperty = typeof images !== 'undefined' ? { images: imageIds(images) } : {};
    const ownListingValues = { ...imageProperty, ...rest };

    const imageVariantInfo = getImageVariantInfo();
    const queryParams = {
      expand: true,
      include: ['author', 'images', 'currentStock'],
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };

    let createDraftResponse = null;
    return sdk.ownListings
      .createDraft(ownListingValues, queryParams)
      .then(response => {
        createDraftResponse = response;
        const listingId = response.data.data.id;
        // If stockUpdate info is passed through, update stock
        return updateStockOfListingMaybe(listingId, stockUpdate, dispatch);
      })
      .then(() => {
        // Modify store to understand that we have created listing and can redirect away
        dispatch(createListingDraftSuccess(createDraftResponse));
        return createDraftResponse;
      })
      .catch(e => {
        log.error(e, 'create-listing-draft-failed', { listingData: data });
        return dispatch(createListingDraftError(storableError(e)));
      });
  };
}

// Update the given tab of the wizard with the given data. This saves
// the data to the listing, and marks the tab updated so the UI can
// display the state.
// NOTE: what comes to stock management, this follows the same pattern used in create listing call
export function requestUpdateListing(tab, data) {
  return (dispatch, getState, sdk) => {
    dispatch(updateListingRequest(data));
    const { id, stockUpdate, images, ...rest } = data;

    // If images should be saved, create array out of the image UUIDs for the API call
    const imageProperty = typeof images !== 'undefined' ? { images: imageIds(images) } : {};
    const ownListingUpdateValues = { id, ...imageProperty, ...rest };
    const imageVariantInfo = getImageVariantInfo();
    const queryParams = {
      expand: true,
      include: ['author', 'images', 'currentStock'],
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };

    // Note: if update values include stockUpdate, we'll do that first
    // That way we get updated currentStock info among ownListings.update
    return updateStockOfListingMaybe(id, stockUpdate, dispatch)
      .then(() => sdk.ownListings.update(ownListingUpdateValues, queryParams))
      .then(response => {
        dispatch(updateListingSuccess(response));
        dispatch(addMarketplaceEntities(response));
        dispatch(markTabUpdated(tab));
        return response;
      })
      .catch(e => {
        log.error(e, 'update-listing-failed', { listingData: data });
        return dispatch(updateListingError(storableError(e)));
      });
  };
}

export const requestPublishListingDraft = listingId => (dispatch, getState, sdk) => {
  dispatch(publishListingRequest(listingId));

  return sdk.ownListings
    .publishDraft({ id: listingId }, { expand: true })
    .then(response => {
      // Add the created listing to the marketplace data
      dispatch(addMarketplaceEntities(response));
      dispatch(publishListingSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(publishListingError(storableError(e)));
    });
};

// Images return imageId which we need to map with previously generated temporary id
export function requestImageUpload(actionPayload) {
  return (dispatch, getState, sdk) => {
    const id = actionPayload.id;
    const imageVariantInfo = getImageVariantInfo();
    const queryParams = {
      expand: true,
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };

    dispatch(uploadImageRequest(actionPayload));
    return sdk.images
      .upload({ image: actionPayload.file }, queryParams)
      .then(resp => {
        const img = resp.data.data;
        // Uploaded image has an existing id that refers to file
        // The UUID was created as a consequence of this upload call - it's saved to imageId property
        return dispatch(uploadImageSuccess({ data: { ...img, id, imageId: img.id } }));
      })
      .catch(e => dispatch(uploadImageError({ id, error: storableError(e) })));
  };
}

export const requestAddAvailabilityException = params => (dispatch, getState, sdk) => {
  dispatch(addAvailabilityExceptionRequest(params));

  return sdk.availabilityExceptions
    .create(params, { expand: true })
    .then(response => {
      const availabilityException = response.data.data;
      return dispatch(addAvailabilityExceptionSuccess({ data: availabilityException }));
    })
    .catch(e => {
      dispatch(addAvailabilityExceptionError({ error: storableError(e) }));
      throw e;
    });
};

export const requestDeleteAvailabilityException = params => (dispatch, getState, sdk) => {
  dispatch(deleteAvailabilityExceptionRequest(params));

  return sdk.availabilityExceptions
    .delete(params, { expand: true })
    .then(response => {
      const availabilityException = response.data.data;
      return dispatch(deleteAvailabilityExceptionSuccess({ data: availabilityException }));
    })
    .catch(e => {
      dispatch(deleteAvailabilityExceptionError({ error: storableError(e) }));
      throw e;
    });
};

export const requestFetchAvailabilityExceptions = fetchParams => (dispatch, getState, sdk) => {
  dispatch(fetchAvailabilityExceptionsRequest(fetchParams));

  return sdk.availabilityExceptions
    .query(fetchParams, { expand: true })
    .then(response => {
      const availabilityExceptions = denormalisedResponseEntities(response);
      return dispatch(fetchAvailabilityExceptionsSuccess({ data: availabilityExceptions }));
    })
    .catch(e => {
      return dispatch(fetchAvailabilityExceptionsError({ error: storableError(e) }));
    });
};

export const savePayoutDetails = (values, isUpdateCall) => (dispatch, getState, sdk) => {
  const upsertThunk = isUpdateCall ? updateStripeAccount : createStripeAccount;
  dispatch(savePayoutDetailsRequest());

  return dispatch(upsertThunk(values, { expand: true }))
    .then(response => {
      dispatch(savePayoutDetailsSuccess());
      return response;
    })
    .catch(() => dispatch(savePayoutDetailsError()));
};

// loadData is run for each tab of the wizard. When editing an
// existing listing, the listing must be fetched first.
export const loadData = params => (dispatch, getState, sdk) => {
  dispatch(clearUpdatedTab());
  const { id, type } = params;

  if (type === 'new') {
    // No need to listing data when creating a new listing
    return Promise.all([dispatch(fetchCurrentUser())])
      .then(response => {
        const currentUser = getState().user.currentUser;
        if (currentUser && currentUser.stripeAccount) {
          dispatch(fetchStripeAccount());
        }
        return response;
      })
      .catch(e => {
        throw e;
      });
  }

  const payload = { id: new UUID(id) };
  return Promise.all([dispatch(requestShowListing(payload)), dispatch(fetchCurrentUser())])
    .then(response => {
      const currentUser = getState().user.currentUser;
      if (currentUser && currentUser.stripeAccount) {
        dispatch(fetchStripeAccount());
      }

      // Because of two dispatch functions, response is an array.
      // We are only interested in the response from requestShowListing here,
      // so we need to pick the first one
      if (response[0].data && response[0].data.data) {
        const listing = response[0].data.data;

        // If the listing doesn't have availabilityPlan yet
        // use the defaul timezone
        const availabilityPlan = listing.attributes.availabilityPlan;

        const tz = availabilityPlan
          ? listing.attributes.availabilityPlan.timezone
          : typeof window !== 'undefined'
          ? getDefaultTimeZoneOnBrowser()
          : 'Etc/UTC';

        const today = new Date();
        const start = getStartOf(today, 'day', tz);
        // Query range: today + 364 days
        const exceptionRange = 364;
        const end = getStartOf(today, 'day', tz, exceptionRange, 'days');

        // NOTE: in this template, we don't expect more than 100 exceptions.
        // If there are more exceptions, pagination kicks in and we can't use frontend sorting.
        const params = {
          listingId: listing.id,
          start,
          end,
        };
        dispatch(requestFetchAvailabilityExceptions(params));
      }

      return response;
    })
    .catch(e => {
      throw e;
    });
};
