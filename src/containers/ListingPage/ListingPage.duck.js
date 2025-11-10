import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { transactionLineItems } from '../../util/api';
import * as log from '../../util/log';
import { denormalisedResponseEntities } from '../../util/data';
import {
  bookingTimeUnits,
  findNextBoundary,
  getStartOf,
  monthIdString,
  stringifyDateToISO8601,
} from '../../util/dates';
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
import { fetchCurrentUser, setCurrentUserHasOrders } from '../../ducks/user.duck';

const { UUID } = sdkTypes;
const MINUTE_IN_MS = 1000 * 60;

// Day-based time slots queries are cached for 1 minute.
const removeOutdatedDateData = timeSlotsForDate => {
  const now = new Date().getTime();
  const minuteAgo = now - MINUTE_IN_MS;
  return Object.fromEntries(
    Object.entries(timeSlotsForDate).filter(([dateId, data]) => {
      return data.fetchedAt && data.fetchedAt > minuteAgo;
    })
  );
};

// ================ Async Thunks ================ //

//////////////////
// Show Listing //
//////////////////
const showListingPayloadCreator = ({ listingId, config, isOwn = false }, thunkAPI) => {
  const { dispatch, rejectWithValue, extra: sdk } = thunkAPI;
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

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
      return rejectWithValue(storableError(e));
    });
};

export const showListingThunk = createAsyncThunk(
  'ListingPage/showListing',
  showListingPayloadCreator
);
// Backward compatible wrapper for the thunk
export const showListing = (listingId, config, isOwn = false) => (dispatch, getState, sdk) => {
  return dispatch(showListingThunk({ listingId, config, isOwn })).unwrap();
};

