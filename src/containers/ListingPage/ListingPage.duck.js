import pick from 'lodash/pick';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { transactionLineItems } from '../../util/api';
import * as log from '../../util/log';
import { denormalisedResponseEntities } from '../../util/data';
import { findNextBoundary, getStartOf, monthIdString } from '../../util/dates';
import {
  hasPermissionToInitiateTransactions,
  hasPermissionToViewData,
  isUserAuthorized,
} from '../../util/userHelpers';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import { getProcess, isBookingProcessAlias } from '../../transactions/transaction';
import { fetchCurrentUser, fetchCurrentUserHasOrdersSuccess } from '../../ducks/user.duck';

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

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const listingId = new UUID(params.id);
  const state = getState();
  const currentUser = state.user?.currentUser;
  const inquiryModalOpenForListingId =
    isUserAuthorized(currentUser) && hasPermissionToInitiateTransactions(currentUser)
      ? state.ListingPage.inquiryModalOpenForListingId
      : null;

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
      [dispatch(showListing(listingId, config, true))]
    : // For users with viewing rights, fetch the listing and the associated reviews
      [dispatch(showListing(listingId, config)), dispatch(fetchReviews(listingId))];

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
