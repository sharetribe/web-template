import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as log from '../util/log';
import { storableError } from '../util/errors';
import { addMarketplaceEntities } from './marketplaceData.duck';
import { types as sdkTypes } from '../util/sdkLoader';
import { createImageVariantConfig } from '../util/sdkLoader';

const { UUID } = sdkTypes;

// Note: you can't add more that 10 listing IDs via Console
const MAX_LISTING_COUNT = 10;
const NUMBER_OF_NEWEST_LISTINGS = 10;

// ================ HELPERS ==================== //

// Extract section object from array using section ID (e.g., 'section-1' → sections[0])
const getSectionBySectionId = (sections, sectionId) => {
  const sectionNumber = parseInt(sectionId.replace('section-', ''));
  const sectionIndex = sectionNumber - 1;
  return sections[sectionIndex];
};

const getSectionKey = sectionIndex => `section-${sectionIndex + 1}`;
const isListingsSection = section => section.sectionType === 'listings';
const limitListingNumber = (selectedListings, maxListings) => {
  return selectedListings.slice(0, maxListings);
};

// Initialize data object for redux based on selection type (newest/manual)
const initialiseSectionData = (allSections, featuredListingData, parentPage, selectionType) => {
  // Tally all listing ids in total on this page
  let pageListingIds = [];
  let pageSections = {};

  allSections.forEach((section, sectionIndex) => {
    if (isListingsSection(section) && section.listingSelection === selectionType) {
      const sectionKey = getSectionKey(sectionIndex);

      if (selectionType === 'newest') {
        pageSections[sectionKey] = {
          selection: 'newest',
          listingIds: [],
          fetched: false,
        };
      } else if (selectionType === 'manual' && section.selectedListings) {
        const listingIds = limitListingNumber(section.selectedListings, MAX_LISTING_COUNT).map(
          listing => new UUID(listing.listingId)
        );
        pageListingIds.push(...listingIds);

        pageSections[sectionKey] = {
          selection: 'manual',
          listingIds,
          fetched: false,
        };
      }
    }
  });

  if (Object.keys(pageSections).length > 0) {
    featuredListingData[parentPage] = {
      ...pageSections,
    };

    if (pageListingIds.length > 0) {
      // Deduplicate listing IDs by converting to strings, creating a Set, then back to UUID objects
      featuredListingData[parentPage].allListingIds = [
        ...new Set(pageListingIds.map(id => id.uuid)),
      ].map(uuid => new UUID(uuid));
    }
  }
  return featuredListingData;
};

// Generate featured listings data object
const generateFeaturedListingData = (parentPage, sectionId, allSections) => {
  const currentSection = getSectionBySectionId(allSections, sectionId);
  const listingSelection = currentSection.listingSelection;
  let featuredListingData = {};
  if (listingSelection === 'newest') {
    initialiseSectionData(allSections, featuredListingData, parentPage, 'newest');
  }
  if (listingSelection === 'manual') {
    initialiseSectionData(allSections, featuredListingData, parentPage, 'manual');
  }
  return featuredListingData;
};

// ================ Async Thunks ================ //

const fetchFeaturedListingsPayloadCreator = async (arg, thunkAPI) => {
  const { extra: sdk, rejectWithValue, dispatch } = thunkAPI;
  const { sectionId, parentPage, listingImageConfig, allSections } = arg;

  let queryParams = {};
  const featuredListingData = generateFeaturedListingData(parentPage, sectionId, allSections);
  const currentSection = getSectionBySectionId(allSections, sectionId);
  const listingSelection = currentSection.listingSelection;

  if (listingSelection === 'newest') {
    queryParams = {
      perPage: NUMBER_OF_NEWEST_LISTINGS,
      page: 1,
    };
  }

  if (listingSelection === 'manual') {
    const allListingIds = featuredListingData[parentPage].allListingIds;

    // Early return if no listings are selected
    if (allListingIds.length === 0) {
      return { featuredListingData: {}, listingData: {} };
    }

    queryParams = {
      ids: allListingIds.map(id => id.uuid).join(','),
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
      return {
        apiResponse: response,
        featuredListingData,
      };
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

// ================ Slice ================ //

const featuredListingsSlice = createSlice({
  name: 'featuredListings',
  initialState: {
    featuredListingData: {},
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFeaturedListings.pending, (state, action) => {
        const { parentPage, sectionId, allSections } = action.meta.arg;

        // Initialize featured listings data structure and mark as loading
        const featuredListingData = generateFeaturedListingData(parentPage, sectionId, allSections);
        Object.entries(featuredListingData[parentPage]).forEach(([sectionId, sectionData]) => {
          sectionData.fetched = false;
          sectionData.inProgress = true;
        });

        state.featuredListingData[parentPage] = {
          ...state.featuredListingData[parentPage],
          ...featuredListingData[parentPage],
        };
      })
      .addCase(fetchFeaturedListings.fulfilled, (state, action) => {
        const { apiResponse, featuredListingData } = action.payload;
        const { parentPage } = action.meta.arg;

        // Update data with fetched listings and mark as complete
        if (featuredListingData[parentPage]) {
          Object.entries(featuredListingData[parentPage]).forEach(([sectionId, sectionData]) => {
            sectionData.fetched = true;
            sectionData.inProgress = false;
            // For newest listings, populate with API response data
            if (sectionData?.selection === 'newest') {
              sectionData.listingIds = apiResponse.data.data.map(listing => listing.id);
            }
            if (sectionData?.selection === "manual") {
              // Filter out listing ids that were not succesfully returned by the API call
              const returnedListingIds = apiResponse.data.data.map(listing => listing.id.uuid);
              sectionData.listingIds = sectionData.listingIds.filter(id => 
                returnedListingIds.includes(id.uuid)
              );
            }
          });
        }

        state.featuredListingData[parentPage] = {
          ...state.featuredListingData[parentPage],
          ...featuredListingData[parentPage],
        };
      })
      .addCase(fetchFeaturedListings.rejected, (state, action) => {
        const { parentPage, allSections, sectionId } = action.meta.arg;

        const featuredListingData = generateFeaturedListingData(parentPage, sectionId, allSections);
        Object.entries(featuredListingData[parentPage]).forEach(([sectionId, sectionData]) => {
          sectionData.fetched = false;
          sectionData.inProgress = false;
          sectionData.error = action.payload;
        });

        state.featuredListingData[parentPage] = {
          ...state.featuredListingData[parentPage],
          ...featuredListingData[parentPage],
        };
      });
  },
});

export default featuredListingsSlice.reducer;