///////////////////
// Fetch Reviews //
///////////////////
export const fetchReviewsThunk = createAsyncThunk(
  'ListingPage/fetchReviews',
  ({ listingId }, { rejectWithValue, extra: sdk }) => {
    return sdk.reviews
      .query({
        listing_id: listingId,
        state: 'public',
        include: ['author', 'author.profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
      })
      .then(response => {
        return denormalisedResponseEntities(response);
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

export const fetchReviews = listingId => (dispatch, getState, sdk) => {
  return dispatch(fetchReviewsThunk({ listingId })).unwrap();
};

//////////////////////
// Fetch Time Slots //
//////////////////////

const timeSlotsRequest = createAsyncThunk(
  'ListingPage/timeSlotsRequest',
  (params, { extra: sdk }) => {
    return sdk.timeslots.query(params).then(response => {
      return denormalisedResponseEntities(response);
    });
  }
);

const fetchTimeSlotsPayloadCreator = ({ listingId, start, end, timeZone, options }, thunkAPI) => {
  const { dispatch, getState } = thunkAPI;
  const { extraQueryParams = null, useFetchTimeSlotsForDate = false } = options || {};

  // The maximum pagination page size for timeSlots is 500
  const extraParams = extraQueryParams || {
    perPage: 500,
    page: 1,
  };

  // For small time units, we fetch the data per date.
  // This is to avoid fetching too much data (with 15 minute intervals, there can be 24*4*31 = 2928 time slots)
  if (useFetchTimeSlotsForDate) {
    const dateId = stringifyDateToISO8601(start, timeZone);
    const dateData = getState().ListingPage.timeSlotsForDate[dateId];
    const minuteAgo = new Date().getTime() - MINUTE_IN_MS;
    const hasRecentlyFetchedData = dateData?.fetchedAt > minuteAgo;
    if (hasRecentlyFetchedData) {
      return Promise.resolve(dateData?.timeSlots || []);
    }

    return dispatch(timeSlotsRequest({ listingId, start, end, ...extraParams }))
      .then(response => {
        return response.payload;
      })
      .catch(e => {
        return [];
      });
  } else {
    return dispatch(timeSlotsRequest({ listingId, start, end, ...extraParams }))
      .then(response => {
        return response.payload;
      })
      .catch(e => {
        return [];
      });
  }
};

export const fetchTimeSlotsThunk = createAsyncThunk(
  'ListingPage/fetchTimeSlots',
  fetchTimeSlotsPayloadCreator
);
// Backward compatible wrapper for the thunk
export const fetchTimeSlots = (listingId, start, end, timeZone, options) => (
  dispatch,
  getState,
  sdk
) => {
  return dispatch(fetchTimeSlotsThunk({ listingId, start, end, timeZone, options })).unwrap();
};

//////////////////
// Send Inquiry //
//////////////////
const sendInquiryPayloadCreator = (
  { listing, message },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const processAlias = listing?.attributes?.publicData?.transactionProcessAlias;
  if (!processAlias) {
    const error = new Error('No transaction process attached to listing');
    log.error(error, 'listing-process-missing', {
      listingId: listing?.id?.uuid,
    });
    return rejectWithValue(storableError(error));
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
        dispatch(setCurrentUserHasOrders());
        return transactionId;
      });
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const sendInquiryThunk = createAsyncThunk(
  'ListingPage/sendInquiry',
  sendInquiryPayloadCreator
);
// Backward compatible wrapper for the thunk
export const sendInquiry = (listing, message) => (dispatch, getState, sdk) => {
  return dispatch(sendInquiryThunk({ listing, message })).unwrap();
};

// Helper function for loadData call.
// Note: listing could be ownListing entity too
const fetchMonthlyTimeSlots = (dispatch, listing) => {
  const hasWindow = typeof window !== 'undefined';
  const { availabilityPlan, publicData } = listing?.attributes || {};
  const tz = availabilityPlan?.timezone;

  // Fetch time-zones on client side only.
  if (hasWindow && listing.id && !!tz) {
    const { unitType, priceVariants, startTimeInterval } = publicData || {};
    const now = new Date();
    const startOfToday = getStartOf(now, 'day', tz);
    const isFixed = unitType === 'fixed';

    const timeUnit = startTimeInterval
      ? bookingTimeUnits[startTimeInterval]?.timeUnit
      : unitType === 'hour'
      ? 'hour'
      : 'day';
    const nextBoundary = findNextBoundary(now, 1, timeUnit, tz);

    const nextMonth = getStartOf(nextBoundary, 'month', tz, 1, 'months');
    const nextAfterNextMonth = getStartOf(nextMonth, 'month', tz, 1, 'months');

    const variants = priceVariants || [];
    const bookingLengthInMinutes = variants.reduce((min, priceVariant) => {
      return Math.min(min, priceVariant.bookingLengthInMinutes);
    }, Number.MAX_SAFE_INTEGER);

    const nextMonthEnd = isFixed
      ? getStartOf(nextMonth, 'minute', tz, bookingLengthInMinutes, 'minutes')
      : nextMonth;
    const followingMonthEnd = isFixed
      ? getStartOf(nextAfterNextMonth, 'minute', tz, bookingLengthInMinutes, 'minutes')
      : nextAfterNextMonth;

    const minDurationStartingInInterval = isFixed ? bookingLengthInMinutes : 60;

    const options = intervalAlign => {
      return ['fixed', 'hour'].includes(unitType)
        ? {
            extraQueryParams: {
              intervalDuration: 'P1D',
              intervalAlign,
              maxPerInterval: 1,
              minDurationStartingInInterval,
              perPage: 31,
              page: 1,
            },
          }
        : null;
    };

    return Promise.all([
      dispatch(fetchTimeSlots(listing.id, nextBoundary, nextMonthEnd, tz, options(startOfToday))),
      dispatch(fetchTimeSlots(listing.id, nextMonth, followingMonthEnd, tz, options(nextMonth))),
    ]);
  }

  // By default return an empty array
  return Promise.all([]);
};

//////////////////////////////////
// Fetch Transaction Line Items //
//////////////////////////////////
const fetchTransactionLineItemsPayloadCreator = (
  { orderData, listingId, isOwnListing },
  { rejectWithValue }
) => {
  return transactionLineItems({ orderData, listingId, isOwnListing })
    .then(response => {
      return response.data;
    })
    .catch(e => {
      log.error(e, 'fetching-line-items-failed', {
        listingId: listingId.uuid,
        orderData,
        statusText: e.statusText,
      });
      return rejectWithValue(storableError(e));
    });
};

export const fetchTransactionLineItemsThunk = createAsyncThunk(
  'ListingPage/fetchTransactionLineItems',
  fetchTransactionLineItemsPayloadCreator
);
// Backward compatible wrapper for the thunk
export const fetchTransactionLineItems = ({ orderData, listingId, isOwnListing }) => dispatch => {
  return dispatch(fetchTransactionLineItemsThunk({ orderData, listingId, isOwnListing })).unwrap();
};

// ================ Slice ================ //

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
  timeSlotsForDate: {
    // For small time units, we fetch monthly time slots with sparse mode for calendar view
    // and when the user clicks on a day, we make a full time slot query. This is for that purpose.
    // '2025-02-03': {
    //   timeSlots: [],
    //   fetchedAt: 1738569600000,
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

const listingPageSlice = createSlice({
  name: 'ListingPage',
  initialState,
  reducers: {
    setInitialValues: (state, action) => {
      return { ...initialState, ...action.payload };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(showListingThunk.pending, (state, action) => {
        state.id = action.meta.arg.listingId;
        state.showListingError = null;
      })
      .addCase(showListingThunk.fulfilled, (state, action) => {
        // Data is handled by addMarketplaceEntities in the thunk
      })
      .addCase(showListingThunk.rejected, (state, action) => {
        state.showListingError = action.payload;
      })
      .addCase(fetchReviewsThunk.pending, state => {
        state.fetchReviewsError = null;
      })
      .addCase(fetchReviewsThunk.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(fetchReviewsThunk.rejected, (state, action) => {
        state.fetchReviewsError = action.payload;
      })
      .addCase(fetchTimeSlotsThunk.pending, (state, action) => {
        const { options, start, timeZone } = action.meta.arg;
        const { useFetchTimeSlotsForDate = false } = options || {};

        if (useFetchTimeSlotsForDate) {
          const dateId = stringifyDateToISO8601(start, timeZone);
          state.timeSlotsForDate = removeOutdatedDateData(state.timeSlotsForDate);
          if (!state.timeSlotsForDate[dateId]) {
            state.timeSlotsForDate[dateId] = {};
          }
          state.timeSlotsForDate[dateId].fetchTimeSlotsError = null;
          state.timeSlotsForDate[dateId].fetchedAt = null;
          state.timeSlotsForDate[dateId].fetchTimeSlotsInProgress = true;
          state.timeSlotsForDate[dateId].timeSlots = [];
        } else {
          const monthId = monthIdString(start, timeZone);
          if (!state.monthlyTimeSlots[monthId]) {
            state.monthlyTimeSlots[monthId] = {};
          }
          state.monthlyTimeSlots[monthId].fetchTimeSlotsError = null;
          state.monthlyTimeSlots[monthId].fetchTimeSlotsInProgress = true;
        }
      })
      .addCase(fetchTimeSlotsThunk.fulfilled, (state, action) => {
        const { options, start, timeZone } = action.meta.arg;
        const { useFetchTimeSlotsForDate = false } = options || {};

        if (useFetchTimeSlotsForDate) {
          const dateId = stringifyDateToISO8601(start, timeZone);
          if (!state.timeSlotsForDate[dateId]) {
            state.timeSlotsForDate[dateId] = {};
          }
          state.timeSlotsForDate[dateId].fetchTimeSlotsInProgress = false;
          state.timeSlotsForDate[dateId].fetchedAt = new Date().getTime();
          state.timeSlotsForDate[dateId].timeSlots = action.payload;
        } else {
          const monthId = monthIdString(start, timeZone);
          if (!state.monthlyTimeSlots[monthId]) {
            state.monthlyTimeSlots[monthId] = {};
          }
          state.monthlyTimeSlots[monthId].fetchTimeSlotsInProgress = false;
          state.monthlyTimeSlots[monthId].timeSlots = action.payload;
        }
      })
      .addCase(fetchTimeSlotsThunk.rejected, (state, action) => {
        const { options, start, timeZone } = action.meta.arg;
        const { useFetchTimeSlotsForDate = false } = options || {};

        if (useFetchTimeSlotsForDate) {
          const dateId = stringifyDateToISO8601(start, timeZone);
          if (!state.timeSlotsForDate[dateId]) {
            state.timeSlotsForDate[dateId] = {};
          }
          state.timeSlotsForDate[dateId].fetchTimeSlotsInProgress = false;
          state.timeSlotsForDate[dateId].fetchTimeSlotsError = action.payload;
        } else {
          const monthId = monthIdString(start, timeZone);
          if (!state.monthlyTimeSlots[monthId]) {
            state.monthlyTimeSlots[monthId] = {};
          }
          state.monthlyTimeSlots[monthId].fetchTimeSlotsInProgress = false;
          state.monthlyTimeSlots[monthId].fetchTimeSlotsError = action.payload;
        }
      })
      .addCase(sendInquiryThunk.pending, state => {
        state.sendInquiryInProgress = true;
        state.sendInquiryError = null;
      })
      .addCase(sendInquiryThunk.fulfilled, state => {
        state.sendInquiryInProgress = false;
        state.inquiryModalOpenForListingId = null;
      })
      .addCase(sendInquiryThunk.rejected, (state, action) => {
        state.sendInquiryInProgress = false;
        state.sendInquiryError = action.payload;
      })
      .addCase(fetchTransactionLineItemsThunk.pending, state => {
        state.fetchLineItemsInProgress = true;
        state.fetchLineItemsError = null;
      })
      .addCase(fetchTransactionLineItemsThunk.fulfilled, (state, action) => {
        state.fetchLineItemsInProgress = false;
        state.lineItems = action.payload;
      })
      .addCase(fetchTransactionLineItemsThunk.rejected, (state, action) => {
        state.fetchLineItemsInProgress = false;
        state.fetchLineItemsError = action.payload;
      });
  },
});

export const { setInitialValues } = listingPageSlice.actions;

export default listingPageSlice.reducer;

// ================ Load data ================ //

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
