import pick from 'lodash/pick';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { findNextBoundary, getStartOf, monthIdString } from '../../util/dates';
import { isTransactionsTransitionInvalidTransition, storableError } from '../../util/errors';
import { transactionLineItems } from '../../util/api';
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
} from '../../transactions/transaction';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUserNotifications } from '../../ducks/user.duck';

const { UUID } = sdkTypes;

const MESSAGES_PAGE_SIZE = 100;
const REVIEW_TX_INCLUDES = ['reviews', 'reviews.author', 'reviews.subject'];

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/TransactionPage/SET_INITIAL_VALUES';

export const FETCH_TRANSACTION_REQUEST = 'app/TransactionPage/FETCH_TRANSACTION_REQUEST';
export const FETCH_TRANSACTION_SUCCESS = 'app/TransactionPage/FETCH_TRANSACTION_SUCCESS';
export const FETCH_TRANSACTION_ERROR = 'app/TransactionPage/FETCH_TRANSACTION_ERROR';

export const FETCH_TRANSITIONS_REQUEST = 'app/TransactionPage/FETCH_TRANSITIONS_REQUEST';
export const FETCH_TRANSITIONS_SUCCESS = 'app/TransactionPage/FETCH_TRANSITIONS_SUCCESS';
export const FETCH_TRANSITIONS_ERROR = 'app/TransactionPage/FETCH_TRANSITIONS_ERROR';

export const TRANSITION_REQUEST = 'app/TransactionPage/MARK_RECEIVED_REQUEST';
export const TRANSITION_SUCCESS = 'app/TransactionPage/TRANSITION_SUCCESS';
export const TRANSITION_ERROR = 'app/TransactionPage/TRANSITION_ERROR';

export const FETCH_MESSAGES_REQUEST = 'app/TransactionPage/FETCH_MESSAGES_REQUEST';
export const FETCH_MESSAGES_SUCCESS = 'app/TransactionPage/FETCH_MESSAGES_SUCCESS';
export const FETCH_MESSAGES_ERROR = 'app/TransactionPage/FETCH_MESSAGES_ERROR';

export const SEND_MESSAGE_REQUEST = 'app/TransactionPage/SEND_MESSAGE_REQUEST';
export const SEND_MESSAGE_SUCCESS = 'app/TransactionPage/SEND_MESSAGE_SUCCESS';
export const SEND_MESSAGE_ERROR = 'app/TransactionPage/SEND_MESSAGE_ERROR';

export const SEND_REVIEW_REQUEST = 'app/TransactionPage/SEND_REVIEW_REQUEST';
export const SEND_REVIEW_SUCCESS = 'app/TransactionPage/SEND_REVIEW_SUCCESS';
export const SEND_REVIEW_ERROR = 'app/TransactionPage/SEND_REVIEW_ERROR';

export const FETCH_TIME_SLOTS_REQUEST = 'app/TransactionPage/FETCH_TIME_SLOTS_REQUEST';
export const FETCH_TIME_SLOTS_SUCCESS = 'app/TransactionPage/FETCH_TIME_SLOTS_SUCCESS';
export const FETCH_TIME_SLOTS_ERROR = 'app/TransactionPage/FETCH_TIME_SLOTS_ERROR';

export const FETCH_LINE_ITEMS_REQUEST = 'app/TransactionPage/FETCH_LINE_ITEMS_REQUEST';
export const FETCH_LINE_ITEMS_SUCCESS = 'app/TransactionPage/FETCH_LINE_ITEMS_SUCCESS';
export const FETCH_LINE_ITEMS_ERROR = 'app/TransactionPage/FETCH_LINE_ITEMS_ERROR';

// ================ Reducer ================ //

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
  initialMessageFailedToTransaction: null,
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

