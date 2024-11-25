import pick from 'lodash/pick';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser, fetchCurrentUserHasOrdersSuccess } from '../../ducks/user.duck';
import { getProcess, isBookingProcessAlias } from '../../transactions/transaction';
import { getOfferListingbyListingId, transactionLineItems } from '../../util/api';
import {
  denormalisedEntities,
  denormalisedResponseEntities,
  updatedEntities,
} from '../../util/data';
import { findNextBoundary, getStartOf, monthIdString } from '../../util/dates';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { createImageVariantConfig, types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import {
  hasPermissionToInitiateTransactions,
  hasPermissionToViewData,
  isUserAuthorized,
} from '../../util/userHelpers';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/ListingPage/SET_INITIAL_VALUES';

export const SHOW_LISTING_REQUEST = 'app/ListingPage/SHOW_LISTING_REQUEST';
export const SHOW_LISTING_ERROR = 'app/ListingPage/SHOW_LISTING_ERROR';

export const FETCH_REVIEWS_REQUEST = 'app/ListingPage/FETCH_REVIEWS_REQUEST';
export const FETCH_REVIEWS_SUCCESS = 'app/ListingPage/FETCH_REVIEWS_SUCCESS';
export const FETCH_REVIEWS_ERROR = 'app/ListingPage/FETCH_REVIEWS_ERROR';

export const FETCH_TIME_SLOTS_REQUEST = 'app/ListingPage/FETCH_TIME_SLOTS_REQUEST';
export const FETCH_TIME_SLOTS_SUCCESS = 'app/ListingPage/FETCH_TIME_SLOTS_SUCCESS';
export const FETCH_TIME_SLOTS_ERROR = 'app/ListingPage/FETCH_TIME_SLOTS_ERROR';

export const FETCH_LINE_ITEMS_REQUEST = 'app/ListingPage/FETCH_LINE_ITEMS_REQUEST';
export const FETCH_LINE_ITEMS_SUCCESS = 'app/ListingPage/FETCH_LINE_ITEMS_SUCCESS';
export const FETCH_LINE_ITEMS_ERROR = 'app/ListingPage/FETCH_LINE_ITEMS_ERROR';

export const SEND_INQUIRY_REQUEST = 'app/ListingPage/SEND_INQUIRY_REQUEST';
export const SEND_INQUIRY_SUCCESS = 'app/ListingPage/SEND_INQUIRY_SUCCESS';
export const SEND_INQUIRY_ERROR = 'app/ListingPage/SEND_INQUIRY_ERROR';

export const INITIATE_CREATE_SELLER_LISTING = 'app/ListingPage/INITIATE_CREATE_SELLER_LISTING';
export const INITIATE_CREATE_SELLER_SUCCESS = 'app/ListingPage/INITIATE_CREATE_SELLER_SUCCESS';
export const INITIATE_CREATE_SELLER_ERROR = 'app/ListingPage/INITIATE_CREATE_SELLER_ERROR';

export const SET_STOCK_REQUEST = 'app/ListingPage/SET_STOCK_REQUEST';
export const SET_STOCK_SUCCESS = 'app/ListingPage/SET_STOCK_SUCCESS';
export const SET_STOCK_ERROR = 'app/ListingPage/SET_STOCK_ERROR';

export const FETCH_LISTING_PAGE_REQUEST = 'app/ListingPage/FETCH_LISTING_PAGE_REQUEST';
export const FETCH_LISTING_PAGE_SUCCESS = 'app/ListingPage/FETCH_LISTING_PAGE_SUCCESS';
export const FETCH_LISTING_PAGE_ERROR = 'app/ListingPage/FETCH_LISTING_PAGE_ERROR';

export const ADD_LISTING_OFFER = 'app/ListingPage/ADD_LISTING_OFFER';

export const FETCH_TRANSACTIONS = 'app/ListingPage/FETCH_TRANSACTIONS';

// ================ Reducer ================ //

const initialState = {
  id: null,
  showListingError: null,
  reviews: [],
  fetchReviewsError: null,
  monthlyTimeSlots: {
    // '2022-03': {
    //   timeSlots: [],
    //   fetchTimeSlotsError: null,
    //   fetchTimeSlotsInProgress: null,
    // },
  },
  lineItems: null,
  fetchLineItemsInProgress: false,
  fetchLineItemsError: null,
  sendInquiryInProgress: false,
  sendInquiryError: null,
  inquiryModalOpenForListingId: null,
  initiateSellerListingInProgress: false,
  fetchCreateSellerListingError: null,
  setStockInProgress: false,
  setStockError: null,
  fetchListingPageInProgress: false,
  fetchListingPageError: null,
  offerListingItems: null,
  listingOfferEntities: null,
  transactionItems: null,
};

const listingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case SHOW_LISTING_REQUEST:
      return { ...state, id: payload.id, showListingError: null };
    case SHOW_LISTING_ERROR:
      return { ...state, showListingError: payload };

    case FETCH_REVIEWS_REQUEST:
      return { ...state, fetchReviewsError: null };
    case FETCH_REVIEWS_SUCCESS:
      return { ...state, reviews: payload };
    case FETCH_REVIEWS_ERROR:
      return { ...state, fetchReviewsError: payload };

    case FETCH_TIME_SLOTS_REQUEST: {
      const monthlyTimeSlots = {
        ...state.monthlyTimeSlots,
        [payload]: {
          ...state.monthlyTimeSlots[payload],
          fetchTimeSlotsError: null,
          fetchTimeSlotsInProgress: true,
        },
      };
      return { ...state, monthlyTimeSlots };
    }
    case FETCH_TIME_SLOTS_SUCCESS: {
      const monthId = payload.monthId;
      const monthlyTimeSlots = {
        ...state.monthlyTimeSlots,
        [monthId]: {
          ...state.monthlyTimeSlots[monthId],
          fetchTimeSlotsInProgress: false,
          timeSlots: payload.timeSlots,
        },
      };
      return { ...state, monthlyTimeSlots };
    }
    case FETCH_TIME_SLOTS_ERROR: {
      const monthId = payload.monthId;
      const monthlyTimeSlots = {
        ...state.monthlyTimeSlots,
        [monthId]: {
          ...state.monthlyTimeSlots[monthId],
          fetchTimeSlotsInProgress: false,
          fetchTimeSlotsError: payload.error,
        },
      };
      return { ...state, monthlyTimeSlots };
    }

    case FETCH_LINE_ITEMS_REQUEST:
      return { ...state, fetchLineItemsInProgress: true, fetchLineItemsError: null };
    case FETCH_LINE_ITEMS_SUCCESS:
      return { ...state, fetchLineItemsInProgress: false, lineItems: payload };
    case FETCH_LINE_ITEMS_ERROR:
      return { ...state, fetchLineItemsInProgress: false, fetchLineItemsError: payload };

    case SEND_INQUIRY_REQUEST:
      return { ...state, sendInquiryInProgress: true, sendInquiryError: null };
    case SEND_INQUIRY_SUCCESS:
      return { ...state, sendInquiryInProgress: false, inquiryModalOpenForListingId: null };
    case SEND_INQUIRY_ERROR:
      return { ...state, sendInquiryInProgress: false, sendInquiryError: payload };

    case INITIATE_CREATE_SELLER_LISTING:
      return {
        ...state,
        initiateSellerListingInProgress: true,
        fetchCreateSellerListingError: null,
      };
    case INITIATE_CREATE_SELLER_SUCCESS:
      return { ...state, initiateSellerListingInProgress: false };
    case INITIATE_CREATE_SELLER_ERROR:
      return {
        ...state,
        initiateSellerListingInProgress: false,
        fetchCreateSellerListingError: payload,
      };

    case SET_STOCK_REQUEST:
      return { ...state, setStockInProgress: true, setStockError: null };
    case SET_STOCK_SUCCESS:
      return { ...state, setStockInProgress: false };
    case SET_STOCK_ERROR:
      return { ...state, setStockInProgress: false, setStockError: payload };

    case FETCH_LISTING_PAGE_REQUEST:
      return { ...state, fetchListingPageInProgress: true, fetchListingPageError: null };
    case FETCH_LISTING_PAGE_SUCCESS:
      return { ...state, fetchListingPageInProgress: false, offerListingItems: payload };
    case FETCH_LISTING_PAGE_ERROR:
      return { ...state, fetchListingPageInProgress: false, fetchListingPageError: payload };

    case ADD_LISTING_OFFER:
      return merge(state, payload);

    case FETCH_TRANSACTIONS:
      return { ...state, transactionItems: payload.e.data };
    default:
      return state;
  }
};

