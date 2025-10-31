import pick from 'lodash/pick';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { initiatePrivileged, transitionPrivileged } from '../../util/api';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { parse } from '../../util/urlHelpers';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { getProcess, resolveLatestProcessName } from '../../transactions/transaction';
import { setCurrentUserHasOrders } from '../../ducks/user.duck';
import { addMarketplaceEntities, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchStripeAccount } from '../../ducks/stripeConnectAccount.duck';

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
      ? transitions.MAKE_OFFER_FROM_REQUEST
      : transitions.MAKE_OFFER;

  return transitionName;
};

// ================ Async Thunks ================ //

//////////////////
// Show Listing //
//////////////////
const showListingPayloadCreator = (
  { listingId, config, isOwn = false },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

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
      return data;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const showListingThunk = createAsyncThunk(
  'MakeOfferPage/showListing',
  showListingPayloadCreator
);

// Backward compatible wrapper for the thunk
export const showListing = (listingId, config, isOwn = false) => dispatch => {
  return dispatch(showListingThunk({ listingId, config, isOwn }));
};

//////////////////////
// Show Transaction //
//////////////////////
const showTransactionPayloadCreator = (
  { transactionId, config },
  { dispatch, rejectWithValue, extra: sdk }
) => {
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
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      return response;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const showTransactionThunk = createAsyncThunk(
  'MakeOfferPage/showTransaction',
  showTransactionPayloadCreator
);

// Backward compatible wrapper for the thunk
export const showTransaction = (transactionId, config) => dispatch => {
  return dispatch(showTransactionThunk({ transactionId, config }));
};

////////////////
// Make Offer //
////////////////
const makeOfferPayloadCreator = (
  { negotiationParams, processAlias, transactionId, isPrivilegedTransition },
  { dispatch, getState, rejectWithValue, extra: sdk }
) => {
  if (!processAlias) {
    const error = new Error('No transaction process attached to listing');
    log.error(error, 'listing-process-missing', {
      listingId: listing?.id?.uuid,
    });
    return rejectWithValue(storableError(error));
  }

  const state = getState();
  const transitionName = getTransitionName(transactionId, processAlias, state);

  // Note: transitionParams are parameters for Marketplace API
  const { offerInSubunits, currency, ...transitionParams } = negotiationParams;

  // Parameters only for client app's server to be used when making a privileged transition
  const orderData = offerInSubunits ? { actor: 'provider', offerInSubunits, currency } : {};

  const isTransition = !!transactionId;
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
    return tx;
  };

  const handleError = e => {
    const listingId = bodyParams?.params?.listingId?.uuid;
    const listingIdMaybe = listingId ? { listingId } : {};
    const transactionIdMaybe = transactionId ? { transactionId: transactionId.uuid } : {};
    log.error(e, 'initiate-negotiation-failed', {
      ...transactionIdMaybe,
      ...listingIdMaybe,
      ...orderData,
    });
    return rejectWithValue(storableError(e));
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

export const makeOfferThunk = createAsyncThunk('MakeOfferPage/makeOffer', makeOfferPayloadCreator);

// Backward compatible wrapper for the thunk
export const makeOffer = (
  params,
  processAlias,
  transactionId,
  isPrivilegedTransition
) => dispatch => {
  return dispatch(
    makeOfferThunk({
      negotiationParams: params,
      processAlias,
      transactionId,
      isPrivilegedTransition,
    })
  ).unwrap();
};

// ================ Slice ================ //
const initialState = {
  listingId: null,
  showListingInProgress: false,
  showListingError: null,
  transaction: null,
  makeOfferInProgress: false,
  makeOfferError: null,
  showTransactionInProgress: false,
  showTransactionError: null,
};

const makeOfferPageSlice = createSlice({
  name: 'MakeOfferPage',
  initialState,
  reducers: {
    setInitialState: () => initialState,
    setInitialValues: (state, action) => {
      return { ...initialState, ...pick(action.payload, Object.keys(initialState)) };
    },
  },
  extraReducers: builder => {
    builder
      // showListing cases
      .addCase(showListingThunk.pending, (state, action) => {
        state.listingId = action.meta.arg.listingId;
        state.showListingError = null;
        state.showListingInProgress = true;
      })
      .addCase(showListingThunk.fulfilled, state => {
        state.showListingInProgress = false;
      })
      .addCase(showListingThunk.rejected, (state, action) => {
        state.showListingError = storableError(action.payload);
        state.showListingInProgress = false;
      })
      // showTransaction cases
      .addCase(showTransactionThunk.pending, (state, action) => {
        state.transaction = action.meta.arg.transactionId;
        state.showTransactionError = null;
        state.showTransactionInProgress = true;
      })
      .addCase(showTransactionThunk.fulfilled, state => {
        state.showTransactionInProgress = false;
      })
      .addCase(showTransactionThunk.rejected, (state, action) => {
        state.showTransactionError = storableError(action.payload);
        state.showTransactionInProgress = false;
      })
      // makeOffer cases
      .addCase(makeOfferThunk.pending, state => {
        state.makeOfferError = null;
        state.makeOfferInProgress = true;
      })
      .addCase(makeOfferThunk.fulfilled, (state, action) => {
        state.transaction = action.payload;
        state.makeOfferInProgress = false;
      })
      .addCase(makeOfferThunk.rejected, (state, action) => {
        state.makeOfferError = storableError(action.payload);
        state.makeOfferInProgress = false;
      });
  },
});

export const { setInitialState, setInitialValues } = makeOfferPageSlice.actions;
export default makeOfferPageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const listingId = new UUID(params.id);
  const searchParams = parse(search);
  const transactionId = searchParams.transactionId ? new UUID(searchParams.transactionId) : null;
  const state = getState();
  const currentUser = state.user?.currentUser;

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  // In private marketplace mode, this page won't fetch data if the user is unauthorized
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
  if (!canFetchData) {
    return Promise.resolve();
  }

  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);

  const fetchStripeAccountMaybe = () =>
    currentUser?.stripeAccount ? [dispatch(fetchStripeAccount())] : [];

  const dataPromises = transactionId
    ? [dispatch(showTransactionThunk({ transactionId, config })), ...fetchStripeAccountMaybe()]
    : [
        dispatch(showListingThunk({ listingId, config, isOwn: hasNoViewingRights })),
        ...fetchStripeAccountMaybe(),
      ];
  return Promise.all(dataPromises);
};