export default function transactionPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case FETCH_TRANSACTION_REQUEST:
      return { ...state, fetchTransactionInProgress: true, fetchTransactionError: null };
    case FETCH_TRANSACTION_SUCCESS: {
      const transactionRef = { id: payload.data.data.id, type: 'transaction' };
      return { ...state, fetchTransactionInProgress: false, transactionRef };
    }
    case FETCH_TRANSACTION_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, fetchTransactionInProgress: false, fetchTransactionError: payload };

    case FETCH_TRANSITIONS_REQUEST:
      return { ...state, fetchTransitionsInProgress: true, fetchTransitionsError: null };
    case FETCH_TRANSITIONS_SUCCESS:
      return { ...state, fetchTransitionsInProgress: false, processTransitions: payload };
    case FETCH_TRANSITIONS_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, fetchTransitionsInProgress: false, fetchTransitionsError: payload };

    case TRANSITION_REQUEST:
      return {
        ...state,
        transitionInProgress: payload,
        transitionError: null,
      };
    case TRANSITION_SUCCESS:
      return { ...state, transitionInProgress: null };
    case TRANSITION_ERROR:
      return {
        ...state,
        transitionInProgress: null,
        transitionError: payload,
      };

    case FETCH_MESSAGES_REQUEST:
      return { ...state, fetchMessagesInProgress: true, fetchMessagesError: null };
    case FETCH_MESSAGES_SUCCESS: {
      const oldestMessagePageFetched =
        state.oldestMessagePageFetched > payload.page
          ? state.oldestMessagePageFetched
          : payload.page;
      return {
        ...state,
        fetchMessagesInProgress: false,
        messages: mergeEntityArrays(state.messages, payload.messages),
        totalMessages: payload.totalItems,
        totalMessagePages: payload.totalPages,
        oldestMessagePageFetched,
      };
    }
    case FETCH_MESSAGES_ERROR:
      return { ...state, fetchMessagesInProgress: false, fetchMessagesError: payload };

    case SEND_MESSAGE_REQUEST:
      return {
        ...state,
        sendMessageInProgress: true,
        sendMessageError: null,
        initialMessageFailedToTransaction: null,
      };
    case SEND_MESSAGE_SUCCESS:
      return { ...state, sendMessageInProgress: false };
    case SEND_MESSAGE_ERROR:
      return { ...state, sendMessageInProgress: false, sendMessageError: payload };

    case SEND_REVIEW_REQUEST:
      return { ...state, sendReviewInProgress: true, sendReviewError: null };
    case SEND_REVIEW_SUCCESS:
      return { ...state, sendReviewInProgress: false };
    case SEND_REVIEW_ERROR:
      return { ...state, sendReviewInProgress: false, sendReviewError: payload };

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

    default:
      return state;
  }
}

// ================ Selectors ================ //

export const transitionInProgress = state => {
  return state.TransactionPage.transitionInProgress;
};

// ================ Action creators ================ //
export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

const fetchTransactionRequest = () => ({ type: FETCH_TRANSACTION_REQUEST });
const fetchTransactionSuccess = response => ({
  type: FETCH_TRANSACTION_SUCCESS,
  payload: response,
});
const fetchTransactionError = e => ({ type: FETCH_TRANSACTION_ERROR, error: true, payload: e });

const fetchTransitionsRequest = () => ({ type: FETCH_TRANSITIONS_REQUEST });
const fetchTransitionsSuccess = response => ({
  type: FETCH_TRANSITIONS_SUCCESS,
  payload: response,
});
const fetchTransitionsError = e => ({ type: FETCH_TRANSITIONS_ERROR, error: true, payload: e });

const transitionRequest = transitionName => ({ type: TRANSITION_REQUEST, payload: transitionName });
const transitionSuccess = () => ({ type: TRANSITION_SUCCESS });
const transitionError = e => ({ type: TRANSITION_ERROR, error: true, payload: e });

const fetchMessagesRequest = () => ({ type: FETCH_MESSAGES_REQUEST });
const fetchMessagesSuccess = (messages, pagination) => ({
  type: FETCH_MESSAGES_SUCCESS,
  payload: { messages, ...pagination },
});
const fetchMessagesError = e => ({ type: FETCH_MESSAGES_ERROR, error: true, payload: e });

const sendMessageRequest = () => ({ type: SEND_MESSAGE_REQUEST });
const sendMessageSuccess = () => ({ type: SEND_MESSAGE_SUCCESS });
const sendMessageError = e => ({ type: SEND_MESSAGE_ERROR, error: true, payload: e });