export default listingPageReducer;

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const showListingRequest = id => ({
  type: SHOW_LISTING_REQUEST,
  payload: { id },
});

export const showListingError = e => ({
  type: SHOW_LISTING_ERROR,
  error: true,
  payload: e,
});

export const fetchReviewsRequest = () => ({ type: FETCH_REVIEWS_REQUEST });
export const fetchReviewsSuccess = reviews => ({ type: FETCH_REVIEWS_SUCCESS, payload: reviews });
export const fetchReviewsError = error => ({
  type: FETCH_REVIEWS_ERROR,
  error: true,
  payload: error,
});

export const fetchTimeSlotsRequest = monthId => ({
  type: FETCH_TIME_SLOTS_REQUEST,
  payload: monthId,
});
export const fetchTimeSlotsSuccess = (monthId, timeSlots) => ({
  type: FETCH_TIME_SLOTS_SUCCESS,
  payload: { timeSlots, monthId },
});
export const fetchTimeSlotsError = (monthId, error) => ({
  type: FETCH_TIME_SLOTS_ERROR,
  error: true,
  payload: { monthId, error },
});

export const fetchLineItemsRequest = () => ({ type: FETCH_LINE_ITEMS_REQUEST });
export const fetchLineItemsSuccess = lineItems => ({
  type: FETCH_LINE_ITEMS_SUCCESS,
  payload: lineItems,
});
export const fetchLineItemsError = error => ({
  type: FETCH_LINE_ITEMS_ERROR,
  error: true,
  payload: error,
});

