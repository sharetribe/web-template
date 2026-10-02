import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser, getSavedListingIds } from '../../ducks/user.duck';

const { UUID } = sdkTypes;

// ================ Async Thunks ================ //

/////////////////////////////
// Query Saved Listings    //
/////////////////////////////
const querySavedListingsPayloadCreator = (config, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const savedIds = getSavedListingIds(getState().user.currentUser);

  if (savedIds.length === 0) {
    return Promise.resolve({ listingIds: [] });
  }

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return sdk.listings
    .query({
      ids: savedIds,
      perPage: savedIds.length,
      include: ['author', 'images'],
      'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    })
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      // Only published listings are returned: sold out, closed or deleted ones drop out here.
      // Keep the order in which the user saved them (newest first).
      const foundIds = response.data.data.map(l => l.id.uuid);
      const listingIds = savedIds.filter(id => foundIds.includes(id)).map(id => new UUID(id));
      return { listingIds };
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const querySavedListingsThunk = createAsyncThunk(
  'SavedListingsPage/querySavedListings',
  querySavedListingsPayloadCreator
);

// ================ Slice ================ //

const savedListingsPageSlice = createSlice({
  name: 'SavedListingsPage',
  initialState: {
    listingIds: [],
    queryInProgress: false,
    queryListingsError: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(querySavedListingsThunk.pending, state => {
        state.queryInProgress = true;
        state.queryListingsError = null;
      })
      .addCase(querySavedListingsThunk.fulfilled, (state, action) => {
        state.queryInProgress = false;
        state.listingIds = action.payload.listingIds;
      })
      .addCase(querySavedListingsThunk.rejected, (state, action) => {
        state.queryInProgress = false;
        state.queryListingsError = action.payload;
      });
  },
});

export default savedListingsPageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => dispatch => {
  // Saved listing ids live in the current user's private data, so the user is fetched first.
  return dispatch(fetchCurrentUser())
    .then(() => dispatch(querySavedListingsThunk(config)))
    .catch(e => {
      // Errors are stored in the state and shown on the page
    });
};
