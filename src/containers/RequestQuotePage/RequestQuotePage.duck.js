import pick from 'lodash/pick';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { isUserAuthorized } from '../../util/userHelpers';
import { getProcess, resolveLatestProcessName } from '../../transactions/transaction';
import { setCurrentUserHasOrders } from '../../ducks/user.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

const { UUID } = sdkTypes;

const getTransitionName = processAlias => {
  const processName = resolveLatestProcessName(processAlias.split('/')[0]);
  const process = getProcess(processName);
  const transitions = process.transitions;

  return transitions.REQUEST_QUOTE;
};

// ================ Async Thunks ================ //

//////////////////
// Show Listing //
//////////////////
const showListingPayloadCreator = (
  { listingId, config },
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

  return sdk.listings
    .show(params)
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
  'RequestQuotePage/showListing',
  showListingPayloadCreator
);

// Backward compatible wrapper for the thunk
export const showListing = (listingId, config) => dispatch => {
  return dispatch(showListingThunk({ listingId, config }));
};

///////////////////
// Request Quote //
///////////////////
const requestQuotePayloadCreator = (
  { params, processAlias },
  { dispatch, getState, rejectWithValue, extra: sdk }
) => {
  if (!processAlias) {
    const error = new Error('No transaction process attached to listing');
    log.error(error, 'listing-process-missing', {
      listingId: listing?.id?.uuid,
    });
    return rejectWithValue(storableError(error));
  }

  const transitionName = getTransitionName(processAlias);

  const bodyParams = {
    processAlias,
    transition: transitionName,
    params,
  };
  const queryParams = {
    include: ['booking', 'provider'],
    expand: true,
  };

  const handleSuccess = response => {
    const entities = denormalisedResponseEntities(response);
    const tx = entities[0];
    dispatch(setCurrentUserHasOrders());
    return tx;
  };

  const handleError = e => {
    const listingId = bodyParams?.params?.listingId?.uuid;
    const listingIdMaybe = listingId ? { listingId } : {};
    log.error(e, 'request-quote-failed', {
      ...listingIdMaybe,
    });
    return rejectWithValue(storableError(e));
  };

  // initiate non-privileged
  return sdk.transactions
    .initiate(bodyParams, queryParams)
    .then(handleSuccess)
    .catch(handleError);
};

export const requestQuoteThunk = createAsyncThunk(
  'RequestQuotePage/requestQuote',
  requestQuotePayloadCreator
);

// Backward compatible wrapper for the thunk
export const requestQuote = (params, processAlias) => dispatch => {
  return dispatch(
    requestQuoteThunk({
      params,
      processAlias,
    })
  ).unwrap();
};

// ================ Slice ================ //
const initialState = {
  listingId: null,
  showListingInProgress: false,
  showListingError: null,
  transaction: null,
  requestQuoteInProgress: false,
  requestQuoteError: null,
};

const requestQuotePageSlice = createSlice({
  name: 'RequestQuotePage',
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
      // requestQuote cases
      .addCase(requestQuoteThunk.pending, state => {
        state.requestQuoteError = null;
        state.requestQuoteInProgress = true;
      })
      .addCase(requestQuoteThunk.fulfilled, (state, action) => {
        state.transaction = action.payload;
        state.requestQuoteInProgress = false;
      })
      .addCase(requestQuoteThunk.rejected, (state, action) => {
        state.requestQuoteError = storableError(action.payload);
        state.requestQuoteInProgress = false;
      });
  },
});

export const { setInitialState, setInitialValues } = requestQuotePageSlice.actions;
export default requestQuotePageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const listingId = new UUID(params.id);
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

  return dispatch(showListingThunk({ listingId, config }));
};