export const sendInquiryRequest = () => ({ type: SEND_INQUIRY_REQUEST });
export const sendInquirySuccess = () => ({ type: SEND_INQUIRY_SUCCESS });
export const sendInquiryError = e => ({ type: SEND_INQUIRY_ERROR, error: true, payload: e });

export const initiateCreateSellerListing = () => ({ type: INITIATE_CREATE_SELLER_LISTING });
export const initiateCreateSellerSuccess = () => ({ type: INITIATE_CREATE_SELLER_SUCCESS });
export const initiateCreateSellerError = e => ({
  type: INITIATE_CREATE_SELLER_ERROR,
  error: true,
  payload: e,
});

export const setStockRequest = () => ({ type: SET_STOCK_REQUEST });
export const setStockSuccess = () => ({ type: SET_STOCK_SUCCESS });
export const setStockError = e => ({ type: SET_STOCK_ERROR, error: true, payload: e });

export const fetchListingPageSuccess = resultIdsItem => ({
  type: FETCH_LISTING_PAGE_SUCCESS,
  payload: resultIdsItem,
});
export const fetchListingPageError = e => ({
  type: FETCH_LISTING_PAGE_ERROR,
  error: true,
  payload: e,
});
export const addListingEntities = (sdkResponse, sanitizeConfig) => ({
  type: ADD_LISTING_OFFER,
  payload: { sdkResponse, sanitizeConfig },
});
export const fetchTransactionItems = e => ({
  type: FETCH_TRANSACTIONS,
  payload: { e },
});

// ================ Thunks ================ //

export const showListing = (listingId, config, isOwn = false) => (dispatch, getState, sdk) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  dispatch(showListingRequest(listingId));
  // Current user entity is fetched in a bit lazy fashion, since it's not tied to returned Promise chain.
  const fetchCurrentUserOptions = {
    updateHasListings: false,
    updateNotifications: false,
  };
  dispatch(fetchCurrentUser(fetchCurrentUserOptions));

  const params = {
    id: listingId,
    include: ['author', 'author.profileImage', 'images', 'currentStock'],
    'fields.image': [
      // Scaled variants for large images
      'variants.scaled-small',
      'variants.scaled-medium',
      'variants.scaled-large',
      'variants.scaled-xlarge',

      // Cropped variants for listing thumbnail images
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
      `variants.${variantPrefix}-4x`,
      `variants.${variantPrefix}-6x`,

      // Social media
      'variants.facebook',
      'variants.twitter',

      // Avatars
      'variants.square-small',
      'variants.square-small2x',
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-4x`, 1600, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-6x`, 2400, aspectRatio),
  };

  const show = isOwn ? sdk.ownListings.show(params) : sdk.listings.show(params);

  // const getT = sdk.transactions.query({only: 'sale',lastTransitions: ['transition/request'],userId: });

  return show
    .then(data => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };
      dispatch(addMarketplaceEntities(data, sanitizeConfig));
      return data;
    })
    .catch(e => {
      dispatch(showListingError(storableError(e)));
    });
};

