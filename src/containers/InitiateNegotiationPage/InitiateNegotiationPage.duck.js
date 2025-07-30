import pick from 'lodash/pick';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { initiatePrivileged, transitionPrivileged } from '../../util/api';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { parse } from '../../util/urlHelpers';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { getProcess, resolveLatestProcessName } from '../../transactions/transaction';
import { fetchCurrentUserHasOrdersSuccess } from '../../ducks/user.duck';
import { addMarketplaceEntities, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';

const { UUID } = sdkTypes;

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

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/InitiateNegotiationPage/SET_INITIAL_VALUES';

export const SHOW_LISTING_REQUEST = 'app/InitiateNegotiationPage/SHOW_LISTING_REQUEST';
export const SHOW_LISTING_SUCCESS = 'app/InitiateNegotiationPage/SHOW_LISTING__SUCCESS';
export const SHOW_LISTING_ERROR = 'app/InitiateNegotiationPage/SHOW_LISTING_ERROR';

export const SHOW_TRANSACTION_REQUEST = 'app/InitiateNegotiationPage/SHOW_TRANSACTION_REQUEST';
export const SHOW_TRANSACTION_SUCCESS = 'app/InitiateNegotiationPage/SHOW_TRANSACTION_SUCCESS';
export const SHOW_TRANSACTION_ERROR = 'app/InitiateNegotiationPage/SHOW_TRANSACTION_ERROR';

export const MAKE_OFFER_REQUEST = 'app/InitiateNegotiationPage/MAKE_OFFER_REQUEST';
export const MAKE_OFFER_SUCCESS = 'app/InitiateNegotiationPage/MAKE_OFFER_SUCCESS';
export const MAKE_OFFER_ERROR = 'app/InitiateNegotiationPage/MAKE_OFFER_ERROR';

// ================ Reducer ================ //

const initialState = {
  listingId: null,
  showListingInProgress: false,
  showListingError: null,
  transaction: null,
  makeOfferInProgress: false,
  makeOfferError: null,
};

export default function initiateNegotiationPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_VALUES:
      return { ...initialState, ...payload };

    case MAKE_OFFER_REQUEST:
      return { ...state, makeOfferError: null };
    case MAKE_OFFER_SUCCESS:
      return { ...state, transaction: payload };
    case MAKE_OFFER_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return { ...state, makeOfferError: payload };

    case SHOW_LISTING_REQUEST:
      return {
        ...state,
        listingId: payload.listingId,
        showListingError: null,
        showListingInProgress: true,
      };
    case SHOW_LISTING_SUCCESS:
      return { ...state, showListingInProgress: false };
    case SHOW_LISTING_ERROR:
      return { ...state, showListingError: payload, showListingInProgress: false };

    case SHOW_TRANSACTION_REQUEST:
      return {
        ...state,
        transaction: payload.transaction,
        showTransactionError: null,
        showTransactionInProgress: true,
      };
    case SHOW_TRANSACTION_SUCCESS:
      return { ...state, showTransactionInProgress: false };
    case SHOW_TRANSACTION_ERROR:
      return { ...state, showTransactionError: payload, showTransactionInProgress: false };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const makeOfferRequest = () => ({ type: MAKE_OFFER_REQUEST });
export const makeOfferSuccess = transaction => ({
  type: MAKE_OFFER_SUCCESS,
  payload: transaction,
});
export const makeOfferError = e => ({
  type: MAKE_OFFER_ERROR,
  error: true,
  payload: e,
});

export const showListingRequest = listingId => ({
  type: SHOW_LISTING_REQUEST,
  payload: { listingId },
});
export const showListingSuccess = listing => ({
  type: SHOW_LISTING_SUCCESS,
  payload: { listing },
});
export const showListingError = e => ({
  type: SHOW_LISTING_ERROR,
  error: true,
  payload: e,
});

export const showTransactionRequest = transactionId => ({
  type: SHOW_TRANSACTION_REQUEST,
  payload: { transactionId },
});
export const showTransactionSuccess = transaction => ({
  type: SHOW_TRANSACTION_SUCCESS,
  payload: { transaction },
});
export const showTransactionError = e => ({
  type: SHOW_TRANSACTION_ERROR,
  error: true,
  payload: e,
});

/* ================ Thunks ================ */

export const showListing = (listingId, config, isOwn = false) => (dispatch, getState, sdk) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  dispatch(showListingRequest(listingId));

  const params = {
    id: listingId,
    include: ['author', 'author.profileImage', 'images'],
    'fields.image': [
      // Cropped variants for listing thumbnail images
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,

      // Avatars
      'variants.square-small',
      'variants.square-small2x',
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
  };

  const show = isOwn ? sdk.ownListings.show(params) : sdk.listings.show(params);

  return show
    .then(data => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };
      dispatch(addMarketplaceEntities(data, sanitizeConfig));
      dispatch(showListingSuccess(data));
      return data;
    })
    .catch(e => {
      dispatch(showListingError(storableError(e)));
    });
};

