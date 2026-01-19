import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { isEmpty, pickBy } from '../../util/common';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import {
  bookingTimeUnits,
  findNextBoundary,
  getStartOf,
  monthIdString,
  stringifyDateToISO8601,
} from '../../util/dates';
import { isTransactionsTransitionInvalidTransition, storableError } from '../../util/errors';
import { transactionLineItems, transitionPrivileged } from '../../util/api';
import * as log from '../../util/log';
import {
  updatedEntities,
  denormalisedEntities,
  denormalisedResponseEntities,
} from '../../util/data';
import {
  resolveLatestProcessName,
  getProcess,
  isBookingProcess,
  isNegotiationProcess,
} from '../../transactions/transaction';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUserNotifications } from '../../ducks/user.duck';

const { UUID } = sdkTypes;

const MESSAGES_PAGE_SIZE = 100;
const REVIEW_TX_INCLUDES = ['reviews', 'reviews.author', 'reviews.subject'];
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

// Helper to fetch correct image variants for different thunk calls
const getImageVariants = listingImageConfig => {
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImageConfig;
  const aspectRatio = aspectHeight / aspectWidth;
  return {
    'fields.image': [
      // Profile images
      'variants.square-small',
      'variants.square-small2x',

      // Listing images:
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
  };
};

const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));
const refreshTx = (sdk, txId) => sdk.transactions.show({ id: txId }, { expand: true });
const refreshTransactionEntity = (sdk, txId, dispatch) => {
  delay(3000)
    .then(() => refreshTx(sdk, txId))
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      const lastTransition = response?.data?.data?.attributes?.lastTransition;
      // We'll make another attempt if mark-received-from-purchased from default-purchase process is still the latest.
      if (lastTransition === 'transition/mark-received-from-purchased') {
        return delay(8000)
          .then(() => refreshTx(sdk, txId))
          .then(response => {
            dispatch(addMarketplaceEntities(response));
          });
      }
    })
    .catch(e => {
      // refresh failed, but we don't act upon it.
      console.log('error', e);
    });
};

// ================ Async Thunks ================ //

////////////////////
// fetchTimeSlots //
////////////////////
const fetchTimeSlotsPayloadCreator = (
  { listingId, start, end, timeZone, options },
  { rejectWithValue, extra: sdk, getState }
) => {
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
    const dateData = getState().TransactionPage.timeSlotsForDate[dateId];
    const minuteAgo = new Date().getTime() - MINUTE_IN_MS;
    const hasRecentlyFetchedData = dateData?.fetchedAt > minuteAgo;
    if (hasRecentlyFetchedData) {
      return Promise.resolve({ timeSlots: dateData?.timeSlots || [], dateId, type: 'date' });
    }

    return sdk.timeslots
      .query({ listingId, start, end, ...extraParams })
      .then(response => {
        const timeSlots = denormalisedResponseEntities(response);
        return { timeSlots, dateId, type: 'date' };
      })
      .catch(e => {
        return rejectWithValue({ error: storableError(e), dateId, type: 'date' });
      });
  } else {
    const monthId = monthIdString(start, timeZone);
    return sdk.timeslots
      .query({ listingId, start, end, ...extraParams })
      .then(response => {
        const timeSlots = denormalisedResponseEntities(response);
        return { timeSlots, monthId, type: 'month' };
      })
      .catch(e => {
        return rejectWithValue({ error: storableError(e), monthId, type: 'month' });
      });
  }
};

export const fetchTimeSlotsThunk = createAsyncThunk(
  'TransactionPage/fetchTimeSlots',
  fetchTimeSlotsPayloadCreator
);

// Backward compatible wrapper for fetchTimeSlots
export const fetchTimeSlots = (listingId, start, end, timeZone, options) => dispatch => {
  return dispatch(fetchTimeSlotsThunk({ listingId, start, end, timeZone, options }));
};

//////////////////////
// fetchTransaction //
//////////////////////