export const fetchReviews = listingId => (dispatch, getState, sdk) => {
  dispatch(fetchReviewsRequest());
  return sdk.reviews
    .query({
      listing_id: listingId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      dispatch(fetchReviewsSuccess(reviews));
    })
    .catch(e => {
      dispatch(fetchReviewsError(storableError(e)));
    });
};

const timeSlotsRequest = params => (dispatch, getState, sdk) => {
  return sdk.timeslots.query(params).then(response => {
    return denormalisedResponseEntities(response);
  });
};

export const fetchTimeSlots = (listingId, start, end, timeZone) => (dispatch, getState, sdk) => {
  const monthId = monthIdString(start, timeZone);

  dispatch(fetchTimeSlotsRequest(monthId));

  // The maximum pagination page size for timeSlots is 500
  const extraParams = {
    perPage: 500,
    page: 1,
  };

  return dispatch(timeSlotsRequest({ listingId, start, end, ...extraParams }))
    .then(timeSlots => {
      dispatch(fetchTimeSlotsSuccess(monthId, timeSlots));
    })
    .catch(e => {
      dispatch(fetchTimeSlotsError(monthId, storableError(e)));
    });
};

export const sendInquiry = (listing, message) => (dispatch, getState, sdk) => {
  dispatch(sendInquiryRequest());
  const processAlias = listing?.attributes?.publicData?.transactionProcessAlias;
  if (!processAlias) {
    const error = new Error('No transaction process attached to listing');
    log.error(error, 'listing-process-missing', {
      listingId: listing?.id?.uuid,
    });
    dispatch(sendInquiryError(storableError(error)));
    return Promise.reject(error);
  }

  const listingId = listing?.id;
  const [processName, alias] = processAlias.split('/');
  const transitions = getProcess(processName)?.transitions;

  const bodyParams = {
    transition: transitions.INQUIRE,
    processAlias,
    params: { listingId },
  };
  return sdk.transactions
    .initiate(bodyParams)
    .then(response => {
      const transactionId = response.data.data.id;

      // Send the message to the created transaction
      return sdk.messages.send({ transactionId, content: message }).then(() => {
        dispatch(sendInquirySuccess());
        dispatch(fetchCurrentUserHasOrdersSuccess(true));
        return transactionId;
      });
    })
    .catch(e => {
      dispatch(sendInquiryError(storableError(e)));
      throw e;
    });
};

// Helper function for loadData call.
const fetchMonthlyTimeSlots = (dispatch, listing) => {
  const hasWindow = typeof window !== 'undefined';
  const attributes = listing.attributes;
  // Listing could be ownListing entity too, so we just check if attributes key exists
  const hasTimeZone =
    attributes && attributes.availabilityPlan && attributes.availabilityPlan.timezone;

  // Fetch time-zones on client side only.
  if (hasWindow && listing.id && hasTimeZone) {
    const tz = listing.attributes.availabilityPlan.timezone;
    const unitType = attributes?.publicData?.unitType;
    const timeUnit = unitType === 'hour' ? 'hour' : 'day';
    const nextBoundary = findNextBoundary(new Date(), timeUnit, tz);

    const nextMonth = getStartOf(nextBoundary, 'month', tz, 1, 'months');
    const nextAfterNextMonth = getStartOf(nextMonth, 'month', tz, 1, 'months');

    return Promise.all([
      dispatch(fetchTimeSlots(listing.id, nextBoundary, nextMonth, tz)),
      dispatch(fetchTimeSlots(listing.id, nextMonth, nextAfterNextMonth, tz)),
    ]);
  }

  // By default return an empty array
  return Promise.all([]);
};

