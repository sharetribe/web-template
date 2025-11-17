import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updatedEntities, denormalisedEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { parse } from '../../util/urlHelpers';

import { fetchCurrentUser } from '../../ducks/user.duck';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 42 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 42;

// ================ Selectors ================ //

/**
 * Get the denormalised own listing entities with the given IDs
 *
 * @param {Object} state the full Redux store
 * @param {Array<UUID>} listingIds listing IDs to select from the store
 */
export const getOwnListingsById = (state, listingIds) => {
  const { ownEntities } = state.ManageListingsPage;
  const resources = listingIds.map(id => ({
    id,
    type: 'ownListing',
  }));
  const throwIfNotFound = false;
  return denormalisedEntities(ownEntities, resources, throwIfNotFound);
};

// ================ Async Thunks ================ //

////////////////////////
// Query Own Listings //
////////////////////////
const queryOwnListingsPayloadCreator = (queryParams, { extra: sdk, dispatch, rejectWithValue }) => {
  const { perPage, ...rest } = queryParams;
  const params = { ...rest, perPage };

  return sdk.ownListings
    .query(params)
    .then(response => {
      dispatch(addOwnEntities(response));
      return response;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryOwnListingsThunk = createAsyncThunk(
  'app/ManageListingsPage/queryOwnListings',
  queryOwnListingsPayloadCreator
);
// Backward compatible wrapper for the thunk
export const queryOwnListings = queryParams => (dispatch, getState, sdk) => {
  return dispatch(queryOwnListingsThunk(queryParams)).unwrap();
};

///////////////////
// Close Listing //
///////////////////
const closeListingPayloadCreator = (listingId, { extra: sdk, rejectWithValue }) => {
  return sdk.ownListings
    .close({ id: listingId }, { expand: true })
    .then(response => response)
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const closeListingThunk = createAsyncThunk(
  'app/ManageListingsPage/closeListing',
  closeListingPayloadCreator
);
// Backward compatible wrapper for the thunk
export const closeListing = listingId => (dispatch, getState, sdk) => {
  return dispatch(closeListingThunk(listingId)).unwrap();
};

//////////////////
// Open Listing //
//////////////////
const openListingPayloadCreator = (listingId, { extra: sdk, rejectWithValue }) => {
  return sdk.ownListings
    .open({ id: listingId }, { expand: true })
    .then(response => response)
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const openListingThunk = createAsyncThunk(
  'app/ManageListingsPage/openListing',
  openListingPayloadCreator
);
// Backward compatible wrapper for the thunk
export const openListing = listingId => (dispatch, getState, sdk) => {
  return dispatch(openListingThunk(listingId)).unwrap();
};

///////////////////
// Discard Draft //
///////////////////

const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

const discardDraftPayloadCreator = (listingId, thunkAPI) => {
  const { getState, extra: sdk, dispatch, rejectWithValue } = thunkAPI;
  const { queryParams } = getState().ManageListingsPage;

  return sdk.ownListings
    .discardDraft({ id: listingId }, { expand: true })
    .then(() => {
      // Return the listing update with a delay, so that the user
      // notices which listing gets removed
      return Promise.all([delay(300), sdk.ownListings.query(queryParams)]);
    })
    .then(([_, listingResponse]) => {
      dispatch(addOwnEntities(listingResponse));
      return listingResponse;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const discardDraftThunk = createAsyncThunk(
  'app/ManageListingsPage/discardDraft',
  discardDraftPayloadCreator
);
// Backward compatible wrapper for the thunk
export const discardDraft = listingId => (dispatch, getState, sdk) => {
  return dispatch(discardDraftThunk(listingId)).unwrap();
};

// ================ Slice ================ //

const resultIds = data => data.data.map(l => l.id);

const updateListingAttributes = (state, listingEntity) => {
  const oldListing = state.ownEntities.ownListing[listingEntity.id.uuid];
  const updatedListing = { ...oldListing, attributes: listingEntity.attributes };
  const ownListingEntities = {
    ...state.ownEntities.ownListing,
    [listingEntity.id.uuid]: updatedListing,
  };
  return {
    ...state,
    ownEntities: { ...state.ownEntities, ownListing: ownListingEntities },
  };
};

const manageListingsPageSlice = createSlice({
  name: 'ManageListingsPage',
  initialState: {
    pagination: null,
    queryParams: null,
    queryInProgress: false,
    queryListingsError: null,
    currentPageResultIds: [],
    ownEntities: {},
    openingListing: null,
    openingListingError: null,
    closingListing: null,
    closingListingError: null,
    discardingDraft: null,
    discardingDraftError: null,
  },
  reducers: {
    clearOpenListingError: state => {
      state.openingListing = null;
      state.openingListingError = null;
    },
    addOwnEntities: (state, action) => {
      // This works the same way as addMarketplaceEntities,
      // but we don't want to mix own listings with searched listings
      // (own listings data contains different info - e.g. exact location etc.)
      const apiResponse = action.payload.data;
      state.ownEntities = updatedEntities({ ...state.ownEntities }, apiResponse);
    },
  },
  extraReducers: builder => {
    // Query own listings
    builder
      .addCase(queryOwnListingsThunk.pending, (state, action) => {
        state.queryParams = action.meta.arg;
        state.queryInProgress = true;
        state.queryListingsError = null;
        state.currentPageResultIds = [];
      })
      .addCase(queryOwnListingsThunk.fulfilled, (state, action) => {
        state.currentPageResultIds = resultIds(action.payload.data);
        state.pagination = action.payload.data.meta;
        state.queryInProgress = false;
      })
      .addCase(queryOwnListingsThunk.rejected, (state, action) => {
        // eslint-disable-next-line no-console
        console.error(action.payload || action.error);
        state.queryInProgress = false;
        state.queryListingsError = action.payload;
      });

    // Open listing
    builder
      .addCase(openListingThunk.pending, (state, action) => {
        state.openingListing = action.meta.arg;
        state.openingListingError = null;
      })
      .addCase(openListingThunk.fulfilled, (state, action) => {
        const listing = action.payload.data.data;
        const updatedState = updateListingAttributes(state, listing);
        state.ownEntities = updatedState.ownEntities;
        state.openingListing = null;
      })
      .addCase(openListingThunk.rejected, (state, action) => {
        // eslint-disable-next-line no-console
        console.error(action.payload || action.error);
        state.openingListingError = {
          listingId: state.openingListing,
          error: action.payload,
        };
        state.openingListing = null;
      });

    // Close listing
    builder
      .addCase(closeListingThunk.pending, (state, action) => {
        state.closingListing = action.meta.arg;
        state.closingListingError = null;
      })
      .addCase(closeListingThunk.fulfilled, (state, action) => {
        const listing = action.payload.data.data;
        const updatedState = updateListingAttributes(state, listing);
        state.ownEntities = updatedState.ownEntities;
        state.closingListing = null;
      })
      .addCase(closeListingThunk.rejected, (state, action) => {
        // eslint-disable-next-line no-console
        console.error(action.payload || action.error);
        state.closingListingError = {
          listingId: state.closingListing,
          error: action.payload,
        };
        state.closingListing = null;
      });

    // Discard draft
    builder
      .addCase(discardDraftThunk.pending, (state, action) => {
        state.discardingDraft = action.meta.arg;
        state.discardingDraftError = null;
      })
      .addCase(discardDraftThunk.fulfilled, (state, action) => {
        state.currentPageResultIds = resultIds(action.payload.data);
        state.pagination = action.payload.meta;
        state.discardingDraft = null;
      })
      .addCase(discardDraftThunk.rejected, (state, action) => {
        // eslint-disable-next-line no-console
        console.error(action.payload || action.error);
        state.discardingDraftError = {
          listingId: state.discardingDraft,
          error: action.payload,
        };
        state.discardingDraft = null;
      });
  },
});

export const { clearOpenListingError, addOwnEntities } = manageListingsPageSlice.actions;
export default manageListingsPageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;
  dispatch(clearOpenListingError());

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(
      queryOwnListings({
        ...queryParams,
        page,
        perPage: RESULT_PAGE_SIZE,
        include: ['images', 'currentStock'],
        'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
        ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
        ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
        'limit.images': 1,
      })
    ),
  ])
    .then(response => {
      // const currentUser = response[0]?.data?.data;
      const ownListings = response[1]?.data?.data;
      return ownListings;
    })
    .catch(e => {
      throw e;
    });
};