// Helper function for loadData call.
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
      dispatch(
        fetchTimeSlotsThunk({
          listingId: listing.id,
          start: nextBoundary,
          end: nextMonthEnd,
          timeZone: tz,
          options: options(startOfToday),
        })
      ),
      dispatch(
        fetchTimeSlotsThunk({
          listingId: listing.id,
          start: nextMonth,
          end: followingMonthEnd,
          timeZone: tz,
          options: options(nextMonth),
        })
      ),
    ]);
  }

  // By default return an empty array
  return Promise.all([]);
};

// fetchTransaction
const fetchTransactionPayloadCreator = (
  { id, txRole, config },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const listingRelationship = txResponse => {
    return txResponse.data.data.relationships.listing.data;
  };

  return sdk.transactions
    .show(
      {
        id,
        include: [
          'customer',
          'customer.profileImage',
          'provider',
          'provider.profileImage',
          'listing',
          'listing.currentStock',
          'listing.images',
          'listing.author',
          'listing.author.profileImage',
          'booking',
          'reviews',
          'reviews.author',
          'reviews.subject',
        ],
        ...getImageVariants(config.layout.listingImage),
      },
      { expand: true }
    )
    .then(response => {
      const listingId = listingRelationship(response).id;
      const entities = updatedEntities({}, response.data);
      const listingRef = { id: listingId, type: 'listing' };
      const transactionRef = { id, type: 'transaction' };
      const denormalised = denormalisedEntities(entities, [listingRef, transactionRef]);
      const listing = denormalised[0];
      const transaction = denormalised[1];
      const processName = resolveLatestProcessName(transaction.attributes.processName);

      try {
        const process = getProcess(processName);
        const isInquiry = process.getState(transaction) === process.states.INQUIRY;

        // Fetch time slots for transactions that are in inquired state
        const canFetchTimeslots =
          txRole === 'customer' && isBookingProcess(processName) && isInquiry;

        if (canFetchTimeslots) {
          fetchMonthlyTimeSlots(dispatch, listing);
        }
      } catch (error) {
        console.log(`transaction process (${processName}) was not recognized`);
      }

      return response;
    })
    .then(response => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };

      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      return response;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const fetchTransactionThunk = createAsyncThunk(
  'TransactionPage/fetchTransaction',
  fetchTransactionPayloadCreator
);

// Backward compatible wrapper for fetchTransaction
export const fetchTransaction = (id, txRole, config) => dispatch => {
  return dispatch(fetchTransactionThunk({ id, txRole, config }));
};

////////////////////
// makeTransition //
////////////////////
const makeTransitionPayloadCreator = (
  { txId, transitionName, params },
  { dispatch, rejectWithValue, extra: sdk, getState }
) => {
  const transaction = getState()?.marketplaceData?.entities?.transaction?.[txId?.uuid];
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  const process = getProcess(processName);

  // This calls the client app's server to make a privileged transition.
  const privilegedTransition = () =>
    transitionPrivileged({
      isSpeculative: false,
      orderData: params?.orderData || {},
      bodyParams: {
        id: txId,
        transition: transitionName,
        params: {}, // NOTE: lineItems and metadata are included on the server-side.
      },
      queryParams: {
        expand: true,
      },
    });
  const normalTransition = () =>
    sdk.transactions.transition({ id: txId, transition: transitionName, params }, { expand: true });
  // Negotiation process / accept update: check if payin total has changed
  const acceptUpdateTransition = () =>
    sdk.transactions.show({ id: txId }, { expand: true }).then(response => {
      const updatedTransaction = response.data.data;
      const newPayinTotal = updatedTransaction.attributes.payinTotal.amount;
      const oldPayinTotal = transaction.attributes.payinTotal.amount;

      if (newPayinTotal !== oldPayinTotal) {
        dispatch(addMarketplaceEntities(response));
        throw new Error('Payin total has changed');
      }
      return sdk.transactions.transition(
        { id: txId, transition: transitionName, params },
        { expand: true }
      );
    });

  const makeCall = process?.isPrivileged(transitionName)
    ? privilegedTransition
    : isNegotiationProcess(processName) && transitionName === process.transitions.ACCEPT_UPDATE
    ? acceptUpdateTransition
    : normalTransition;

  return makeCall()
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchCurrentUserNotifications());

      // There could be automatic transitions after this transition
      // For example mark-received-from-purchased > auto-complete.
      // Here, we make 1-2 delayed updates for the tx entity.
      // This way "leave a review" link should show up for the customer.
      refreshTransactionEntity(sdk, txId, dispatch);

      return response;
    })
    .catch(e => {
      if (e.message !== 'Payin total has changed') {
        log.error(e, `${transitionName}-failed`, {
          txId,
          transition: transitionName,
        });
      }
      return rejectWithValue(storableError(e));
    });
};

