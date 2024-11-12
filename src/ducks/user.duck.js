import { util as sdkUtil } from '../util/sdkLoader';
import { denormalisedResponseEntities, ensureOwnListing } from '../util/data';
import * as log from '../util/log';
import { LISTING_STATE_DRAFT } from '../util/types';
import { storableError } from '../util/errors';
import { isUserAuthorized } from '../util/userHelpers';
import { getTransitionsNeedingProviderAttention } from '../transactions/transaction';

import { authInfo } from './auth.duck';
import { stripeAccountCreateSuccess } from './stripeConnectAccount.duck';

// ================ Action types ================ //

export const CURRENT_USER_SHOW_REQUEST = 'app/user/CURRENT_USER_SHOW_REQUEST';
export const CURRENT_USER_SHOW_SUCCESS = 'app/user/CURRENT_USER_SHOW_SUCCESS';
export const CURRENT_USER_SHOW_ERROR = 'app/user/CURRENT_USER_SHOW_ERROR';

export const CLEAR_CURRENT_USER = 'app/user/CLEAR_CURRENT_USER';

export const FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST';
export const FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS';
export const FETCH_CURRENT_USER_HAS_LISTINGS_ERROR =
  'app/user/FETCH_CURRENT_USER_HAS_LISTINGS_ERROR';

export const FETCH_CURRENT_USER_NOTIFICATIONS_REQUEST =
  'app/user/FETCH_CURRENT_USER_NOTIFICATIONS_REQUEST';
export const FETCH_CURRENT_USER_NOTIFICATIONS_SUCCESS =
  'app/user/FETCH_CURRENT_USER_NOTIFICATIONS_SUCCESS';
export const FETCH_CURRENT_USER_NOTIFICATIONS_ERROR =
  'app/user/FETCH_CURRENT_USER_NOTIFICATIONS_ERROR';

export const FETCH_CURRENT_USER_HAS_ORDERS_REQUEST =
  'app/user/FETCH_CURRENT_USER_HAS_ORDERS_REQUEST';
export const FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS =
  'app/user/FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS';
export const FETCH_CURRENT_USER_HAS_ORDERS_ERROR = 'app/user/FETCH_CURRENT_USER_HAS_ORDERS_ERROR';

export const SEND_VERIFICATION_EMAIL_REQUEST = 'app/user/SEND_VERIFICATION_EMAIL_REQUEST';
export const SEND_VERIFICATION_EMAIL_SUCCESS = 'app/user/SEND_VERIFICATION_EMAIL_SUCCESS';
export const SEND_VERIFICATION_EMAIL_ERROR = 'app/user/SEND_VERIFICATION_EMAIL_ERROR';

// ================ Reducer ================ //

const mergeCurrentUser = (oldCurrentUser, newCurrentUser) => {
  const { id: oId, type: oType, attributes: oAttr, ...oldRelationships } = oldCurrentUser || {};
  const { id, type, attributes, ...relationships } = newCurrentUser || {};

  // Passing null will remove currentUser entity.
  // Only relationships are merged.
  // TODO figure out if sparse fields handling needs a better handling.
  return newCurrentUser === null
    ? null
    : oldCurrentUser === null
    ? newCurrentUser
    : { id, type, attributes, ...oldRelationships, ...relationships };
};

const initialState = {
  currentUser: null,
  currentUserShowTimestamp: 0,
  currentUserShowError: null,
  currentUserHasListings: false,
  currentUserHasListingsError: null,
  currentUserNotificationCount: 0,
  currentUserNotificationCountError: null,
  currentUserHasOrders: null, // This is not fetched unless unverified emails exist
  currentUserHasOrdersError: null,
  sendVerificationEmailInProgress: false,
  sendVerificationEmailError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case CURRENT_USER_SHOW_REQUEST:
      return { ...state, currentUserShowError: null };
    case CURRENT_USER_SHOW_SUCCESS:
      return {
        ...state,
        currentUser: mergeCurrentUser(state.currentUser, payload),
        currentUserShowTimestamp: payload ? new Date().getTime() : 0,
      };
    case CURRENT_USER_SHOW_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, currentUserShowError: payload };

    case CLEAR_CURRENT_USER:
      return {
        ...state,
        currentUser: null,
        currentUserShowError: null,
        currentUserHasListings: false,
        currentUserHasListingsError: null,
        currentUserNotificationCount: 0,
        currentUserNotificationCountError: null,
      };

    case FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST:
      return { ...state, currentUserHasListingsError: null };
    case FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS:
      return { ...state, currentUserHasListings: payload.hasListings };
    case FETCH_CURRENT_USER_HAS_LISTINGS_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, currentUserHasListingsError: payload };

    case FETCH_CURRENT_USER_NOTIFICATIONS_REQUEST:
      return { ...state, currentUserNotificationCountError: null };
    case FETCH_CURRENT_USER_NOTIFICATIONS_SUCCESS:
      return { ...state, currentUserNotificationCount: payload.transactions.length };
    case FETCH_CURRENT_USER_NOTIFICATIONS_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, currentUserNotificationCountError: payload };

    case FETCH_CURRENT_USER_HAS_ORDERS_REQUEST:
      return { ...state, currentUserHasOrdersError: null };
    case FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS:
      return { ...state, currentUserHasOrders: payload.hasOrders };
    case FETCH_CURRENT_USER_HAS_ORDERS_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, currentUserHasOrdersError: payload };

    case SEND_VERIFICATION_EMAIL_REQUEST:
      return {
        ...state,
        sendVerificationEmailInProgress: true,
        sendVerificationEmailError: null,
      };
    case SEND_VERIFICATION_EMAIL_SUCCESS:
      return {
        ...state,
        sendVerificationEmailInProgress: false,
      };
    case SEND_VERIFICATION_EMAIL_ERROR:
      return {
        ...state,
        sendVerificationEmailInProgress: false,
        sendVerificationEmailError: payload,
      };

    default:
      return state;
  }
}

