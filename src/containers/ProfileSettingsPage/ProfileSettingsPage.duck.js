import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { currentUserShowSuccess } from '../../ducks/user.duck';

const uploadShopMedia = async (shopMedia, getState) => {
  const { currentUser } = getState().user;
  try {
    if (shopMedia) {
      const response = await Promise.allSettled(
        shopMedia.map(async media => {
          try {
            if (!media.presignedInfo) {
              return {
                url: media.url,
                id: media.id,
              };
            }
            await window.fetch(media.presignedInfo.url, {
              method: 'PUT',
              body: media.file,
              headers: {
                'If-Unmodified-Since': 'Tue, 28 Sep 2021 16:00:00 GMT',
              },
            });
            const mediaId = encodeURIComponent(media.id);
            const url = `${process.env.REACT_APP_R2_PUBLIC_DOMAIN}/shopMedia/${currentUser.id.uuid}/${mediaId}`;
            return {
              id: mediaId,
              url,
            };
          } catch (error) {
            console.error(error);
            return null;
          }
        })
      );
      return response.filter(r => r.status === 'fulfilled').map(r => r.value);
    }
    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ================ Action types ================ //

export const CLEAR_UPDATED_FORM = 'app/ProfileSettingsPage/CLEAR_UPDATED_FORM';

export const UPLOAD_IMAGE_REQUEST = 'app/ProfileSettingsPage/UPLOAD_IMAGE_REQUEST';
export const UPLOAD_IMAGE_SUCCESS = 'app/ProfileSettingsPage/UPLOAD_IMAGE_SUCCESS';
export const UPLOAD_IMAGE_ERROR = 'app/ProfileSettingsPage/UPLOAD_IMAGE_ERROR';

export const UPDATE_PROFILE_REQUEST = 'app/ProfileSettingsPage/UPDATE_PROFILE_REQUEST';
export const UPDATE_PROFILE_SUCCESS = 'app/ProfileSettingsPage/UPDATE_PROFILE_SUCCESS';
export const UPDATE_PROFILE_ERROR = 'app/ProfileSettingsPage/UPDATE_PROFILE_ERROR';

// ================ Reducer ================ //

const initialState = {
  image: null,
  uploadImageError: null,
  uploadInProgress: false,
  updateInProgress: false,
  updateProfileError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case UPLOAD_IMAGE_REQUEST:
      // payload.params: { id: 'tempId', file }
      return {
        ...state,
        image: { ...payload.params },
        uploadInProgress: true,
        uploadImageError: null,
      };
    case UPLOAD_IMAGE_SUCCESS: {
      // payload: { id: 'tempId', uploadedImage }
      const { id, uploadedImage } = payload;
      const { file } = state.image || {};
      const image = { id, imageId: uploadedImage.id, file, uploadedImage };
      return { ...state, image, uploadInProgress: false };
    }
    case UPLOAD_IMAGE_ERROR: {
      // eslint-disable-next-line no-console
      return { ...state, image: null, uploadInProgress: false, uploadImageError: payload.error };
    }

    case UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        updateInProgress: true,
        updateProfileError: null,
      };
    case UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        image: null,
        updateInProgress: false,
      };
    case UPDATE_PROFILE_ERROR:
      return {
        ...state,
        image: null,
        updateInProgress: false,
        updateProfileError: payload,
      };

    case CLEAR_UPDATED_FORM:
      return { ...state, updateProfileError: null, uploadImageError: null };

    default:
      return state;
  }
}

// ================ Selectors ================ //

// ================ Action creators ================ //

export const clearUpdatedForm = () => ({
  type: CLEAR_UPDATED_FORM,
});

// SDK method: images.upload
export const uploadImageRequest = params => ({ type: UPLOAD_IMAGE_REQUEST, payload: { params } });
export const uploadImageSuccess = result => ({ type: UPLOAD_IMAGE_SUCCESS, payload: result.data });
export const uploadImageError = error => ({
  type: UPLOAD_IMAGE_ERROR,
  payload: error,
  error: true,
});

// SDK method: sdk.currentUser.updateProfile
export const updateProfileRequest = params => ({
  type: UPDATE_PROFILE_REQUEST,
  payload: { params },
});
export const updateProfileSuccess = result => ({
  type: UPDATE_PROFILE_SUCCESS,
  payload: result.data,
});
export const updateProfileError = error => ({
  type: UPDATE_PROFILE_ERROR,
  payload: error,
  error: true,
});

// ================ Thunk ================ //

// Images return imageId which we need to map with previously generated temporary id
export function uploadImage(actionPayload) {
  return (dispatch, getState, sdk) => {
    const id = actionPayload.id;
    dispatch(uploadImageRequest(actionPayload));

    const bodyParams = {
      image: actionPayload.file,
    };
    const queryParams = {
      expand: true,
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    };

    return sdk.images
      .upload(bodyParams, queryParams)
      .then(resp => {
        const uploadedImage = resp.data.data;
        dispatch(uploadImageSuccess({ data: { id, uploadedImage } }));
      })
      .catch(e => dispatch(uploadImageError({ id, error: storableError(e) })));
  };
}

const formatPayload = async (payload, getState) => {
  const { publicData } = payload;
  const { shopMedia } = publicData;
  console.log({ publicData });
  const uploadedShopMedia = shopMedia ? await uploadShopMedia(shopMedia, getState) : [];
  return {
    ...payload,
    publicData: {
      ...publicData,
      shopMedia: uploadedShopMedia,
    },
  };
};

export const updateProfile = actionPayload => {
  return async (dispatch, getState, sdk) => {
    dispatch(updateProfileRequest());

    const queryParams = {
      expand: true,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    };

    const formattedPayload = await formatPayload(actionPayload, getState);

    return sdk.currentUser
      .updateProfile(formattedPayload, queryParams)
      .then(response => {
        dispatch(updateProfileSuccess(response));

        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
        }
        const currentUser = entities[0];

        // Update current user in state.user.currentUser through user.duck.js
        dispatch(currentUserShowSuccess(currentUser));
      })
      .catch(e => dispatch(updateProfileError(storableError(e))));
  };
};
