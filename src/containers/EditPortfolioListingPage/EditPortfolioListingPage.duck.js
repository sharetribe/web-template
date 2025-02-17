// Action Types
import { createImageVariantConfig } from '../../util/sdkLoader';
import { PAGE_MODE_NEW } from '../BatchEditListingPage/constants';
import { LISTING_TYPES } from '../../util/types';

export const SET_USER_ID = 'app/EditPortfolioListingPage/SET_USER_ID';
export const FETCH_PORTFOLIO_REQUEST = 'app/EditPortfolioListingPage/FETCH_PORTFOLIO_REQUEST';
export const FETCH_PORTFOLIO_SUCCESS = 'app/EditPortfolioListingPage/FETCH_PORTFOLIO_SUCCESS';
export const FETCH_PORTFOLIO_ERROR = 'app/EditPortfolioListingPage/FETCH_PORTFOLIO_ERROR';
export const DRAFT_PORTFOLIO_REQUEST = 'app/EditPortfolioListingPage/DRAFT_PORTFOLIO_REQUEST';
export const DRAFT_PORTFOLIO_SUCCESS = 'app/EditPortfolioListingPage/DRAFT_PORTFOLIO_SUCCESS';
export const DRAFT_PORTFOLIO_ERROR = 'app/EditPortfolioListingPage/DRAFT_PORTFOLIO_ERROR';
export const UPLOAD_MEDIA_REQUEST = 'app/EditPortfolioListingPage/UPLOAD_MEDIA_REQUEST';
export const UPLOAD_MEDIA_SUCCESS = 'app/EditPortfolioListingPage/UPLOAD_MEDIA_SUCCESS';
export const UPLOAD_MEDIA_ERROR = 'app/EditPortfolioListingPage/UPLOAD_MEDIA_ERROR';
export const ADD_VIDEO_REQUEST = 'app/EditPortfolioListingPage/ADD_VIDEO_REQUEST';
export const ADD_VIDEO_SUCCESS = 'app/EditPortfolioListingPage/ADD_VIDEO_SUCCESS';
export const ADD_VIDEO_ERROR = 'app/EditPortfolioListingPage/ADD_VIDEO_ERROR';
export const REMOVE_UPLOADED_MEDIA = 'app/EditPortfolioListingPage/REMOVE_UPLOADED_MEDIA';
export const PUBLISH_LISTING_REQUEST = 'app/EditPortfolioListingPage/PUBLISH_LISTING_REQUEST';
export const PUBLISH_LISTING_SUCCESS = 'app/EditPortfolioListingPage/PUBLISH_LISTING_SUCCESS';
export const PUBLISH_LISTING_ERROR = 'app/EditPortfolioListingPage/PUBLISH_LISTING_ERROR';
export const RESET_PORTFOLIO_STATE = 'app/EditPortfolioListingPage/RESET_PORTFOLIO_STATE';
export const REMOVE_VIDEO_SUCCESS = 'app/EditPortfolioListingPage/REMOVE_VIDEO_SUCCESS';
export const REMOVE_IMAGE_SUCCESS = 'app/EditPortfolioListingPage/REMOVE_IMAGE_SUCCESS';

const initialState = {
  userId: null,
  portfolioListing: null,
  images: [],
  videos: [],
  loading: false,
  error: null,
  saving: false,
  saveError: null,
  uploading: false,
  uploadError: null,
  uploadedMedia: [],
  publishing: false,
  publishError: null,
};

