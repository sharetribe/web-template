import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as log from '../util/log';
import { storableError } from '../util/errors';
import { addMarketplaceEntities } from './marketplaceData.duck';
import { createImageVariantConfig } from '../util/sdkLoader';

const MAX_LISTING_COUNT = 10;

// ================ HELPERS ==================== //

// Extract section object from array using section ID (e.g., 'section-1' → sections[0])
const getSectionBySectionId = (sections, sectionId) => {
  const sectionNumber = parseInt(sectionId.replace('section-', ''));
  const sectionIndex = sectionNumber - 1;
  return sections[sectionIndex];
};

const getSectionKey = sectionIndex => `section-${sectionIndex + 1}`;
const isListingsSection = section => section.sectionType === 'listings';

// Get section keys for all listing sections that match a specific selection type
// e.g., if selectionType is "newest", returns ['section-1', 'section-3'] for sections 1 and 3 if they're both listing sections with selection type "newest"
const getSectionKeysBySelectionType = (allSections, selectionType) =>
  allSections
    .map((section, index) => ({ section, key: getSectionKey(index) }))
    .filter(
      ({ section }) => isListingsSection(section) && section.listingSelection === selectionType
    )
    .map(({ key }) => key);

// ================ Async Thunks ================ //

const fetchFeaturedListingsPayloadCreator = async (arg, thunkAPI) => {
  const { extra: sdk, rejectWithValue, dispatch } = thunkAPI;
  const { sectionId, listingImageConfig, allSections } = arg;

  const currentSection = getSectionBySectionId(allSections, sectionId);
  const listingSelection = currentSection?.listingSelection;

  // Validate selection type
  const validSelectionTypes = ['newest', 'queryString'];
  if (!listingSelection || !validSelectionTypes.includes(listingSelection)) {
    const error = new Error(
      `Invalid listingSelection: "${listingSelection}". Expected "newest" or "queryString".`
    );
    return rejectWithValue(storableError(error));
  }

  let queryParams = {};

  if (listingSelection === 'newest') {
    queryParams = {
      perPage: MAX_LISTING_COUNT,
      page: 1,
    };
  }

  if (listingSelection === 'queryString') {
    const searchParams = Object.fromEntries(
      new URLSearchParams(currentSection?.listingSearchQuery)
    );

    queryParams = {
      perPage: MAX_LISTING_COUNT,
      page: 1,
      ...searchParams,
    };
  }

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImageConfig;
  const aspectRatio = aspectHeight / aspectWidth;

  // Fetch listings from API
  return sdk.listings
    .query({
      ...queryParams,
      minStock: 1,
      stockMode: 'match-undefined',
      include: ['images', 'author'],
      'fields.listing': [
        'title',
        'geolocation',
        'price',
        'deleted',
        'state',
        'publicData.listingType',
        'publicData.transactionProcessAlias',
        'publicData.unitType',
        'publicData.cardStyle',
        'publicData.pickupEnabled',
        'publicData.shippingEnabled',
        'publicData.priceVariationsEnabled',
        'publicData.priceVariants',
      ],
      'fields.image': [
        'variants.listing-card',
        'variants.listing-card-2x',
        'variants.scaled-small',
        'variants.scaled-medium',
      ],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      'limit.images': 1,
    })
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      return { apiResponse: response };
    })
    .catch(error => {
      log.error(error, 'featured-listings-fetch-failed', {
        listingSelection: listingSelection,
      });
      return rejectWithValue(storableError(error));
    });
};

export const fetchFeaturedListings = createAsyncThunk(
  'featuredListings/fetchFeaturedListings',
  fetchFeaturedListingsPayloadCreator
);

// ================ Reducer Helpers ================ //

// Get the section keys that should be updated based on selection type
// - queryString: Only the specific section (each may have unique query params)
// - newest: All sections with 'newest' type (they share the same data)
const getAffectedSectionKeys = (allSections, triggeredSectionId, selectionType) => {
  if (selectionType === 'queryString') {
    return [triggeredSectionId];
  }

  if (selectionType === 'newest') {
    // Returns array of all section keys that have selection type 'newest'
    // Example: ['section-1', 'section-3'] if sections 1 and 3 are both 'newest'
    // This is needed because all 'newest' sections share the same data
    return getSectionKeysBySelectionType(allSections, 'newest');
  }

  return [];
};

// Initialize or/and update section specific state with the data passed in the `updates` parameter
// Example state structure:
// {
//   'landing-page': {
//     'section-1': { selection: 'newest', listingIds: [...], fetched: true, inProgress: false },
//     'section-3': { selection: 'queryString', listingIds: [...], fetched: true, inProgress: false }
//   }
// }
const updateSectionState = (state, parentPage, sectionKey, selectionType, updates) => {
  // Initialize state data for this page if not yet initialised
  if (!state[parentPage]) {
    state[parentPage] = {};
  }

  // Initialize section with default values if it doesn't exist
  if (!state[parentPage][sectionKey]) {
    state[parentPage][sectionKey] = {
      selection: selectionType,
      listingIds: [],
      fetched: false,
    };
  }

  Object.assign(state[parentPage][sectionKey], updates);
};

// ================ Slice ================ //

const featuredListingsSlice = createSlice({
  name: 'featuredListings',
  initialState: {},
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFeaturedListings.pending, (state, action) => {
        const { parentPage, sectionId, allSections } = action.meta.arg;
        const currentSection = getSectionBySectionId(allSections, sectionId);
        const selectionType = currentSection?.listingSelection;

        if (!selectionType) return;

        const affectedSections = getAffectedSectionKeys(allSections, sectionId, selectionType);

        affectedSections.forEach(sectionKey => {
          updateSectionState(state, parentPage, sectionKey, selectionType, {
            fetched: false,
            inProgress: true,
          });
        });
      })
      .addCase(fetchFeaturedListings.fulfilled, (state, action) => {
        const { apiResponse } = action.payload;
        const { parentPage, sectionId, allSections } = action.meta.arg;
        const currentSection = getSectionBySectionId(allSections, sectionId);
        const selectionType = currentSection?.listingSelection;

        if (!selectionType) return;

        const affectedSections = getAffectedSectionKeys(allSections, sectionId, selectionType);
        const listingIds = apiResponse.data.data.map(listing => listing.id);

        affectedSections.forEach(sectionKey => {
          updateSectionState(state, parentPage, sectionKey, selectionType, {
            fetched: true,
            inProgress: false,
            listingIds,
          });
        });
      })
      .addCase(fetchFeaturedListings.rejected, (state, action) => {
        const { parentPage, sectionId, allSections } = action.meta.arg;
        const currentSection = getSectionBySectionId(allSections, sectionId);
        const selectionType = currentSection?.listingSelection;

        const affectedSections = getAffectedSectionKeys(allSections, sectionId, selectionType);

        // Affected section only matches valid sectionTypes. We want to store an error if there's an invalid sectionType
        const sectionsToUpdate = affectedSections.length > 0 ? affectedSections : [sectionId];

        sectionsToUpdate.forEach(sectionKey => {
          updateSectionState(state, parentPage, sectionKey, selectionType, {
            fetched: false,
            inProgress: false,
            error: action.payload,
          });
        });
      });
  },
});

export default featuredListingsSlice.reducer;
