import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { types as sdkTypes, util as sdkUtil } from '../../util/sdkLoader';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const QUERY_LISTINGS_REQUEST = 'app/ProfilePage/QUERY_LISTINGS_REQUEST';
export const QUERY_LISTINGS_SUCCESS = 'app/ProfilePage/QUERY_LISTINGS_SUCCESS';
export const QUERY_LISTINGS_ERROR = 'app/ProfilePage/QUERY_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  userListingRefs: [],
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
};

export default function CMSPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case QUERY_LISTINGS_REQUEST:
      return {
        ...state,
        // Retain listings only if the userId is the same, otherwise reset
        userListingRefs: payload.userId === state.userId ? state.userListingRefs : [],
        queryListingsError: null,
      };

    case QUERY_LISTINGS_SUCCESS:
      return {
        ...state,
        userListingRefs: payload.listingRefs,
      };

    case QUERY_LISTINGS_ERROR:
      return {
        ...state,
        userListingRefs: [],
        queryListingsError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const queryListingsRequest = (userId) => ({
  type: QUERY_LISTINGS_REQUEST,
  payload: { userId },
});

export const queryListingsSuccess = (listingRefs) => ({
  type: QUERY_LISTINGS_SUCCESS,
  payload: { listingRefs },
});

export const queryListingsError = (e) => ({
  type: QUERY_LISTINGS_ERROR,
  error: true,
  payload: e,
});

// ================ Helper functions ================ //

const createImageVariantConfig = (name, width, aspectRatio) => {
  let variantWidth = width;
  let variantHeight = Math.round(aspectRatio * width);

  if (variantWidth > 3072 || variantHeight > 3072) {
    if (variantHeight > 3072) {
      variantHeight = 3072;
      variantWidth = Math.round(variantHeight / aspectRatio);
    } else if (variantWidth > 3072) {
      variantWidth = 3072;
      variantHeight = Math.round(aspectRatio * variantWidth);
    }
  }

  return {
    [`imageVariant.${name}`]: sdkUtil.objectQueryString({
      w: variantWidth,
      h: variantHeight,
      fit: 'crop',
    }),
  };
};

// ================ Thunk ================ //

export const loadData = (params, search) => (dispatch) => {
  const { pageId } = params;
  const pageAsset = { [pageId]: `content/pages/${pageId}.json` };
  const hasFallbackContent = false;

  return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
};

export const queryUserListings = () => (dispatch, getState, sdk) => {
  const userId = '65e30f93-52f8-4eed-b68c-e19719cc0c6c';
  dispatch(queryListingsRequest(userId));

  const variantPrefix = 'listing-card';
  const aspectRatio = 1.5;

  const queryParams = {
    include: ['author', 'images'],
    'fields.image': [
      // Scaled variants for large images
      'variants.scaled-small',
      'variants.scaled-medium',
      'variants.scaled-large',
      'variants.scaled-xlarge',

      // Cropped variants for listing thumbnail images
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
      `variants.${variantPrefix}-4x`,
      `variants.${variantPrefix}-6x`,

      // Social media
      'variants.facebook',
      'variants.twitter',

      // Avatars
      'variants.square-small',
      'variants.square-small2x',
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-4x`, 1600, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-6x`, 2400, aspectRatio),
  };

  const listingsPromise = sdk.listings.query({
    author_id: userId,
    ...queryParams,
  });

  return listingsPromise
    .then((response) => {
      const listings = response.data.data;
      const listingRefs = listings
        .filter((l) => !l.attributes.deleted && l.attributes.state === 'published')
        .map(({ id, type, attributes, relationships }) => ({
          id,
          type,
          attributes,
          relationships,
        }));

      dispatch(queryListingsSuccess(listingRefs));
      return response;
    })
    .catch((e) => dispatch(queryListingsError(e)));
};