export const fetchTransactionLineItems = ({ orderData, listingId, isOwnListing }) => dispatch => {
  dispatch(fetchLineItemsRequest());
  transactionLineItems({ orderData, listingId, isOwnListing })
    .then(response => {
      const lineItems = response.data;
      dispatch(fetchLineItemsSuccess(lineItems));
    })
    .catch(e => {
      dispatch(fetchLineItemsError(storableError(e)));
      log.error(e, 'fetching-line-items-failed', {
        listingId: listingId.uuid,
        orderData,
      });
    });
};

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
const updateStockOfListingMaybe = (listingId, newTotal, dispatch) => {
  if (listingId && newTotal) {
    return dispatch(compareAndSetStock(listingId, null, newTotal));
  }
  return Promise.resolve();
};

export const createSellerListing = (createParams, queryParams) => (dispatch, getState, sdk) => {
  dispatch(initiateCreateSellerListing());

  return sdk.ownListings
    .create(createParams, queryParams)
    .then(response => {
      const listingId = response.data.data.id;
      dispatch(initiateCreateSellerSuccess());
      return updateStockOfListingMaybe(listingId, 1000, dispatch);
    })
    .catch(e => {
      dispatch(initiateCreateSellerError(storableError(e)));
      throw e;
    });
};

// Return the result as object id
const resultIds = data => {
  const listings = data.data;
  return listings
    .filter(l => !l.attributes.deleted && l.attributes.state === 'published')
    .map(l => l.id);
};

const merge = (state, payload) => {
  const { sdkResponse, sanitizeConfig } = payload;
  const apiResponse = sdkResponse.data;
  return {
    ...state,
    listingOfferEntities: updatedEntities({ ...state.entities }, apiResponse, sanitizeConfig),
  };
};

export const getListingsOffeListingById = (listingEntities, listingIds) => {
  const resources = listingIds.map(id => ({
    id,
    type: 'listing',
  }));
  const throwIfNotFound = false;
  return denormalisedEntities(listingEntities, resources, throwIfNotFound);
};

export const listingPageOffer = (config, id) => async dispatch => {
  dispatch({
    type: FETCH_LISTING_PAGE_REQUEST,
  });

  try {
    const listings = await getOfferListingbyListingId({
      pub_isOffer: true,
      pub_linkedListing: id,
    });
    if (listings) {
      const listArray = listings?.data?.data ?? null;
      const sdkResponse = listings?.data || null;
      const resultIdsItem = resultIds(listArray);

      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };
      dispatch(fetchListingPageSuccess(resultIdsItem));
      dispatch(addListingEntities(sdkResponse, sanitizeConfig));
    }
  } catch (err) {
    dispatch(fetchListingPageError(err));
  }
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const listingId = new UUID(params.id);
  const state = getState();
  const currentUser = state.user?.currentUser;
  const inquiryModalOpenForListingId =
    isUserAuthorized(currentUser) && hasPermissionToInitiateTransactions(currentUser)
      ? state.ListingPage.inquiryModalOpenForListingId
      : null;
  dispatch(listingPageOffer(config, params.id));
  // Clear old line-items
  dispatch(setInitialValues({ lineItems: null, inquiryModalOpenForListingId }));
  const ownListingVariants = [LISTING_PAGE_DRAFT_VARIANT, LISTING_PAGE_PENDING_APPROVAL_VARIANT];
  if (ownListingVariants.includes(params.variant)) {
    return dispatch(showListing(listingId, config, true));
  }

  // In private marketplace mode, this page won't fetch data if the user is unauthorized
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
  if (!canFetchData) {
    return Promise.resolve();
  }

  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const promises = hasNoViewingRights
    ? // If user has no viewing rights, only allow fetching their own listing without reviews
    [dispatch(showListing(listingId, config, true)),]
    : // For users with viewing rights, fetch the listing and the associated reviews
    [
      dispatch(showListing(listingId, config)),
      dispatch(fetchReviews(listingId)),
    ];

  return Promise.all(promises).then(response => {
    const listingResponse = response[0];
    const listing = listingResponse?.data?.data;
    const transactionProcessAlias = listing?.attributes?.publicData?.transactionProcessAlias || '';
    if (isBookingProcessAlias(transactionProcessAlias) && !hasNoViewingRights) {
      // Fetch timeSlots if the user has viewing rights.
      // This can happen parallel to loadData.
      // We are not interested to return them from loadData call.
      fetchMonthlyTimeSlots(dispatch, listing);
    }
    return response;
  });
};