const sendReviewRequest = () => ({ type: SEND_REVIEW_REQUEST });
const sendReviewSuccess = () => ({ type: SEND_REVIEW_SUCCESS });
const sendReviewError = e => ({ type: SEND_REVIEW_ERROR, error: true, payload: e });

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

// ================ Thunks ================ //

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
    const nextBoundary = findNextBoundary(new Date(), 'hour', tz);

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

const listingRelationship = txResponse => {
  return txResponse.data.data.relationships.listing.data;
};

/**
 * Injects a transaction's included provider relationship as the included
 * listing's author relationship.
 * @param {*} txResponse A SDK response from transactions.show().
 * @returns a copy of the txResponse parameter with a listing.author
 * relationship added, if provider exists in the transaction's relationships.
 */
const injectAuthorRelationship = txResponse => {
  const {
    included,
    data: {
      relationships: { provider },
    },
  } = txResponse.data;

  // If provider has not been included, return the response with no changes.
  if (!provider?.data?.id) {
    return txResponse;
  }

  const includedListingIdx = included.findIndex(inc => inc.type === 'listing');

  // We will set the transaction's provider as the listing's author.
  // The full user resource we want to associate with the listing is
  // already available in the response.data.included array, so we only
  // need to add a relationship reference in the included listing resource.
  included[includedListingIdx] = {
    ...included[includedListingIdx],
    relationships: {
      ...included[includedListingIdx].relationships,
      author: {
        data: {
          id: provider?.data?.id,
          type: 'user',
        },
      },
    },
  };

  return {
    ...txResponse,
    data: {
      ...txResponse.data,
      included: [...included],
    },
  };
};

export const fetchTransaction = (id, txRole, config) => (dispatch, getState, sdk) => {
  dispatch(fetchTransactionRequest());

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

      // API does not allow fetching transaction.listing.author, so we will
      // set the relationship manually based on the transaction's provider.
      return injectAuthorRelationship(response);
    })
    .then(response => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };

      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      dispatch(fetchTransactionSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(fetchTransactionError(storableError(e)));
      throw e;
    });
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

export const makeTransition = (txId, transitionName, params) => (dispatch, getState, sdk) => {
  if (transitionInProgress(getState())) {
    return Promise.reject(new Error('Transition already in progress'));
  }
  dispatch(transitionRequest(transitionName));

  return sdk.transactions
    .transition({ id: txId, transition: transitionName, params }, { expand: true })
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(transitionSuccess());
      dispatch(fetchCurrentUserNotifications());

      // There could be automatic transitions after this transition
      // For example mark-received-from-purchased > auto-complete.
      // Here, we make 1-2 delayed updates for the tx entity.
      // This way "leave a review" link should show up for the customer.
      refreshTransactionEntity(sdk, txId, dispatch);

      return response;
    })
    .catch(e => {
      dispatch(transitionError(storableError(e)));
      log.error(e, `${transitionName}-failed`, {
        txId,
        transition: transitionName,
      });
      throw e;
    });
};

const fetchMessages = (txId, page, config) => (dispatch, getState, sdk) => {
  const paging = { page, perPage: MESSAGES_PAGE_SIZE };
  dispatch(fetchMessagesRequest());

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
      const totalMessages = getState().TransactionPage.totalMessages;

      // Original fetchMessages call succeeded
      dispatch(fetchMessagesSuccess(messages, pagination));

      // Check if totalItems has changed between fetched pagination pages
      // if totalItems has changed, fetch first page again to include new incoming messages.
      // TODO if there're more than 100 incoming messages,
      // this should loop through most recent pages instead of fetching just the first one.
      if (totalItems > totalMessages && page > 1) {
        dispatch(fetchMessages(txId, 1, config))
          .then(() => {
            // Original fetch was enough as a response for user action,
            // this just includes new incoming messages
          })
          .catch(() => {
            // Background update, no need to to do anything atm.
          });
      }
    })
    .catch(e => {
      dispatch(fetchMessagesError(storableError(e)));
      throw e;
    });
};