const EditPortfolioListingPage = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_USER_ID:
      return { ...state, userId: payload };
    case FETCH_PORTFOLIO_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_PORTFOLIO_SUCCESS:
      return {
        ...state,
        loading: false,
        portfolioListing: payload,
        images: payload.images || [],
      };
    case FETCH_PORTFOLIO_ERROR:
      return { ...state, loading: false, error: payload };
    case DRAFT_PORTFOLIO_REQUEST:
      return { ...state, saving: true, saveError: null };
    case DRAFT_PORTFOLIO_SUCCESS:
      return { ...state, saving: false, portfolioListing: payload };
    case DRAFT_PORTFOLIO_ERROR:
      return { ...state, saving: false, saveError: payload };
    case UPLOAD_MEDIA_REQUEST:
      return { ...state, uploading: true, uploadError: null };
    case UPLOAD_MEDIA_SUCCESS:
      return { ...state, uploading: false, uploadedMedia: [...state.uploadedMedia, payload] };
    case UPLOAD_MEDIA_ERROR:
      return { ...state, uploading: false, uploadError: payload };
    case ADD_VIDEO_REQUEST:
      return { ...state, saving: true };
    case ADD_VIDEO_SUCCESS:
      return {
        ...state,
        saving: false,
        portfolioListing: {
          ...state.portfolioListing,
          attributes: {
            ...state.portfolioListing.attributes,
            publicData: {
              ...state.portfolioListing.attributes.publicData,
              videos: payload.attributes.publicData.videos,
            },
          },
        },
      };

    case ADD_VIDEO_ERROR:
      return { ...state, saving: false, saveError: payload };
    case REMOVE_UPLOADED_MEDIA:
      return { ...state, uploadedMedia: state.uploadedMedia.filter(media => media.id !== payload) };
    case PUBLISH_LISTING_REQUEST:
      return { ...state, publishing: true, publishError: null };
    case PUBLISH_LISTING_SUCCESS:
      return { ...state, publishing: false, portfolioListing: payload };
    case PUBLISH_LISTING_ERROR:
      return { ...state, publishing: false, publishError: payload };
    case RESET_PORTFOLIO_STATE:
      return {
        ...initialState,
        userId: state.userId,
      };

    case REMOVE_VIDEO_SUCCESS:
      return {
        ...state,
        portfolioListing: {
          ...state.portfolioListing,
          attributes: {
            ...state.portfolioListing.attributes,
            publicData: {
              ...state.portfolioListing.attributes.publicData,
              videos: state.portfolioListing.attributes.publicData.videos.filter(
                video => video.id !== action.payload
              ),
            },
          },
        },
      };

    case REMOVE_IMAGE_SUCCESS:
      return {
        ...state,
        uploadedMedia: state.uploadedMedia.filter(image => image.id !== action.payload),
        images: state.images.filter(image => image.id !== action.payload),
        portfolioListing: {
          ...state.portfolioListing,
          images: state.portfolioListing.images?.filter(image => image.id !== action.payload),
        },
      };

    default:
      return state;
  }
};

// Action Creators
export const setUserId = userId => ({ type: SET_USER_ID, payload: userId });
export const fetchPortfolioRequest = () => ({ type: FETCH_PORTFOLIO_REQUEST });
export const fetchPortfolioSuccess = portfolio => ({
  type: FETCH_PORTFOLIO_SUCCESS,
  payload: portfolio,
});
export const fetchPortfolioError = error => ({ type: FETCH_PORTFOLIO_ERROR, payload: error });

export const draftPortfolioRequest = () => ({ type: DRAFT_PORTFOLIO_REQUEST });
export const draftPortfolioSuccess = portfolio => ({
  type: DRAFT_PORTFOLIO_SUCCESS,
  payload: portfolio,
});
export const draftPortfolioError = error => ({ type: DRAFT_PORTFOLIO_ERROR, payload: error });

export const uploadMediaRequest = () => ({ type: UPLOAD_MEDIA_REQUEST });
export const uploadMediaSuccess = media => ({ type: UPLOAD_MEDIA_SUCCESS, payload: media });
export const uploadMediaError = error => ({ type: UPLOAD_MEDIA_ERROR, payload: error });

export const removeUploadedMedia = mediaId => ({ type: REMOVE_UPLOADED_MEDIA, payload: mediaId });

export const publishListingRequest = () => ({ type: PUBLISH_LISTING_REQUEST });
export const publishListingSuccess = listing => ({
  type: PUBLISH_LISTING_SUCCESS,
  payload: listing,
});
export const publishListingError = error => ({ type: PUBLISH_LISTING_ERROR, payload: error });
export const resetPortfolioState = () => ({ type: RESET_PORTFOLIO_STATE });
export const removeVideoSuccess = videoId => ({
  type: REMOVE_VIDEO_SUCCESS,
  payload: videoId,
});

export const removeImageSuccess = imageId => ({
  type: REMOVE_IMAGE_SUCCESS,
  payload: imageId,
});

// Thunks
// Load Data
export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const { id, mode } = params;
  dispatch(resetPortfolioState());

  if (mode === PAGE_MODE_NEW) {
    return Promise.resolve();
  }

  dispatch(fetchPortfolioRequest());
  const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
  const queryParams = {
    include: ['author', 'images'],
    'fields.image': imageVariantInfo.fieldsImage,
    ...imageVariantInfo.imageVariants,
  };
  return sdk.ownListings
    .show({ id, ...queryParams })
    .then(response => {
      const portfolioData = response.data.data;
      const included = response.data.included || [];
      const images = included
        .filter(item => item.type === 'image')
        .map(img => ({
          id: img.id.uuid,
          attributes: img.attributes || { variants: {} },
          type: 'imageAsset',
        }));

      dispatch(fetchPortfolioSuccess({ ...portfolioData, images }));
      return { ...portfolioData, images };
    })
    .catch(error => {
      dispatch(fetchPortfolioError(error));
      throw error;
    });
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