export const makeTransitionThunk = createAsyncThunk(
  'TransactionPage/makeTransition',
  makeTransitionPayloadCreator,
  {
    condition: ({ txId, transitionName, params }, { getState }) => {
      const state = getState();
      if (state.TransactionPage.transitionInProgress) {
        return false; // Don't execute the thunk if transition is already in progress
      }
      return true; // Execute the thunk
    },
  }
);

// Backward compatible wrapper for makeTransition
export const makeTransition = (txId, transitionName, params) => dispatch => {
  return dispatch(makeTransitionThunk({ txId, transitionName, params }));
};

////////////////////
// Fetch Messages //
////////////////////
const fetchMessagesPayloadCreator = (
  { txId, page, config },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const paging = { page, perPage: MESSAGES_PAGE_SIZE };

  return sdk.messages
    .query({
      transaction_id: txId,
      include: ['sender', 'sender.profileImage'],
      ...getImageVariants(config.layout.listingImage),
      ...paging,
    })
    .then(response => {
      const messages = denormalisedResponseEntities(response);
      const { totalItems, totalPages, page: fetchedPage } = response.data.meta;
      const pagination = { totalItems, totalPages, page: fetchedPage };

      // Check if totalItems has changed between fetched pagination pages
      // if totalItems has changed, fetch first page again to include new incoming messages.
      // TODO if there're more than 100 incoming messages,
      // this should loop through most recent pages instead of fetching just the first one.
      if (totalItems > 0 && page > 1) {
        // Background update for new incoming messages
        dispatch(fetchMessagesThunk({ txId, page: 1, config })).catch(() => {
          // Background update, no need to to do anything atm.
        });
      }

      return { messages, pagination };
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const fetchMessagesThunk = createAsyncThunk(
  'TransactionPage/fetchMessages',
  fetchMessagesPayloadCreator
);

// Backward compatible wrapper for fetchMessages
export const fetchMessages = (txId, page, config) => dispatch => {
  return dispatch(fetchMessagesThunk({ txId, page, config }));
};

export const fetchMoreMessages = (txId, config) => (dispatch, getState, sdk) => {
  const state = getState();
  const { oldestMessagePageFetched, totalMessagePages } = state.TransactionPage;
  const hasMoreOldMessages = totalMessagePages > oldestMessagePageFetched;

  // In case there're no more old pages left we default to fetching the current cursor position
  const nextPage = hasMoreOldMessages ? oldestMessagePageFetched + 1 : oldestMessagePageFetched;

  return dispatch(fetchMessagesThunk({ txId, page: nextPage, config }));
};

/////////////////
// sendMessage //
/////////////////
const sendMessagePayloadCreator = (
  { txId, message, config },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  return sdk.messages
    .send({ transactionId: txId, content: message })
    .then(response => {
      const messageId = response.data.data.id;

      // We fetch the first page again to add sent message to the page data
      // and update possible incoming messages too.
      return dispatch(fetchMessagesThunk({ txId, page: 1, config }))
        .then(() => messageId)
        .catch(() => messageId);
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const sendMessageThunk = createAsyncThunk(
  'TransactionPage/sendMessage',
  sendMessagePayloadCreator
);

// Backward compatible wrapper for sendMessage
export const sendMessage = (txId, message, config) => dispatch => {
  return dispatch(sendMessageThunk({ txId, message, config }));
};

////////////////
// sendReview //
////////////////
const sendReviewPayloadCreator = (
  { tx, transitionOptionsInfo, params, config },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const { reviewAsFirst, reviewAsSecond, hasOtherPartyReviewedFirst } = transitionOptionsInfo;
  const include = REVIEW_TX_INCLUDES;

  const sendReviewAsSecond = () => {
    return sdk.transactions
      .transition(
        { id: tx?.id, transition: reviewAsSecond, params },
        { expand: true, include, ...getImageVariants(config.layout.listingImage) }
      )
      .then(response => {
        dispatch(addMarketplaceEntities(response));
        return response;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  };

  const sendReviewAsFirst = () => {
    return sdk.transactions
      .transition(
        { id: tx?.id, transition: reviewAsFirst, params },
        { expand: true, include, ...getImageVariants(config.layout.listingImage) }
      )
      .then(response => {
        dispatch(addMarketplaceEntities(response));
        return response;
      })
      .catch(e => {
        // If transaction transition is invalid, lets try another endpoint.
        if (isTransactionsTransitionInvalidTransition(e)) {
          return sendReviewAsSecond();
        } else {
          return rejectWithValue(storableError(e));
        }
      });
  };

  return hasOtherPartyReviewedFirst ? sendReviewAsSecond() : sendReviewAsFirst();
};

export const sendReviewThunk = createAsyncThunk(
  'TransactionPage/sendReview',
  sendReviewPayloadCreator
);

// Backward compatible wrapper for sendReview
export const sendReview = (tx, transitionOptionsInfo, params, config) => dispatch => {
  return dispatch(sendReviewThunk({ tx, transitionOptionsInfo, params, config }));
};

//////////////////////
// fetchTransitions //
//////////////////////
const fetchTransitionsPayloadCreator = ({ id }, { rejectWithValue, extra: sdk }) => {
  return sdk.processTransitions
    .query({ transactionId: id })
    .then(res => res.data.data)
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const fetchTransitionsThunk = createAsyncThunk(
  'TransactionPage/fetchTransitions',
  fetchTransitionsPayloadCreator
);

// Backward compatible wrapper for fetchTransitions
export const fetchNextTransitions = id => dispatch => {
  return dispatch(fetchTransitionsThunk({ id }));
};

////////////////////
// FetchLineItems //
////////////////////
const fetchLineItemsPayloadCreator = (
  { orderData, listingId, isOwnListing },
  { rejectWithValue }
) => {
  return transactionLineItems({ orderData, listingId, isOwnListing })
    .then(response => response.data)
    .catch(e => {
      log.error(e, 'fetching-line-items-failed', {
        listingId: listingId.uuid,
        orderData,
        statusText: e.statusText,
      });
      return rejectWithValue(storableError(e));
    });
};

export const fetchLineItemsThunk = createAsyncThunk(
  'TransactionPage/fetchLineItems',
  fetchLineItemsPayloadCreator
);

// Backward compatible wrapper for fetchLineItems
export const fetchTransactionLineItems = ({ orderData, listingId, isOwnListing }) => dispatch => {
  return dispatch(fetchLineItemsThunk({ orderData, listingId, isOwnListing }));
};

// ================ Slice ================ //

const initialState = {
  fetchTransactionInProgress: false,
  fetchTransactionError: null,
  transactionRef: null,
  transitionInProgress: null,
  transitionError: null,
  fetchMessagesInProgress: false,
  fetchMessagesError: null,
  totalMessages: 0,
  totalMessagePages: 0,
  oldestMessagePageFetched: 0,
  messages: [],
  savePaymentMethodFailed: false,
  sendMessageInProgress: false,
  sendMessageError: null,
  sendReviewInProgress: false,
  sendReviewError: null,
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
  fetchTransitionsInProgress: false,
  fetchTransitionsError: null,
  processTransitions: null,
  lineItems: null,
  fetchLineItemsInProgress: false,
  fetchLineItemsError: null,
};

// Merge entity arrays using ids, so that conflicting items in newer array (b) overwrite old values (a).
// const a = [{ id: { uuid: 1 } }, { id: { uuid: 3 } }];
// const b = [{ id: : { uuid: 2 } }, { id: : { uuid: 1 } }];
// mergeEntityArrays(a, b)
// => [{ id: { uuid: 3 } }, { id: : { uuid: 2 } }, { id: : { uuid: 1 } }]
const mergeEntityArrays = (a, b) => {
  return a.filter(aEntity => !b.find(bEntity => aEntity.id.uuid === bEntity.id.uuid)).concat(b);
};

const transactionPageSlice = createSlice({
  name: 'TransactionPage',
  initialState,
  reducers: {
    setInitialValues: (state, action) => {
      return { ...initialState, ...action.payload };
    },
  },
  extraReducers: builder => {
    builder
      // fetchTransaction cases
      .addCase(fetchTransactionThunk.pending, state => {
        state.fetchTransactionInProgress = true;
        state.fetchTransactionError = null;
      })
      .addCase(fetchTransactionThunk.fulfilled, (state, action) => {
        state.fetchTransactionInProgress = false;
        state.transactionRef = { id: action.payload.data.data.id, type: 'transaction' };
      })
      .addCase(fetchTransactionThunk.rejected, (state, action) => {
        state.fetchTransactionInProgress = false;
        state.fetchTransactionError = action.payload;
      })
      // fetchTransitions cases
      .addCase(fetchTransitionsThunk.pending, state => {
        state.fetchTransitionsInProgress = true;
        state.fetchTransitionsError = null;
      })
      .addCase(fetchTransitionsThunk.fulfilled, (state, action) => {
        state.fetchTransitionsInProgress = false;
        state.processTransitions = action.payload;
      })
      .addCase(fetchTransitionsThunk.rejected, (state, action) => {
        state.fetchTransitionsInProgress = false;
        state.fetchTransitionsError = action.payload;
      })
      // makeTransition cases
      .addCase(makeTransitionThunk.pending, (state, action) => {
        state.transitionInProgress = action.meta.arg.transitionName;
        state.transitionError = null;
      })
      .addCase(makeTransitionThunk.fulfilled, state => {
        state.transitionInProgress = null;
      })
      .addCase(makeTransitionThunk.rejected, (state, action) => {
        state.transitionInProgress = null;
        state.transitionError = action.payload;
      })
      // fetchMessages cases
      .addCase(fetchMessagesThunk.pending, state => {
        state.fetchMessagesInProgress = true;
        state.fetchMessagesError = null;
      })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        const { messages, pagination } = action.payload;
        const oldestMessagePageFetched =
          state.oldestMessagePageFetched > pagination.page
            ? state.oldestMessagePageFetched
            : pagination.page;

        state.fetchMessagesInProgress = false;
        state.messages = mergeEntityArrays(state.messages, messages);
        state.totalMessages = pagination.totalItems;
        state.totalMessagePages = pagination.totalPages;
        state.oldestMessagePageFetched = oldestMessagePageFetched;
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.fetchMessagesInProgress = false;
        state.fetchMessagesError = action.payload;
      })
      // sendMessage cases
      .addCase(sendMessageThunk.pending, state => {
        state.sendMessageInProgress = true;
        state.sendMessageError = null;
      })
      .addCase(sendMessageThunk.fulfilled, state => {
        state.sendMessageInProgress = false;
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.sendMessageInProgress = false;
        state.sendMessageError = action.payload;
      })
      // sendReview cases
      .addCase(sendReviewThunk.pending, state => {
        state.sendReviewInProgress = true;
        state.sendReviewError = null;
      })
      .addCase(sendReviewThunk.fulfilled, state => {
        state.sendReviewInProgress = false;
      })
      .addCase(sendReviewThunk.rejected, (state, action) => {
        state.sendReviewInProgress = false;
        state.sendReviewError = action.payload;
      })
      // fetchLineItems cases
      .addCase(fetchLineItemsThunk.pending, state => {
        state.fetchLineItemsInProgress = true;
        state.fetchLineItemsError = null;
      })
      .addCase(fetchLineItemsThunk.fulfilled, (state, action) => {
        state.fetchLineItemsInProgress = false;
        state.lineItems = action.payload;
      })
      .addCase(fetchLineItemsThunk.rejected, (state, action) => {
        state.fetchLineItemsInProgress = false;
        state.fetchLineItemsError = action.payload;
      })
      // fetchTimeSlots cases
      .addCase(fetchTimeSlotsThunk.pending, (state, action) => {
        const { timeZone, options } = action.meta.arg;
        const { useFetchTimeSlotsForDate = false } = options || {};

        if (useFetchTimeSlotsForDate) {
          const dateId = stringifyDateToISO8601(action.meta.arg.start, timeZone);
          state.timeSlotsForDate = {
            ...removeOutdatedDateData(state.timeSlotsForDate),
            [dateId]: {
              ...state.timeSlotsForDate[dateId],
              fetchTimeSlotsError: null,
              fetchedAt: null,
              fetchTimeSlotsInProgress: true,
              timeSlots: [],
            },
          };
        } else {
          const monthId = monthIdString(action.meta.arg.start, timeZone);
          state.monthlyTimeSlots[monthId] = {
            ...state.monthlyTimeSlots[monthId],
            fetchTimeSlotsError: null,
            fetchTimeSlotsInProgress: true,
          };
        }
      })
      .addCase(fetchTimeSlotsThunk.fulfilled, (state, action) => {
        const { timeSlots, dateId, monthId, type } = action.payload;

        if (type === 'date') {
          state.timeSlotsForDate[dateId] = {
            ...state.timeSlotsForDate[dateId],
            fetchTimeSlotsInProgress: false,
            fetchedAt: new Date().getTime(),
            timeSlots,
          };
        } else if (type === 'month') {
          state.monthlyTimeSlots[monthId] = {
            ...state.monthlyTimeSlots[monthId],
            fetchTimeSlotsInProgress: false,
            timeSlots,
          };
        }
      })
      .addCase(fetchTimeSlotsThunk.rejected, (state, action) => {
        const { error, dateId, monthId, type } = action.payload;

        if (type === 'date') {
          state.timeSlotsForDate[dateId] = {
            ...state.timeSlotsForDate[dateId],
            fetchTimeSlotsInProgress: false,
            fetchTimeSlotsError: error,
          };
        } else if (type === 'month') {
          state.monthlyTimeSlots[monthId] = {
            ...state.monthlyTimeSlots[monthId],
            fetchTimeSlotsInProgress: false,
            fetchTimeSlotsError: error,
          };
        }
      });
  },
});

export const { setInitialValues } = transactionPageSlice.actions;

export default transactionPageSlice.reducer;

// ================ Load data ================ //

const isNonEmpty = value => {
  return typeof value === 'object' || Array.isArray(value) ? !isEmpty(value) : !!value;
};

// loadData is a collection of async calls that need to be made
// before page has all the info it needs to render itself
export const loadData = (params, search, config) => (dispatch, getState) => {
  const txId = new UUID(params.id);
  const state = getState().TransactionPage;
  const txRef = state.transactionRef;
  const txRole = params.transactionRole;

  // In case a transaction reference is found from a previous
  // data load -> clear the state. Otherwise keep the non-null
  // and non-empty values which may have been set from a previous page.
  const initialValues = txRef ? {} : pickBy(state, isNonEmpty);
  dispatch(setInitialValues(initialValues));

  // Sale / order (i.e. transaction entity in API)
  return Promise.all([
    dispatch(fetchTransactionThunk({ id: txId, txRole, config })),
    dispatch(fetchMessagesThunk({ txId, page: 1, config })),
    dispatch(fetchTransitionsThunk({ id: txId })),
  ]);
};
