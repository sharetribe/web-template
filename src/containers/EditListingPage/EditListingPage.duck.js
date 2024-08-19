import omit from 'lodash/omit';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../util/data';
import {
  getDefaultTimeZoneOnBrowser,
  getStartOf,
  getStartOfWeek,
  monthIdString,
  parseDateFromISO8601,
  stringifyDateToISO8601,
} from '../../util/dates';
import { uniqueBy } from '../../util/generators';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { parse } from '../../util/urlHelpers';
import { isUserAuthorized } from '../../util/userHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  createStripeAccount,
  updateStripeAccount,
  fetchStripeAccount,
} from '../../ducks/stripeConnectAccount.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

const { UUID } = sdkTypes;

// Create array of N items where indexing starts from 1
const getArrayOfNItems = n =>
  Array(n)
    .fill()
    .map((v, i) => i + 1)
    .slice(1);

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

const getImageVariantInfo = listingImageConfig => {
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImageConfig;
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

const sortExceptionsByStartTime = (a, b) => {
  return a.attributes.start.getTime() - b.attributes.start.getTime();
};

// When navigating through weekly calendar,
// we want to merge new week-related data (inProgres, error) to weeklyExceptionQueries hashmap.
const mergeToWeeklyExceptionQueries = (weeklyExceptionQueries, weekStartId, newDataProps) => {
  return weekStartId
    ? {
        weeklyExceptionQueries: {
          ...weeklyExceptionQueries,
          [weekStartId]: {
            ...weeklyExceptionQueries[weekStartId],
            ...newDataProps,
          },
        },
      }
    : {};
};
// When navigating through monthly calendar (e.g. when adding a new AvailabilityException),
// we want to merge new month-related data (inProgres, error) to monthlyExceptionQueries hashmap.
const mergeToMonthlyExceptionQueries = (monthlyExceptionQueries, monthId, newDataProps) => {
  return monthId
    ? {
        monthlyExceptionQueries: {
          ...monthlyExceptionQueries,
          [monthId]: {
            ...monthlyExceptionQueries[monthId],
            ...newDataProps,
          },
        },
      }
    : {};
};

const requestAction = actionType => params => ({ type: actionType, payload: { params } });

const successAction = actionType => result => ({ type: actionType, payload: result.data });

const errorAction = actionType => payload => ({ type: actionType, payload, error: true });

// ================ Action types ================ //

export const MARK_TAB_UPDATED = 'app/EditListingPage/MARK_TAB_UPDATED';
export const CLEAR_UPDATED_TAB = 'app/EditListingPage/CLEAR_UPDATED_TAB';
export const CLEAR_PUBLISH_ERROR = 'app/EditListingPage/CLEAR_PUBLISH_ERROR';

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
export const FETCH_EXTRA_EXCEPTIONS_SUCCESS =
  'app/EditListingPage/FETCH_EXTRA_AVAILABILITY_EXCEPTIONS_SUCCESS';

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
  listingId: null,
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
  addExceptionError: null,
  addExceptionInProgress: false,
  weeklyExceptionQueries: {
    // '2022-12-12': { // Note: id/key is the start of the week in given time zone
    //   fetchExceptionsError: null,
    //   fetchExceptionsInProgress: null,
    // },
  },
  monthlyExceptionQueries: {
    // '2022-12': {
    //   fetchExceptionsError: null,
    //   fetchExceptionsInProgress: null,
    // },
  },
  allExceptions: [],
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
    case CLEAR_PUBLISH_ERROR:
      return { ...state, publishListingError: null };

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
        listingId: payload.listingId,
        publishListingError: null,
      };
    case PUBLISH_LISTING_SUCCESS:
      return {
        ...state,
        redirectToListing: true,
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
        publishListingError: {
          listingId: state.listingId,
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
    case SHOW_LISTINGS_SUCCESS: {
      const listingIdFromPayload = payload.data.id;
      const { listingId, allExceptions, weeklyExceptionQueries, monthlyExceptionQueries } = state;
      // If listing stays the same, we trust previously fetched exception data.
      return listingIdFromPayload?.uuid === state.listingId?.uuid
        ? {
            ...initialState,
            listingId,
            allExceptions,
            weeklyExceptionQueries,
            monthlyExceptionQueries,
          }
        : { ...initialState, listingId: listingIdFromPayload };
    }
    case SHOW_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, showListingsError: payload, redirectToListing: false };

    case FETCH_EXCEPTIONS_REQUEST: {
      const { monthId, weekStartId } = payload.params;
      const newData = { fetchExceptionsError: null, fetchExceptionsInProgress: true };

      const exceptionQueriesMaybe = monthId
        ? mergeToMonthlyExceptionQueries(state.monthlyExceptionQueries, monthId, newData)
        : weekStartId
        ? mergeToWeeklyExceptionQueries(state.weeklyExceptionQueries, weekStartId, newData)
        : {};
      return { ...state, ...exceptionQueriesMaybe };
    }
    case FETCH_EXCEPTIONS_SUCCESS: {
      const { exceptions, monthId, weekStartId } = payload;
      const combinedExceptions = state.allExceptions.concat(exceptions);
      const selectId = x => x.id.uuid;
      const allExceptions = uniqueBy(combinedExceptions, selectId).sort(sortExceptionsByStartTime);
      const newData = { fetchExceptionsInProgress: false };

      const exceptionQueriesMaybe = monthId
        ? mergeToMonthlyExceptionQueries(state.monthlyExceptionQueries, monthId, newData)
        : weekStartId
        ? mergeToWeeklyExceptionQueries(state.weeklyExceptionQueries, weekStartId, newData)
        : {};
      return { ...state, allExceptions, ...exceptionQueriesMaybe };
    }
    case FETCH_EXCEPTIONS_ERROR: {
      const { monthId, weekStartId, error } = payload;
      const newData = { fetchExceptionsInProgress: false, fetchExceptionsError: error };

      const exceptionQueriesMaybe = monthId
        ? mergeToMonthlyExceptionQueries(state.monthlyExceptionQueries, monthId, newData)
        : weekStartId
        ? mergeToWeeklyExceptionQueries(state.weeklyExceptionQueries, weekStartId, newData)
        : {};

      return { ...state, ...exceptionQueriesMaybe };
    }
    case FETCH_EXTRA_EXCEPTIONS_SUCCESS: {
      const combinedExceptions = state.allExceptions.concat(payload.exceptions);
      const selectId = x => x.id.uuid;
      const allExceptions = uniqueBy(combinedExceptions, selectId).sort(sortExceptionsByStartTime);
      // TODO: currently we don't handle thrown errors from these paginated calls
      return { ...state, allExceptions };
    }
    case ADD_EXCEPTION_REQUEST:
      return {
        ...state,
        addExceptionError: null,
        addExceptionInProgress: true,
      };
    case ADD_EXCEPTION_SUCCESS: {
      const exception = payload;
      const combinedExceptions = state.allExceptions.concat(exception);
      const allExceptions = combinedExceptions.sort(sortExceptionsByStartTime);
      return {
        ...state,
        allExceptions,
        addExceptionInProgress: false,
      };
    }
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
      const exception = payload;
      const id = exception.id.uuid;
      const allExceptions = state.allExceptions.filter(e => e.id.uuid !== id);
      return {
        ...state,
        allExceptions,
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

export const clearPublishError = () => ({
  type: CLEAR_PUBLISH_ERROR,
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
// Add extra data from additional pages
export const fetchExtraAvailabilityExceptionsSuccess = successAction(
  FETCH_EXTRA_EXCEPTIONS_SUCCESS
);

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

export function requestShowListing(actionPayload, config) {
  return (dispatch, getState, sdk) => {
    const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
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
export function requestCreateListingDraft(data, config) {
  return (dispatch, getState, sdk) => {
    dispatch(createListingDraftRequest(data));
    const { stockUpdate, images, ...rest } = data;

    // If images should be saved, create array out of the image UUIDs for the API call
    // Note: in this template, image upload is not happening at the same time as listing creation.
    const imageProperty = typeof images !== 'undefined' ? { images: imageIds(images) } : {};
    const ownListingValues = { ...imageProperty, ...rest };

    const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
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
export function requestUpdateListing(tab, data, config) {
  return (dispatch, getState, sdk) => {
    dispatch(updateListingRequest(data));
    const { id, stockUpdate, images, ...rest } = data;

    // If images should be saved, create array out of the image UUIDs for the API call
    const imageProperty = typeof images !== 'undefined' ? { images: imageIds(images) } : {};
    const ownListingUpdateValues = { id, ...imageProperty, ...rest };
    const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
    const queryParams = {
      expand: true,
      include: ['author', 'images', 'currentStock'],
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };

    const state = getState();
    const existingTimeZone =
      state.marketplaceData.entities.ownListing[id.uuid]?.attributes?.availabilityPlan?.timezone;
    const includedTimeZone = rest?.availabilityPlan?.timezone;

    // Note: if update values include stockUpdate, we'll do that first
    // That way we get updated currentStock info among ownListings.update
    return updateStockOfListingMaybe(id, stockUpdate, dispatch)
      .then(() => sdk.ownListings.update(ownListingUpdateValues, queryParams))
      .then(response => {
        dispatch(updateListingSuccess(response));
        dispatch(addMarketplaceEntities(response));
        dispatch(markTabUpdated(tab));

        // If time zone has changed, we need to fetch exceptions again
        // since week and month boundaries might have changed.
        if (!!includedTimeZone && includedTimeZone !== existingTimeZone) {
          const searchString = '';
          const firstDayOfWeek = config.localization.firstDayOfWeek;
          const listing = response.data.data;
          fetchLoadDataExceptions(dispatch, listing, searchString, firstDayOfWeek);
        }

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
export function requestImageUpload(actionPayload, listingImageConfig) {
  return (dispatch, getState, sdk) => {
    const id = actionPayload.id;
    const imageVariantInfo = getImageVariantInfo(listingImageConfig);
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
        return dispatch(
          uploadImageSuccess({ data: { ...img, id, imageId: img.id, file: actionPayload.file } })
        );
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

export const requestFetchAvailabilityExceptions = params => (dispatch, getState, sdk) => {
  const { listingId, start, end, timeZone, page, isWeekly } = params;
  const fetchParams = { listingId, start, end };
  const timeUnitIdProp = isWeekly
    ? { weekStartId: stringifyDateToISO8601(start) }
    : { monthId: monthIdString(start, timeZone) };
  dispatch(fetchAvailabilityExceptionsRequest(timeUnitIdProp));

  return sdk.availabilityExceptions
    .query(fetchParams)
    .then(response => {
      const availabilityExceptions = denormalisedResponseEntities(response);

      // Fetch potential extra exceptions pagination pages per month.
      // In theory, there could be several pagination pages worth of exceptions,
      // if range is month and unit is 'hour': 31 days * 24 hour = 744 slots for exceptions.
      const totalPages = response.data.meta.totalPages;
      if (totalPages > 1 && !page) {
        const extraPages = getArrayOfNItems(totalPages);

        // It's unlikely that this code is reached with default units.
        // Note:
        //  - Firing multiple API calls might hit API rate limit
        //    (This is very unlikely with this query and 'hour' unit.)
        //  - TODO: this doesn't take care of failures of those extra calls
        Promise.all(
          extraPages.map(page => {
            return sdk.availabilityExceptions.query({ ...fetchParams, page });
          })
        ).then(responses => {
          const denormalizedFlatResults = (all, r) => all.concat(denormalisedResponseEntities(r));
          const exceptions = responses.reduce(denormalizedFlatResults, []);
          dispatch(
            fetchExtraAvailabilityExceptionsSuccess({
              data: { ...timeUnitIdProp, exceptions },
            })
          );
        });
      }

      return dispatch(
        fetchAvailabilityExceptionsSuccess({
          data: { ...timeUnitIdProp, exceptions: availabilityExceptions },
        })
      );
    })
    .catch(e => {
      return dispatch(
        fetchAvailabilityExceptionsError({ ...timeUnitIdProp, error: storableError(e) })
      );
    });
};

// Helper function for loadData call.
const fetchLoadDataExceptions = (dispatch, listing, search, firstDayOfWeek) => {
  const hasWindow = typeof window !== 'undefined';
  // Listing could be ownListing entity too, so we just check if attributes key exists
  const hasTimeZone = listing?.attributes?.availabilityPlan?.timezone;

  // Fetch time-zones on client side only.
  // Note: listing needs to have time zone set!
  if (hasWindow && listing.id && hasTimeZone) {
    const listingId = listing.id;
    // If the listing doesn't have availabilityPlan yet
    // use the defaul timezone
    const timezone = listing.attributes.availabilityPlan?.timezone || getDefaultTimeZoneOnBrowser();
    const todayInListingsTZ = getStartOf(new Date(), 'day', timezone);

    const locationSearch = parse(search);
    const selectedDate = locationSearch?.d
      ? parseDateFromISO8601(locationSearch.d, timezone)
      : todayInListingsTZ;
    const startOfWeek = getStartOfWeek(selectedDate, timezone, firstDayOfWeek);
    const prevWeek = getStartOf(startOfWeek, 'day', timezone, -7, 'days');
    const nextWeek = getStartOf(startOfWeek, 'day', timezone, 7, 'days');
    const nextAfterNextWeek = getStartOf(nextWeek, 'day', timezone, 7, 'days');

    const nextMonth = getStartOf(todayInListingsTZ, 'month', timezone, 1, 'months');
    const nextAfterNextMonth = getStartOf(nextMonth, 'month', timezone, 1, 'months');

    const sharedData = { listingId, timeZone: timezone };

    // Fetch data for selected week and nearest weeks for WeeklyCalendar
    // Plus current month and month after that for EditListingAvailabilityForm
    //
    // NOTE: This is making 5 different Thunk calls, which update store 2 times each
    //       It would make sense to make on thunk function that fires 5 sdk calls/promises,
    //       but for the time being, it's clearer to push all the calls through
    //       requestFetchAvailabilityExceptions
    return Promise.all([
      dispatch(
        requestFetchAvailabilityExceptions({
          ...sharedData,
          isWeekly: true,
          start: prevWeek,
          end: startOfWeek,
        })
      ),
      dispatch(
        requestFetchAvailabilityExceptions({
          ...sharedData,
          isWeekly: true,
          start: startOfWeek,
          end: nextWeek,
        })
      ),
      dispatch(
        requestFetchAvailabilityExceptions({
          ...sharedData,
          isWeekly: true,
          start: nextWeek,
          end: nextAfterNextWeek,
        })
      ),
      dispatch(
        requestFetchAvailabilityExceptions({
          ...sharedData,
          start: todayInListingsTZ,
          end: nextMonth,
        })
      ),
      dispatch(
        requestFetchAvailabilityExceptions({
          ...sharedData,
          start: nextMonth,
          end: nextAfterNextMonth,
        })
      ),
    ]);
  }

  // By default return an empty array
  return Promise.all([]);
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
export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  dispatch(clearUpdatedTab());
  dispatch(clearPublishError());
  const { id, type } = params;
  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };

  if (type === 'new') {
    // No need to listing data when creating a new listing
    return Promise.all([dispatch(fetchCurrentUser(fetchCurrentUserOptions))])
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
  return Promise.all([
    dispatch(requestShowListing(payload, config)),
    dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
  ])
    .then(response => {
      const currentUser = getState().user.currentUser;

      // Do not fetch extra information if user is in pending-approval state.
      if (isUserAuthorized(currentUser)) {
        if (currentUser && currentUser.stripeAccount) {
          dispatch(fetchStripeAccount());
        }

        // Because of two dispatch functions, response is an array.
        // We are only interested in the response from requestShowListing here,
        // so we need to pick the first one
        const listing = response[0]?.data?.data;
        const transactionProcessAlias = listing?.attributes?.publicData?.transactionProcessAlias;
        if (listing && isBookingProcessAlias(transactionProcessAlias)) {
          fetchLoadDataExceptions(dispatch, listing, search, config.localization.firstDayOfWeek);
        }
      }

      return response;
    })
    .catch(e => {
      throw e;
    });
};
