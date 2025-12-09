import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as log from '../util/log';
import { storableError } from '../util/errors';
import { addMarketplaceEntities } from './marketplaceData.duck';
import { types as sdkTypes } from '../util/sdkLoader';
import { createImageVariantConfig } from '../util/sdkLoader';

const { UUID } = sdkTypes;

// ================ HELPERS ==================== //

const getSectionBySectionId = (sections, sectionId) => {
  const sectionNumber = parseInt(sectionId.replace('section-', ''));
  const sectionIndex = sectionNumber - 1;
  return sections[sectionIndex];
};

const getSectionKey = sectionIndex => `section-${sectionIndex + 1}`;
const isListingsSection = section => section.sectionType === 'listings';
const limitListingNumber = (selectedListings, maxListings = 2) => {
  return selectedListings.slice(0, maxListings);
};

const initialiseSectionData = (pageAssetsData, featuredListingData, selectionType) => {
  Object.entries(pageAssetsData).forEach(([pageName, pageData]) => {
    const sections = pageData?.data?.sections || [];
    const pageListingIds = [];
    const pageSections = {};

    sections.forEach((section, sectionIndex) => {
      if (isListingsSection(section) && section.listingSelection === selectionType) {
        const sectionKey = getSectionKey(sectionIndex);

        if (selectionType === 'newest') {
          pageSections[sectionKey] = {
            selection: 'newest',
            listingIds: [],
            fetched: false,
          };
        } else if (selectionType === 'manual' && section.selectedListings) {
          const listingIds = limitListingNumber(section.selectedListings).map(listing => new UUID(listing.listingId));
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
      featuredListingData[pageName] = {
        ...pageSections,
      };

      if (pageListingIds.length > 0) {
        featuredListingData[pageName].allListingIds = [...new Set(pageListingIds)];
      }
    }
  });

  return featuredListingData;
};

// ================ Async Thunks ================ //

const fetchFeaturedListingsPayloadCreator = async (arg, thunkAPI) => {
  const { extra: sdk, rejectWithValue, dispatch, getState } = thunkAPI;
  const { sectionId, parentPage, listingImageConfig } = arg;

  let queryParams = {};
  const featuredListingData = {};

  const pageAssetsData = getState().hostedAssets.pageAssetsData;
  const currentSection = getSectionBySectionId(pageAssetsData[parentPage].data.sections, sectionId);

  const listingSelection = currentSection.listingSelection;

  // in general this function shouldn't be triggered if we already have the data TBH but maybe have it here as a catchall?
  if (listingSelection === 'newest') {
    initialiseSectionData(pageAssetsData, featuredListingData, 'newest');
    queryParams = {
      perPage: 10,
      page: 1,
    };
  }

  if (listingSelection === 'manual') {
    initialiseSectionData(pageAssetsData, featuredListingData, 'manual');

    // Collect all unique listing IDs across all pages and sections
    const allListingIds = [
      ...new Set(Object.values(featuredListingData).flatMap(page => page.allListingIds || [])),
    ];

    if (allListingIds.length === 0) {
      return { featuredListingData: {}, listingData: {} };
    }

    queryParams = {
      ids: allListingIds.map(id => id.uuid).join(','),
    };
  }

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImageConfig;
  const aspectRatio = aspectHeight / aspectWidth;

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
      log.error(error, 'featured-listings-fetch-failed');
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
    inProgress: false,
    error: null,
    fetched: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFeaturedListings.pending, (state, action) => {
        const { parentPage, sectionId } = action.meta.arg;

        state.featuredListingData[parentPage] = {
          ...state.featuredListingData[parentPage],
          inProgress: true,
          [sectionId]: {
            inProgress: true,
          },
        };
      })
      .addCase(fetchFeaturedListings.fulfilled, (state, action) => {
        const { apiResponse, featuredListingData } = action.payload;
        const { parentPage } = action.meta.arg;

        // Only process the specific parent page, not all pages
        if (featuredListingData[parentPage]) {
          Object.entries(featuredListingData[parentPage]).forEach(([sectionId, sectionData]) => {
            sectionData.fetched = true;
            sectionData.inProgress = false;
            if (sectionData?.selection === 'newest') {
              sectionData.listingIds = apiResponse.data.data.map(listing => listing.id);
            }
          });
        }

        state.featuredListingData[parentPage] = {
          ...state.featuredListingData[parentPage],
          ...featuredListingData[parentPage],
          inProgress: false,
        };
      })
      .addCase(fetchFeaturedListings.rejected, (state, action) => {
        const { parentPage } = action.meta.arg;

        if (state.featuredListingData[parentPage]) {
          state.featuredListingData[parentPage].inProgress = false;
        }

        state.error = action.payload;
      });
  },
});

export default featuredListingsSlice.reducer;