// ================ Selectors ================ //

export const hasCurrentUserErrors = state => {
  const { user } = state;
  return (
    user.currentUserShowError ||
    user.currentUserHasListingsError ||
    user.currentUserNotificationCountError ||
    user.currentUserHasOrdersError
  );
};

export const verificationSendingInProgress = state => {
  return state.user.sendVerificationEmailInProgress;
};

// ================ Action creators ================ //

export const currentUserShowRequest = () => ({ type: CURRENT_USER_SHOW_REQUEST });

export const currentUserShowSuccess = user => ({
  type: CURRENT_USER_SHOW_SUCCESS,
  payload: user,
});

export const currentUserShowError = e => ({
  type: CURRENT_USER_SHOW_ERROR,
  payload: e,
  error: true,
});

export const clearCurrentUser = () => ({ type: CLEAR_CURRENT_USER });

const fetchCurrentUserHasListingsRequest = () => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_REQUEST,
});

export const fetchCurrentUserHasListingsSuccess = hasListings => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_SUCCESS,
  payload: { hasListings },
});

const fetchCurrentUserHasListingsError = e => ({
  type: FETCH_CURRENT_USER_HAS_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const fetchCurrentUserNotificationsRequest = () => ({
  type: FETCH_CURRENT_USER_NOTIFICATIONS_REQUEST,
});

export const fetchCurrentUserNotificationsSuccess = transactions => ({
  type: FETCH_CURRENT_USER_NOTIFICATIONS_SUCCESS,
  payload: { transactions },
});

const fetchCurrentUserNotificationsError = e => ({
  type: FETCH_CURRENT_USER_NOTIFICATIONS_ERROR,
  error: true,
  payload: e,
});

const fetchCurrentUserHasOrdersRequest = () => ({
  type: FETCH_CURRENT_USER_HAS_ORDERS_REQUEST,
});

export const fetchCurrentUserHasOrdersSuccess = hasOrders => ({
  type: FETCH_CURRENT_USER_HAS_ORDERS_SUCCESS,
  payload: { hasOrders },
});

const fetchCurrentUserHasOrdersError = e => ({
  type: FETCH_CURRENT_USER_HAS_ORDERS_ERROR,
  error: true,
  payload: e,
});

export const sendVerificationEmailRequest = () => ({
  type: SEND_VERIFICATION_EMAIL_REQUEST,
});

export const sendVerificationEmailSuccess = () => ({
  type: SEND_VERIFICATION_EMAIL_SUCCESS,
});

export const sendVerificationEmailError = e => ({
  type: SEND_VERIFICATION_EMAIL_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchCurrentUserHasListings = () => (dispatch, getState, sdk) => {
  dispatch(fetchCurrentUserHasListingsRequest());
  const { currentUser } = getState().user;

  if (!currentUser) {
    dispatch(fetchCurrentUserHasListingsSuccess(false));
    return Promise.resolve(null);
  }

  const params = {
    // Since we are only interested in if the user has published
    // listings, we only need at most one result.
    states: 'published',
    page: 1,
    perPage: 1,
  };

  return sdk.ownListings
    .query(params)
    .then(response => {
      const hasListings = response.data.data && response.data.data.length > 0;

      const hasPublishedListings =
        hasListings &&
        ensureOwnListing(response.data.data[0]).attributes.state !== LISTING_STATE_DRAFT;
      dispatch(fetchCurrentUserHasListingsSuccess(!!hasPublishedListings));
    })
    .catch(e => dispatch(fetchCurrentUserHasListingsError(storableError(e))));
};

export const fetchCurrentUserHasOrders = () => (dispatch, getState, sdk) => {
  dispatch(fetchCurrentUserHasOrdersRequest());

  if (!getState().user.currentUser) {
    dispatch(fetchCurrentUserHasOrdersSuccess(false));
    return Promise.resolve(null);
  }

  const params = {
    only: 'order',
    page: 1,
    perPage: 1,
  };

  return sdk.transactions
    .query(params)
    .then(response => {
      const hasOrders = response.data.data && response.data.data.length > 0;
      dispatch(fetchCurrentUserHasOrdersSuccess(!!hasOrders));
    })
    .catch(e => dispatch(fetchCurrentUserHasOrdersError(storableError(e))));
};

// Notificaiton page size is max (100 items on page)
const NOTIFICATION_PAGE_SIZE = 100;

export const fetchCurrentUserNotifications = () => (dispatch, getState, sdk) => {
  const transitionsNeedingAttention = getTransitionsNeedingProviderAttention();
  if (transitionsNeedingAttention.length === 0) {
    // Don't update state, if there's no need to draw user's attention after last transitions.
    return;
  }

  const apiQueryParams = {
    only: 'sale',
    last_transitions: transitionsNeedingAttention,
    page: 1,
    perPage: NOTIFICATION_PAGE_SIZE,
  };

  dispatch(fetchCurrentUserNotificationsRequest());
  sdk.transactions
    .query(apiQueryParams)
    .then(response => {
      const transactions = response.data.data;
      dispatch(fetchCurrentUserNotificationsSuccess(transactions));
    })
    .catch(e => dispatch(fetchCurrentUserNotificationsError(storableError(e))));
};

/**
 * Fetch currentUser API entity.
 *
 * @param {Object} options
 * @param {Object} [options.callParams]           Optional parameters for the currentUser.show().
 * @param {boolean} [options.updateHasListings]   Make extra call for fetchCurrentUserHasListings()?
 * @param {boolean} [options.updateNotifications] Make extra call for fetchCurrentUserNotifications()?
 * @param {boolean} [options.afterLogin]          Fetch is no-op for unauthenticated users except after login() call
 * @param {boolean} [options.enforce]             Enforce the call even if the currentUser entity is freshly fetched.
 */
export const fetchCurrentUser = options => (dispatch, getState, sdk) => {
  const state = getState();
  const { currentUserHasListings, currentUserShowTimestamp } = state.user || {};
  const { isAuthenticated } = state.auth;
  const {
    callParams = null,
    updateHasListings = true,
    updateNotifications = true,
    afterLogin,
    enforce = false, // Automatic emailVerification might be called too fast
  } = options || {};

  // Double fetch might happen when e.g. profile page is making a full page load
  const aSecondAgo = new Date().getTime() - 1000;
  if (!enforce && currentUserShowTimestamp > aSecondAgo) {
    return Promise.resolve({});
  }
  // Set in-progress, no errors
  dispatch(currentUserShowRequest());

  if (!isAuthenticated && !afterLogin) {
    // Make sure current user is null
    dispatch(currentUserShowSuccess(null));
    return Promise.resolve({});
  }

  const parameters = callParams || {
    include: ['effectivePermissionSet', 'profileImage', 'stripeAccount'],
    'fields.image': [
      'variants.square-small',
      'variants.square-small2x',
      'variants.square-xsmall',
      'variants.square-xsmall2x',
    ],
    'imageVariant.square-xsmall': sdkUtil.objectQueryString({
      w: 40,
      h: 40,
      fit: 'crop',
    }),
    'imageVariant.square-xsmall2x': sdkUtil.objectQueryString({
      w: 80,
      h: 80,
      fit: 'crop',
    }),
  };

  return sdk.currentUser
    .show(parameters)
    .then(response => {
      const entities = denormalisedResponseEntities(response);
      if (entities.length !== 1) {
        throw new Error('Expected a resource in the sdk.currentUser.show response');
      }
      const currentUser = entities[0];

      // Save stripeAccount to store.stripe.stripeAccount if it exists
      if (currentUser.stripeAccount) {
        dispatch(stripeAccountCreateSuccess(currentUser.stripeAccount));
      }

      // set current user id to the logger
      log.setUserId(currentUser.id.uuid);
      dispatch(currentUserShowSuccess(currentUser));
      return currentUser;
    })
    .then(currentUser => {
      // If currentUser is not active (e.g. in 'pending-approval' state),
      // then they don't have listings or transactions that we care about.
      if (isUserAuthorized(currentUser)) {
        if (currentUserHasListings === false && updateHasListings !== false) {
          dispatch(fetchCurrentUserHasListings());
        }

        if (updateNotifications !== false) {
          dispatch(fetchCurrentUserNotifications());
        }

        if (!currentUser.attributes.emailVerified) {
          dispatch(fetchCurrentUserHasOrders());
        }
      }

      // Make sure auth info is up to date
      dispatch(authInfo());
    })
    .catch(e => {
      // Make sure auth info is up to date
      dispatch(authInfo());
      log.error(e, 'fetch-current-user-failed');
      dispatch(currentUserShowError(storableError(e)));
    });
};

export const sendVerificationEmail = () => (dispatch, getState, sdk) => {
  if (verificationSendingInProgress(getState())) {
    return Promise.reject(new Error('Verification email sending already in progress'));
  }
  dispatch(sendVerificationEmailRequest());
  return sdk.currentUser
    .sendVerificationEmail()
    .then(() => dispatch(sendVerificationEmailSuccess()))
    .catch(e => dispatch(sendVerificationEmailError(storableError(e))));
};
