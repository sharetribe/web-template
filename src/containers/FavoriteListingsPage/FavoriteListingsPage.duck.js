import { storableError } from '../../util/errors';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { parse } from '../../util/urlHelpers';

import { RESULT_PAGE_SIZE } from '../ManageListingsPage/ManageListingsPage.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Action types ================ //

export const FETCH_LISTINGS_REQUEST = 'app/FavoriteListingsPage/FETCH_LISTINGS_REQUEST';
export const FETCH_LISTINGS_SUCCESS = 'app/FavoriteListingsPage/FETCH_LISTINGS_SUCCESS';
export const FETCH_LISTINGS_ERROR = 'app/FavoriteListingsPage/FETCH_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  pagination: null,
  queryParams: {},
  queryInProgress: false,
  queryFavoritesError: null,
  currentPageResultIds: [],
};
const resultIds = data => data.data.map(l => l.id);
const favoriteListingsPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_LISTINGS_REQUEST:
      return {
        ...state,
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryFavoritesError: null,
        currentPageResultIds: [],
      };
    case FETCH_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        pagination: payload.data.meta,
        queryInProgress: false,
      };
    case FETCH_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return {
        ...state,
        queryInProgress: false,
        queryFavoritesError: payload,
      };

    default:
      return state;
  }
};
export default favoriteListingsPageReducer;

// ================ Action creators ================ //

export const queryFavoritesRequest = queryParams => ({
  type: FETCH_LISTINGS_REQUEST,
  payload: { queryParams },
});

export const queryFavoritesSuccess = response => ({
  type: FETCH_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const queryFavoritesError = e => ({
  type: FETCH_LISTINGS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

const createFavoriteBatches = favorites => {
  const batches = [];
  for (let i = 0; i < favorites.length; i += RESULT_PAGE_SIZE) {
    batches.push(favorites.slice(i, i + RESULT_PAGE_SIZE));
  }
  return batches;
};

// Throwing error for new (loadData may need that info)
export const queryFavoriteListings = queryParams => (dispatch, getState, sdk) => {
  dispatch(queryFavoritesRequest(queryParams));
  const { currentUser } = getState().user;
  const favorites = currentUser?.attributes.profile.privateData?.favorites || {};
  const listingType = queryParams.pub_listingType;
  const validRequestParams = !!listingType;
  const parsedFavorites = favorites[listingType] || [];
  const withFavorites = !!parsedFavorites.length;
  const shouldRequest = withFavorites && validRequestParams;

  if (!shouldRequest) {
    const emptyObject = {
      data: {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 1,
          page: 1,
          paginationLimit: 1,
          perPage: RESULT_PAGE_SIZE,
        },
      },
    };
    dispatch(queryFavoritesSuccess(emptyObject));
    return emptyObject;
  }

  const favoriteBatches = createFavoriteBatches(parsedFavorites);
  const { perPage, page, ...rest } = queryParams;
  const idsBatch = { ids: favoriteBatches[page - 1] };
  // Overwrite the 'page' value because we're doing a FE pagination mix
  const params = { ...idsBatch, ...rest, perPage, page: 1 };
  return sdk.listings
    .query(params)
    .then(response => {
      const meta = {
        totalItems: parsedFavorites.length,
        totalPages: favoriteBatches.length,
        page,
        paginationLimit: favoriteBatches.length,
        perPage: RESULT_PAGE_SIZE,
      };
      const result = {
        data: {
          data: response?.data?.data,
          included: response?.data?.included,
          meta,
        },
      };
      dispatch(addMarketplaceEntities(result));
      dispatch(queryFavoritesSuccess(result));
      return result;
    })
    .catch(e => {
      dispatch(queryFavoritesError(storableError(e)));
      throw e;
    });
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(
      queryFavoriteListings({
        ...queryParams,
        page,
        perPage: RESULT_PAGE_SIZE,
        include: ['author', 'author.profileImage', 'images'],
        'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
        'fields.image': [
          'variants.scaled-medium',
          `variants.${variantPrefix}`,
          `variants.${variantPrefix}-2x`,
        ],
        ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
        ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
        'limit.images': 1,
      })
    ),
  ]);
};
