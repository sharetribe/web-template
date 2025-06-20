import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'landing-page';

// Add Custom sections IDs.
export const avHeroSecionId = 'av-hero';
export const avRecommendedsSectionId = 'av-recommendeds';
export const avSelectionsSectionId = 'av-selections';

import { createImageVariantConfig } from '../../util/sdkLoader';

// ================ Action types ================ //

// On Landing page assets success action.
export const FETCH_ASSETS_SUCCESS = 'app/LandingPage/FETCH_ASSETS_SUCCESS';
export const FETCH_SELECTIONS_SUCCESS = 'app/LandingPage/FETCH_SELECTIONS_SUCCESS';

// ================ Reducers ================ //
// The initial state used for custom sections.
const initialState = {
  recommendedListingIds: [],
  selectionsSections: {},
};
// Reducer to manage custom assets fetch.
export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_SELECTIONS_SUCCESS:
      return {
        ...state,
        selectionsSections: {
          ...state.selectionsSections,
          [payload.sectionId]: payload.ids,
        },
      };
    case FETCH_ASSETS_SUCCESS:
      return {
        ...state,
        recommendedListingIds: payload.recommendedIds,
      };
    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchAssetsSuccess = (recommendedIds) => ({
  type: FETCH_ASSETS_SUCCESS,
  payload: { recommendedIds },
});

export const fetchSelectionsListingsSuccess = (sectionId, ids) => ({
  type: FETCH_SELECTIONS_SUCCESS,
  payload: { sectionId, ids },
});

/**
 * Get the datea of the selections listings Custom Sections.
 * @param {Object} config COnfiguration settings for the section.
 * @param {Array} selectionIds The selections sections listing IDs.
 * @returns 
 */
export const getSelectionsListingParams = (config, selectionIds) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;

  const aspectRatio = aspectHeight / aspectWidth;

  return {
    ids: selectionIds,
    include: ['author', 'images'],
    'fields.listing': [
      'title',
      'price',
      'deleted',
      'state',
      'publicData.transactionProcessAlias',
      'publicData.brand',
      'publicData.talla'
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName', 'profile.image', 'profile.publicData', 'profile.metadata'],
    'fields.image': [
      'variants.scaled-small',
      'variants.scaled-medium',
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    'limit.images': 1,
  };
};

/**
 * Get the data of the recommended listings Custom Section.
 * @param {Object} config 
 * @param {Array} listingIds 
 * @returns 
 */
export const getRecommendedListingParams = (config, listingIds) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;

  const aspectRatio = aspectHeight / aspectWidth;

  return {
    ids: listingIds,
    include: ['author', 'images'],
    'fields.listing': [
      'title',
      'price',
      'deleted',
      'state',
      'publicData.transactionProcessAlias'
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': [
      'variants.scaled-small',
      'variants.scaled-medium',
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    'limit.images': 1,
  };
};

// Load data to get Custom Sections data.
export const loadData = (params, search) => dispatch => {
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true))
    .then(assetResp => {
      // Get listing ids from custom recommended listings section.
      const customSection = assetResp.landingPage?.data?.sections.find(
        s => s.sectionId === avRecommendedsSectionId
      );
      if (customSection) {
        const listingIds = customSection?.blocks.map(b => b.blockName) ?? [];
        dispatch(fetchAssetsSuccess(listingIds));
      }

      // Get section ID and its listing ids from custom selections listings section.
      const customSections = assetResp.landingPage?.data?.sections.filter(
        s => s.sectionId?.indexOf(avSelectionsSectionId) === 0
      );
      if (customSections) {
        customSections.forEach(section => {
          const listingIds = section?.blocks.map(b => b.blockName) ?? [];
          dispatch(fetchSelectionsListingsSuccess(section.sectionId, listingIds));
        });
      }
    });
};