export const fetchMoreMessages = (txId, config) => (dispatch, getState, sdk) => {
  const state = getState();
  const { oldestMessagePageFetched, totalMessagePages } = state.TransactionPage;
  const hasMoreOldMessages = totalMessagePages > oldestMessagePageFetched;

  // In case there're no more old pages left we default to fetching the current cursor position
  const nextPage = hasMoreOldMessages ? oldestMessagePageFetched + 1 : oldestMessagePageFetched;

  return dispatch(fetchMessages(txId, nextPage, config));
};

export const sendMessage = (txId, message, config) => (dispatch, getState, sdk) => {
  dispatch(sendMessageRequest());

  return sdk.messages
    .send({ transactionId: txId, content: message })
    .then(response => {
      const messageId = response.data.data.id;

      // We fetch the first page again to add sent message to the page data
      // and update possible incoming messages too.
      // TODO if there're more than 100 incoming messages,
      // this should loop through most recent pages instead of fetching just the first one.
      return dispatch(fetchMessages(txId, 1, config))
        .then(() => {
          dispatch(sendMessageSuccess());
          return messageId;
        })
        .catch(() => dispatch(sendMessageSuccess()));
    })
    .catch(e => {
      dispatch(sendMessageError(storableError(e)));
      // Rethrow so the page can track whether the sending failed, and
      // keep the message in the form for a retry.
      throw e;
    });
};

// If other party has already sent a review, we need to make transition to
// transitions.REVIEW_2_BY_<CUSTOMER/PROVIDER>
const sendReviewAsSecond = (txId, transition, params, dispatch, sdk, config) => {
  const include = REVIEW_TX_INCLUDES;

  return sdk.transactions
    .transition(
      { id: txId, transition, params },
      { expand: true, include, ...getImageVariants(config.layout.listingImage) }
    )
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(sendReviewSuccess());
      return response;
    })
    .catch(e => {
      dispatch(sendReviewError(storableError(e)));

      // Rethrow so the page can track whether the sending failed, and
      // keep the message in the form for a retry.
      throw e;
    });
};

// If other party has not yet sent a review, we need to make transition to
// transitions.REVIEW_1_BY_<CUSTOMER/PROVIDER>
// However, the other party might have made the review after previous data synch point.
// So, error is likely to happen and then we must try another state transition
// by calling sendReviewAsSecond().
const sendReviewAsFirst = (txId, transition, params, dispatch, sdk, config) => {
  const include = REVIEW_TX_INCLUDES;

  return sdk.transactions
    .transition(
      { id: txId, transition, params },
      { expand: true, include, ...getImageVariants(config.layout.listingImage) }
    )
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(sendReviewSuccess());
      return response;
    })
    .catch(e => {
      // If transaction transition is invalid, lets try another endpoint.
      if (isTransactionsTransitionInvalidTransition(e)) {
        return sendReviewAsSecond(id, params, role, dispatch, sdk);
      } else {
        dispatch(sendReviewError(storableError(e)));

        // Rethrow so the page can track whether the sending failed, and
        // keep the message in the form for a retry.
        throw e;
      }
    });
};

export const sendReview = (tx, transitionOptionsInfo, params, config) => (
  dispatch,
  getState,
  sdk
) => {
  const { reviewAsFirst, reviewAsSecond, hasOtherPartyReviewedFirst } = transitionOptionsInfo;
  dispatch(sendReviewRequest());

  return hasOtherPartyReviewedFirst
    ? sendReviewAsSecond(tx?.id, reviewAsSecond, params, dispatch, sdk, config)
    : sendReviewAsFirst(tx?.id, reviewAsFirst, params, dispatch, sdk, config);
};

const isNonEmpty = value => {
  return typeof value === 'object' || Array.isArray(value) ? !isEmpty(value) : !!value;
};

export const fetchNextTransitions = id => (dispatch, getState, sdk) => {
  dispatch(fetchTransitionsRequest());

  return sdk.processTransitions
    .query({ transactionId: id })
    .then(res => {
      dispatch(fetchTransitionsSuccess(res.data.data));
    })
    .catch(e => {
      dispatch(fetchTransitionsError(storableError(e)));
    });
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
    dispatch(fetchTransaction(txId, txRole, config)),
    dispatch(fetchMessages(txId, 1, config)),
    dispatch(fetchNextTransitions(txId)),
  ]);
};
