import { createImageVariantConfig } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { isCreativeSeller } from '../../util/userHelpers';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

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

const requestAction = actionType => params => ({ type: actionType, payload: { params } });
const successAction = actionType => result => ({ type: actionType, payload: result.data });
const errorAction = actionType => payload => ({ type: actionType, payload, error: true });

// ================ Action types ================ //

export const CLEAR_UPDATED = 'app/CreativeDetailsPage/CLEAR_UPDATED';

export const UPDATE_LISTING_REQUEST = 'app/CreativeDetailsPage/UPDATE_LISTING_REQUEST';
export const UPDATE_LISTING_SUCCESS = 'app/CreativeDetailsPage/UPDATE_LISTING_SUCCESS';
export const UPDATE_LISTING_ERROR = 'app/CreativeDetailsPage/UPDATE_LISTING_ERROR';

export const SHOW_LISTINGS_REQUEST = 'app/CreativeDetailsPage/SHOW_LISTINGS_REQUEST';
export const SHOW_LISTINGS_SUCCESS = 'app/CreativeDetailsPage/SHOW_LISTINGS_SUCCESS';
export const SHOW_LISTINGS_ERROR = 'app/CreativeDetailsPage/SHOW_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  listingId: null,
  updateListingError: null,
  showListingsError: null,
  updateInProgress: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case CLEAR_UPDATED:
      return { ...state, updateListingError: null };

    case UPDATE_LISTING_REQUEST:
      return { ...state, updateInProgress: true, updateListingError: null };
    case UPDATE_LISTING_SUCCESS:
      return {
        ...state,
        updateInProgress: false,
      };
    case UPDATE_LISTING_ERROR:
      return { ...state, updateInProgress: false, updateListingError: payload };

    case SHOW_LISTINGS_REQUEST:
      return { ...state, showListingsError: null };
    case SHOW_LISTINGS_SUCCESS: {
      const listingIdFromPayload = payload.data.id;
      // If listing stays the same, we trust previously fetched exception data.
      return { ...initialState, listingId: listingIdFromPayload };
    }
    case SHOW_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, showListingsError: payload };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const clearUpdated = () => ({
  type: CLEAR_UPDATED,
});

// All the action creators that don't have the {Success, Error} suffix
// take the params object that the corresponding SDK endpoint method
// expects.

// SDK method: ownListings.update
export const updateListingRequest = requestAction(UPDATE_LISTING_REQUEST);
export const updateListingSuccess = successAction(UPDATE_LISTING_SUCCESS);
export const updateListingError = errorAction(UPDATE_LISTING_ERROR);

// SDK method: ownListings.show
export const showListingsRequest = requestAction(SHOW_LISTINGS_REQUEST);
export const showListingsSuccess = successAction(SHOW_LISTINGS_SUCCESS);
export const showListingsError = errorAction(SHOW_LISTINGS_ERROR);

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
        // CreativeDetailsPage fetches new listing data, which also needs to be added to global data
        dispatch(addMarketplaceEntities(response));
        // In case of success, we'll clear state.CreativeDetailsPage (user will be redirected away)
        dispatch(showListingsSuccess(response));
        return response;
      })
      .catch(e => dispatch(showListingsError(storableError(e))));
  };
}

export function requestUpdateListing(data, config) {
  return (dispatch, getState, sdk) => {
    dispatch(updateListingRequest(data));
    const { id, ...rest } = data;
    const ownListingUpdateValues = { id, ...rest };
    const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
    const queryParams = {
      expand: true,
      include: ['author', 'images', 'currentStock'],
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };
    return sdk.ownListings
      .update(ownListingUpdateValues, queryParams)
      .then(response => {
        dispatch(updateListingSuccess(response));
        dispatch(addMarketplaceEntities(response));
        return response;
      })
      .catch(e => {
        log.error(e, 'update-listing-failed', { listingData: data });
        return dispatch(updateListingError(storableError(e)));
      });
  };
}

// loadData is run for each tab of the wizard. When editing an
// existing listing, the listing must be fetched first.
export const loadData = (params, search, config) => async (dispatch, getState) => {
  dispatch(clearUpdated());
  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };
  await dispatch(fetchCurrentUser(fetchCurrentUserOptions));
  const currentUser = getState().user.currentUser;
  const { publicData, metadata } = currentUser?.attributes.profile;
  const { userType } = publicData || {};
  const profileListingId = metadata?.profileListingId;
  const withProfileListing = !!profileListingId;
  const withCreativeProfile = isCreativeSeller(userType) && withProfileListing;
  if (!withCreativeProfile) {
    return [];
  }
  const payload = { id: profileListingId };
  return Promise.all([dispatch(requestShowListing(payload, config))]).catch(e => {
    throw e;
  });
};