function getSdkRequestParams(config) {
  const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
  const queryParams = {
    expand: true,
    include: ['author', 'images'],
    'fields.image': imageVariantInfo.fieldsImage,
    ...imageVariantInfo.imageVariants,
  };
  return queryParams;
}

export function requestCreateListingDraft({ title }, config) {
  return (dispatch, getState, sdk) => {
    dispatch(draftPortfolioRequest());

    const listing = {
      title,
      publicData: {
        listingType: LISTING_TYPES.PORTFOLIO,
        transactionProcessAlias: 'default-purchase/release-1',
      },
    };

    const queryParams = getSdkRequestParams(config);
    return sdk.ownListings
      .createDraft(listing, queryParams)
      .then(response => {
        dispatch(draftPortfolioSuccess(response.data.data));
        return response.data.data;
      })
      .catch(e => {
        dispatch(draftPortfolioError(e));
        throw e;
      });
  };
}

export const updatePortfolioListing = data => (dispatch, getState, sdk) => {
  dispatch(draftPortfolioRequest());

  return sdk.ownListings
    .update(data)
    .then(response => {
      dispatch(draftPortfolioSuccess(response.data.data));
      return response.data.data;
    })
    .catch(e => {
      dispatch(draftPortfolioError(e));
      throw e;
    });
};

export const publishPortfolioListing = listingId => (dispatch, getState, sdk) => {
  dispatch(publishListingRequest());

  return sdk.ownListings
    .publishDraft({ id: listingId }, { expand: true })
    .then(response => {
      dispatch(publishListingSuccess(response.data.data));
      return response.data.data;
    })
    .catch(e => {
      console.error(e, 'publish-listing-failed');
      dispatch(publishListingError(e));
    });
};

export function uploadMedia(actionPayload, config) {
  return (dispatch, getState, sdk) => {
    const id = actionPayload.id;
    const imageVariantInfo = getImageVariantInfo(config.layout.listingImage);
    const queryParams = {
      expand: true,
      'fields.image': imageVariantInfo.fieldsImage,
      ...imageVariantInfo.imageVariants,
    };

    dispatch(uploadMediaRequest(actionPayload));

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

        const state = getState();
        const listingId = state.EditPortfolioListingPage.portfolioListing?.id;

        if (listingId) {
          return sdk.ownListings
            .addImage(
              { id: listingId, imageId: uploadedImage.imageId },
              {
                expand: true,
                include: ['images'],
              }
            )
            .catch(e => {
              console.error('Error adding image to listing:', e);
              dispatch(uploadMediaError({ id, error: e }));
            });
        }

        return uploadedImage;
      })
      .catch(e => {
        dispatch(uploadMediaError({ id, error: e }));
      });
  };
}

export const saveVideoToListing = (listingId, video, config) => (dispatch, getState, sdk) => {
  dispatch({ type: ADD_VIDEO_REQUEST });

  const state = getState();
  const existingVideos =
    state.EditPortfolioListingPage.portfolioListing?.attributes.publicData?.videos || [];
  const updatedVideos = [...existingVideos, video];
  const queryParams = getSdkRequestParams(config);

  return sdk.ownListings
    .update(
      {
        id: listingId,
        publicData: { videos: updatedVideos },
      },
      queryParams
    )
    .then(response => {
      dispatch({ type: ADD_VIDEO_SUCCESS, payload: response.data.data });
      return response.data.data;
    })
    .catch(error => {
      dispatch({ type: ADD_VIDEO_ERROR, payload: error });
      throw error;
    });
};

export const removeVideoFromListing = (listingId, videoId, config) => (dispatch, getState, sdk) => {
  const state = getState();
  const existingVideos =
    state.EditPortfolioListingPage.portfolioListing?.attributes?.publicData?.videos || [];
  const updatedVideos = existingVideos.filter(video => video.id !== videoId);
  const queryParams = getSdkRequestParams(config);

  return sdk.ownListings
    .update(
      {
        id: listingId,
        publicData: {
          videos: updatedVideos,
        },
      },
      queryParams
    )
    .then(response => {
      dispatch(removeVideoSuccess(videoId));
      return response.data.data;
    })
    .catch(error => {
      console.error('Error removing video:', error);
    });
};

export const removeImageFromListing = (listingId, imageId, config) => (dispatch, getState, sdk) => {
  const state = getState();
  const existingImages = state.EditPortfolioListingPage.images || [];
  const updatedImages = existingImages.filter(image => image.id !== imageId);
  const queryParams = getSdkRequestParams(config);

  return sdk.ownListings
    .update(
      {
        id: listingId,
        images: updatedImages,
      },
      queryParams
    )
    .then(response => {
      dispatch(removeImageSuccess(imageId));
      return response.data.data;
    })
    .catch(error => {
      console.error('Error removing image:', error);
    });
};

export default EditPortfolioListingPage;
