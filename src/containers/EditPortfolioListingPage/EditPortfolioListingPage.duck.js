import { createImageVariantConfig } from '../../util/sdkLoader';
import { PAGE_MODE_NEW } from '../BatchEditListingPage/constants';
import { LISTING_TYPES } from '../../util/types';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

// Return an array of image ids
const imageIds = images => {
  // For newly uploaded image the UUID can be found from "img.imageId"
  // and for existing listing images the id is "img.id"
  return images ? images.map(img => img.imageId || img.id) : null;
};

const getImageVariantInfo = listingImageConfig => {
  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = listingImageConfig;
  const aspectRatio = aspectHeight / aspectWidth;
  const fieldsImage = [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`];

  return {
    fieldsImage,
    imageVariants: {
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    },
  };
};

function getSdkRequestParams(config, ignoreImages = false) {
  const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
  const queryParams = {
    expand: true,
    ...(ignoreImages ? {} : { include: ['images'] }),
    'fields.image': imageVariantInfo.fieldsImage,
    ...imageVariantInfo.imageVariants,
  };
  return queryParams;
}

// ================ Action types ================ //

export const RESET_PORTFOLIO_STATE = 'app/EditPortfolioListingPage/RESET_PORTFOLIO_STATE';

export const FETCH_PORTFOLIO_REQUEST = 'app/EditPortfolioListingPage/FETCH_PORTFOLIO_REQUEST';
export const FETCH_PORTFOLIO_SUCCESS = 'app/EditPortfolioListingPage/FETCH_PORTFOLIO_SUCCESS';
export const FETCH_PORTFOLIO_ERROR = 'app/EditPortfolioListingPage/FETCH_PORTFOLIO_ERROR';

export const DRAFT_PORTFOLIO_REQUEST = 'app/EditPortfolioListingPage/DRAFT_PORTFOLIO_REQUEST';
export const DRAFT_PORTFOLIO_SUCCESS = 'app/EditPortfolioListingPage/DRAFT_PORTFOLIO_SUCCESS';
export const DRAFT_PORTFOLIO_ERROR = 'app/EditPortfolioListingPage/DRAFT_PORTFOLIO_ERROR';

export const PUBLISH_LISTING_REQUEST = 'app/EditPortfolioListingPage/PUBLISH_LISTING_REQUEST';
export const PUBLISH_LISTING_SUCCESS = 'app/EditPortfolioListingPage/PUBLISH_LISTING_SUCCESS';
export const PUBLISH_LISTING_ERROR = 'app/EditPortfolioListingPage/PUBLISH_LISTING_ERROR';

export const UPDATE_LISTING_MEDIA_REQUEST =
  'app/EditPortfolioListingPage/UPDATE_LISTING_MEDIA_REQUEST';
export const UPDATE_LISTING_MEDIA_SUCCESS =
  'app/EditPortfolioListingPage/UPDATE_LISTING_MEDIA_SUCCESS';
export const UPDATE_LISTING_MEDIA_ERROR = 'app/EditPortfolioListingPage/UPDATE_LISTING_MEDIA_ERROR';

export const UPLOAD_MEDIA_REQUEST = 'app/EditPortfolioListingPage/UPLOAD_MEDIA_REQUEST';
export const UPLOAD_MEDIA_SUCCESS = 'app/EditPortfolioListingPage/UPLOAD_MEDIA_SUCCESS';
export const UPLOAD_MEDIA_ERROR = 'app/EditPortfolioListingPage/UPLOAD_MEDIA_ERROR';

export const ADD_VIDEO_SUCCESS = 'app/EditPortfolioListingPage/ADD_VIDEO_SUCCESS';

export const REMOVE_IMAGE_SUCCESS = 'app/EditPortfolioListingPage/REMOVE_IMAGE_SUCCESS';
export const REMOVE_VIDEO_SUCCESS = 'app/EditPortfolioListingPage/REMOVE_VIDEO_SUCCESS';

// ================ Reducer ================ //

const initialState = {
  portfolioListing: null,
  images: [],
  videos: [],
  loading: false,
  error: null,
  saving: false,
  saveError: null,
  publishing: false,
  publishError: null,
  updating: false,
  updateError: null,
  uploading: false,
  uploadError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case RESET_PORTFOLIO_STATE:
      return { ...initialState };
    case FETCH_PORTFOLIO_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_PORTFOLIO_SUCCESS:
      return {
        ...state,
        loading: false,
        portfolioListing: payload.portfolioListing,
        images: payload.images,
        videos: payload.videos,
      };
    case FETCH_PORTFOLIO_ERROR:
      return { ...state, loading: false, error: payload };

    case DRAFT_PORTFOLIO_REQUEST:
      return { ...state, saving: true, saveError: null };
    case DRAFT_PORTFOLIO_SUCCESS:
      return { ...state, saving: false, portfolioListing: payload };
    case DRAFT_PORTFOLIO_ERROR:
      return { ...state, saving: false, saveError: payload };

    case PUBLISH_LISTING_REQUEST:
      return { ...state, publishing: true, publishError: null };
    case PUBLISH_LISTING_SUCCESS:
      return { ...state, publishing: false, portfolioListing: payload };
    case PUBLISH_LISTING_ERROR:
      return { ...state, publishing: false, publishError: payload };

    case UPDATE_LISTING_MEDIA_REQUEST:
      return { ...state, updating: true, updateError: null };
    case UPDATE_LISTING_MEDIA_SUCCESS:
      return { ...state, updating: false, portfolioListing: payload };
    case UPDATE_LISTING_MEDIA_ERROR:
      return { ...state, updating: false, updateError: payload };

    case UPLOAD_MEDIA_REQUEST:
      return { ...state, uploading: true, uploadError: null };
    case UPLOAD_MEDIA_SUCCESS:
      return { ...state, uploading: false, images: [...state.images, payload] };
    case UPLOAD_MEDIA_ERROR:
      return { ...state, uploading: false, uploadError: payload };

    case ADD_VIDEO_SUCCESS:
      return { ...state, videos: [...state.videos, payload] };

    case REMOVE_IMAGE_SUCCESS:
      return {
        ...state,
        images: state.images.filter(image => image.id !== action.payload),
      };
    case REMOVE_VIDEO_SUCCESS:
      return {
        ...state,
        videos: state.videos.filter(video => video.id !== action.payload),
      };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const resetPortfolioState = () => ({ type: RESET_PORTFOLIO_STATE });

export const fetchPortfolioRequest = () => ({ type: FETCH_PORTFOLIO_REQUEST });
export const fetchPortfolioSuccess = payload => ({ type: FETCH_PORTFOLIO_SUCCESS, payload });
export const fetchPortfolioError = error => ({ type: FETCH_PORTFOLIO_ERROR, payload: error });

export const draftPortfolioRequest = () => ({ type: DRAFT_PORTFOLIO_REQUEST });
export const draftPortfolioSuccess = payload => ({ type: DRAFT_PORTFOLIO_SUCCESS, payload });
export const draftPortfolioError = error => ({ type: DRAFT_PORTFOLIO_ERROR, payload: error });

export const publishListingRequest = () => ({ type: PUBLISH_LISTING_REQUEST });
export const publishListingSuccess = payload => ({ type: PUBLISH_LISTING_SUCCESS, payload });
export const publishListingError = error => ({ type: PUBLISH_LISTING_ERROR, payload: error });

export const updateListingMediaRequest = () => ({ type: UPDATE_LISTING_MEDIA_REQUEST });
export const updateListingMediaSuccess = payload => ({
  type: UPDATE_LISTING_MEDIA_SUCCESS,
  payload,
});
export const updateListingMediaError = error => ({
  type: UPDATE_LISTING_MEDIA_ERROR,
  payload: error,
});

export const uploadMediaRequest = () => ({ type: UPLOAD_MEDIA_REQUEST });
export const uploadMediaSuccess = media => ({ type: UPLOAD_MEDIA_SUCCESS, payload: media });
export const uploadMediaError = error => ({ type: UPLOAD_MEDIA_ERROR, payload: error });

export const addVideoSuccess = video => ({ type: ADD_VIDEO_SUCCESS, payload: video });

export const removeImageSuccess = imageId => ({ type: REMOVE_IMAGE_SUCCESS, payload: imageId });
export const removeVideoSuccess = videoId => ({ type: REMOVE_VIDEO_SUCCESS, payload: videoId });

// ================ Thunk ================ //

export function requestCreateListingDraft(title) {
  return (dispatch, getState, sdk) => {
    dispatch(draftPortfolioRequest());
    const listing = {
      title,
      publicData: {
        listingType: LISTING_TYPES.PORTFOLIO,
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
      },
    };
    return sdk.ownListings
      .createDraft(listing)
      .then(response => {
        const portfolioListing = response.data.data;
        dispatch(draftPortfolioSuccess(portfolioListing));
        return portfolioListing;
      })
      .catch(e => {
        dispatch(draftPortfolioError(e));
        throw e;
      });
  };
}

export const updatePortfolioListing = (data, config) => (dispatch, getState, sdk) => {
  dispatch(draftPortfolioRequest());
  const queryParams = getSdkRequestParams(config);
  return sdk.ownListings
    .update(data, queryParams)
    .then(response => {
      const portfolioListing = response.data.data;
      dispatch(draftPortfolioSuccess(portfolioListing));
      dispatch(addMarketplaceEntities(response));
      return portfolioListing;
    })
    .catch(e => {
      dispatch(draftPortfolioError(e));
      throw e;
    });
};

export const publishPortfolioListing = listingId => (dispatch, getState, sdk) => {
  dispatch(publishListingRequest());
  return sdk.ownListings
    .publishDraft({ id: listingId })
    .then(response => {
      const portfolioListing = response.data.data;
      dispatch(publishListingSuccess(portfolioListing));
      return portfolioListing;
    })
    .catch(e => {
      console.error(e, 'publish-listing-failed');
      dispatch(publishListingError(e));
    });
};

export function updateListingMedia(data, config) {
  return (dispatch, getState, sdk) => {
    dispatch(updateListingMediaRequest(data));
    const { id, images, videos } = data;
    const videoProperty = { publicData: { videos } };
    const imageProperty = { images: imageIds(images) };
    const ownListingUpdateValues = { id, ...imageProperty, ...videoProperty };
    const queryParams = getSdkRequestParams(config);
    return sdk.ownListings
      .update(ownListingUpdateValues, queryParams)
      .then(response => {
        const portfolioListing = response.data.data;
        dispatch(updateListingMediaSuccess(portfolioListing));
        dispatch(addMarketplaceEntities(response));
        return portfolioListing;
      })
      .catch(e => {
        dispatch(updateListingMediaError({ id, error: e }));
      });
  };
}

export function uploadMedia(actionPayload, config) {
  return (dispatch, getState, sdk) => {
    const id = actionPayload.id;
    const queryParams = getSdkRequestParams(config, true);
    dispatch(uploadMediaRequest());
    return sdk.images
      .upload({ image: actionPayload.file }, queryParams)
      .then(resp => {
        const img = resp.data.data;
        const uploadedImage = {
          ...img,
          id,
          imageId: img.id,
          file: actionPayload.file,
        };
        dispatch(uploadMediaSuccess(uploadedImage));
        return uploadedImage;
      })
      .catch(e => {
        dispatch(uploadMediaError({ id, error: e }));
      });
  };
}

export const saveVideoToListing = video => dispatch => {
  dispatch(addVideoSuccess(video));
};

export const removeImageFromListing = imageId => dispatch => {
  dispatch(removeImageSuccess(imageId));
};

export const removeVideoFromListing = videoId => dispatch => {
  dispatch(removeVideoSuccess(videoId));
};

// Load Data
export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const { id, mode } = params;
  dispatch(resetPortfolioState());
  if (mode === PAGE_MODE_NEW) {
    return Promise.resolve();
  }
  dispatch(fetchPortfolioRequest());
  const queryParams = getSdkRequestParams(config);
  return sdk.ownListings
    .show({ id, ...queryParams })
    .then(response => {
      const portfolioListing = response.data.data;
      const included = response.data.included || [];
      const images =
        included
          .filter(item => item.type === 'image')
          .map(img => ({
            id: img.id.uuid,
            attributes: img.attributes || { variants: {} },
            type: 'imageAsset',
          })) || [];

      const videos = portfolioListing?.attributes?.publicData?.videos || [];
      dispatch(fetchPortfolioSuccess({ portfolioListing, images, videos }));
      return { ...portfolioListing, images, videos };
    })
    .catch(error => {
      dispatch(fetchPortfolioError(error));
      throw error;
    });
};