export const showTransaction = (transactionId, config) => (dispatch, getState, sdk) => {
  dispatch(showTransactionRequest(transactionId));

  return sdk.transactions
    .show(
      {
        id: transactionId,
        include: [
          'customer',
          'customer.profileImage',
          'provider',
          'provider.profileImage',
          'listing',
          'listing.author',
          'listing.author.profileImage',
          'listing.images',
        ],
        ...getImageVariants(config.layout.listingImage),
      },
      { expand: true }
    )
    .then(response => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };

      dispatch(addMarketplaceEntities(response, sanitizeConfig)); // TODO
      dispatch(showTransactionSuccess(response)); // TODO
      return response;
    })
    .catch(e => {
      dispatch(showTransactionError(storableError(e)));
      throw e;
    });
};

const getTransitionName = (transactionId, processAlias, state) => {
  const ref = { id: new UUID(transactionId), type: 'transaction' };
  const transactions = getMarketplaceEntities(state, [ref]);
  const transaction = transactions.length === 1 ? transactions[0] : null;

  const processName = resolveLatestProcessName(processAlias.split('/')[0]);
  const process = getProcess(processName);
  const transitions = process.transitions;
  const transitionName =
    transaction?.attributes?.lastTransition === transitions.INQUIRE
      ? transitions.MAKE_OFFER_AFTER_INQUIRY
      : transaction?.attributes?.lastTransition === transitions.REQUEST_QUOTE
      ? transitions.MAKE_OFFER_FROM_QUOTE_REQUESTED
      : transitions.MAKE_OFFER;

  return transitionName;
};

/**
 * Initiate the negotiation by making a transition with an offer.
 *
 * @param {Object} negotiationParams
 * @param {Number} negotiationParams.offerInSubunits offer amount in subunits
 * @param {string} processAlias E.g. 'default-negotiation/release-1'
 * @param {string} transactionId uuid string
 * @param {boolean} isPrivilegedTransition
 * @returns
 */
export const initiateNegotiation = (
  negotiationParams,
  processAlias,
  transactionId,
  isPrivilegedTransition
) => (dispatch, getState, sdk) => {
  dispatch(makeOfferRequest());

  // If we already have a transaction ID, we should transition, not
  // initiate.
  const isTransition = !!transactionId;

  const state = getState();
  const transitionName = getTransitionName(transactionId, processAlias, state);

  // Note: transitionParams are parameters for Marketplace API
  const { offerInSubunits, ...transitionParams } = negotiationParams;

  // Parameters only for client app's server to be used when making a privileged transition
  const orderData = offerInSubunits ? { actor: 'provider', offerInSubunits } : {};

  const bodyParams = isTransition
    ? {
        id: transactionId,
        transition: transitionName,
        params: transitionParams,
      }
    : {
        processAlias,
        transition: transitionName,
        params: transitionParams,
      };
  const queryParams = {
    include: ['booking', 'provider'],
    expand: true,
  };

  const handleSuccess = response => {
    const entities = denormalisedResponseEntities(response);
    const tx = entities[0];
    dispatch(makeOfferSuccess(tx));
    dispatch(fetchCurrentUserHasOrdersSuccess(true));
    return tx;
  };

  const handleError = e => {
    dispatch(makeOfferError(storableError(e)));
    const listingId = bodyParams?.params?.listingId?.uuid;
    const listingIdMaybe = listingId ? { listingId } : {};
    const transactionIdMaybe = transactionId ? { transactionId: transactionId.uuid } : {};
    log.error(e, 'initiate-negotiation-failed', {
      ...transactionIdMaybe,
      ...listingIdMaybe,
      ...orderData,
    });
    throw e;
  };

  if (isTransition && isPrivilegedTransition) {
    // transition privileged
    return transitionPrivileged({ isSpeculative: false, orderData, bodyParams, queryParams })
      .then(handleSuccess)
      .catch(handleError);
  } else if (isPrivilegedTransition) {
    // initiate privileged
    return initiatePrivileged({ isSpeculative: false, orderData, bodyParams, queryParams })
      .then(handleSuccess)
      .catch(handleError);
  } else {
    // initiate non-privileged
    return sdk.transactions
      .initiate(bodyParams, queryParams)
      .then(handleSuccess)
      .catch(handleError);
  }
};

export const sendMessage = params => (dispatch, getState, sdk) => {
  const message = params.message;
  const orderId = params.id;

  if (message) {
    return sdk.messages
      .send({ transactionId: orderId, content: message })
      .then(() => {
        return { orderId, messageSuccess: true };
      })
      .catch(e => {
        log.error(e, 'initial-message-send-failed', { txId: orderId });
        return { orderId, messageSuccess: false };
      });
  } else {
    return Promise.resolve({ orderId, messageSuccess: true });
  }
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const listingId = new UUID(params.id);
  const searchParams = parse(search);
  const transactionId = searchParams.transactionId ? new UUID(searchParams.transactionId) : null;
  const state = getState();
  const currentUser = state.user?.currentUser;

  // Clear old line-items
  dispatch(setInitialValues({ lineItems: null }));

  // In private marketplace mode, this page won't fetch data if the user is unauthorized
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
  if (!canFetchData) {
    return Promise.resolve();
  }

  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);

  const dataPromises = transactionId
    ? [dispatch(showTransaction(transactionId, config))]
    : [dispatch(showListing(listingId, config, hasNoViewingRights))];
  return Promise.all(dataPromises);
};
