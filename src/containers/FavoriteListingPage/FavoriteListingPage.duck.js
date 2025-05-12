import { storableError } from '../../util/errors';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { parse } from '../../util/urlHelpers';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 42 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 42;

// ================ Action types ================ //

export const FETCH_LISTINGS_REQUEST = 'app/FavoriteListingPage/FETCH_LISTINGS_REQUEST';
export const FETCH_LISTINGS_SUCCESS = 'app/FavoriteListingPage/FETCH_LISTINGS_SUCCESS';
export const FETCH_LISTINGS_ERROR = 'app/FavoriteListingPage/FETCH_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  pagination: null,
  queryParams: null,
  queryInProgress: false,
  queryFavoritesError: null,
  currentPageResultIds: [],
};

const resultIds = data => data.data.map(l => l.id);

const FavoriteListingPageReducer = (state = initialState, action = {}) => {
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
        queryFavoritesError: payload
      };

    default:
      return state;
  }
};

export default FavoriteListingPageReducer;

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

// Throwing error for new (loadData may need that info)
export const queryFavoriteListing = queryParams => (dispatch, getState, sdk) => {
  dispatch(queryFavoritesRequest(queryParams));
  const { currentUser } = getState().user;
  const { favorites } = currentUser?.attributes.profile.privateData || {};

  const validFavorites = Array.isArray(favorites)
  ? favorites.filter(id => typeof id === 'string' && id.length > 0)
  : [];

if (validFavorites.length === 0) {
  // Early return: no valid favorites to query
  const emptyResponse = { data: [], meta: { page: 1, perPage: 0, totalItems: 0, totalPages: 0 } };
  dispatch(queryFavoritesSuccess(emptyResponse));
  return Promise.resolve(emptyResponse);
}

const favoritesMaybe = { ids: validFavorites };

  const { perPage, ...rest } = queryParams;
  const params = { ...favoritesMaybe, ...rest, perPage };

  return sdk.listings
    .query(params)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(queryFavoritesSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(queryFavoritesError(storableError(e)));
      throw e;
    });
};

export const loadData = (params, search, config) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return queryFavoriteListing({
    ...queryParams,
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['images'],
    'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    'limit.images': 1,
  });
};