import { fetchCurrentUser } from '../../ducks/user.duck';
import { getFileMetadata } from '../../util/file-metadata';
import axios from 'axios';
import { Money } from 'sharetribe-flex-sdk/src/types';

const SMALL_IMAGE = 'small';
const MEDIUM_IMAGE = 'medium';
const LARGE_IMAGE = 'large';
const UNAVAILABLE_IMAGE_RESOLUTION = 'unavailable';

export const imageDimensions = {
  [SMALL_IMAGE]: {
    value: 'small-image',
    maxDimension: 1000,
    label: 'Small (< 1,000px)',
  },
  [MEDIUM_IMAGE]: {
    value: 'medium-image',
    maxDimension: 2000,
    label: 'Medium (1,000px-2,000px)',
  },
  [LARGE_IMAGE]: {
    value: 'large-image',
    maxDimension: 2001,
    label: 'Large (>2,000px)',
  },
  [UNAVAILABLE_IMAGE_RESOLUTION]: {
    value: 'unavailable',
    label: 'Unavailable',
  },
};

function getDimensions(width, height) {
  if (!width && !height) {
    return UNAVAILABLE_IMAGE_RESOLUTION;
  }
  const largestDimension = Math.max(width, height);
  if (largestDimension <= imageDimensions.small.maxDimension) {
    return SMALL_IMAGE;
  }
  if (largestDimension <= imageDimensions.medium.maxDimension) {
    return MEDIUM_IMAGE;
  }
  return LARGE_IMAGE;
}

function getListingFieldOptions(config, listingFieldKey) {
  const { listing } = config;
  const { listingFields } = listing;
  const { enumOptions } = listingFields.find(f => f.key === listingFieldKey);
  return enumOptions.map(({ label, option }) => ({ value: option, label }));
}

function uppyFileToProductFile(file) {
  const { id, meta, name, size, preview } = file;

  const { keywords, height, width } = meta;
  const dimensions = getDimensions(width, height);

  let keywordsOptions = [];
  if (keywords) {
    keywordsOptions = Array.isArray(keywords) ? keywords : keywords.split(',');
  }

  return {
    key: id,
    id,
    name,
    title: name,
    description: '-',
    keywords: keywordsOptions,
    size,
    preview,
    category: [],
    usage: 'editorial',
    releases: 'no-release',
    price: 1,
    dimensions: dimensions,
    isAi: false,
    isIllustration: false,
  };
}

function getCategory(file) {
  const isVideo = file.type.startsWith('video/');
  if (file.isAi) return isVideo ? 'ai-video' : 'ai-image';
  if (file.isIllustration) return 'illustrations';
  return isVideo ? 'videos' : 'photos';
}

function validateFileProperties(file) {
  const requiredProperties = ['category', 'title', 'description', 'price'];

  for (let property of requiredProperties) {
    if (!file[property] || (Array.isArray(file[property]) && file[property].length === 0)) {
      console.error(`Validation failed: ${property} is missing for file ${file.id}`);
      return false;
    }
  }
  return true;
}

// ================ Action types ================ //
export const INITIALIZE_UPPY = 'app/BatchEditListingPage/INITIALIZE_UPPY';
export const ADD_FILE = 'app/BatchEditListingPage/ADD_FILE';
export const REMOVE_FILE = 'app/BatchEditListingPage/REMOVE_FILE';
export const RESET_FILES = 'app/BatchEditListingPage/RESET_FILES';
export const PREVIEW_GENERATED = 'app/BatchEditListingPage/PREVIEW_GENERATED';
export const FETCH_LISTING_OPTIONS = 'app/BatchEditListingPage/FETCH_LISTING_OPTIONS';
export const UPDATE_FILE_DETAILS = 'app/BatchEditListingPage/UPDATE_FILE_DETAILS';

// ================ Reducer ================ //
const initialState = {
  files: [],
  uppy: null,
  listingFieldsOptions: {
    categories: [],
    usages: [],
    releases: [],
  },
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case INITIALIZE_UPPY:
      return { ...state, uppy: payload.uppy, files: payload.files };
    case ADD_FILE:
      return { ...state, files: [...state.files, uppyFileToProductFile(payload)] };
    case REMOVE_FILE:
      return { ...state, files: state.files.filter(file => file.id !== payload.id) };
    case RESET_FILES:
      return { ...state, files: [] };
    case PREVIEW_GENERATED: {
      const { id, preview } = payload;
      return {
        ...state,
        files: state.files.map(file => (file.id === id ? { ...file, preview } : file)),
      };
    }
    case FETCH_LISTING_OPTIONS: {
      const { categories, usages, releases } = payload;
      return {
        ...state,
        listingFieldsOptions: {
          categories,
          usages,
          releases,
        },
      };
    }
    case UPDATE_FILE_DETAILS: {
      const { id, ...values } = payload;
      return {
        ...state,
        files: state.files.map(file => (file.id === id ? { ...file, ...values } : file)),
      };
    }
    default:
      return state;
  }
}

// ============== Selector =============== //
export const getUppyInstance = state => state.BatchEditListingPage.uppy;

export const getFiles = state => state.BatchEditListingPage.files;

/**
 * Handles the completion of a Transloadit result.
 *
 * @param {function} getState - Function to get the current state.
 * @param {object} sdk - Instance of Sharetribe's SDK.
 * @returns {function} - A function to handle the Transloadit result.
 */
function handleTransloaditResultComplete(getState, sdk) {
  return (stepName, result, assembly) => {
    const { localId, ssl_url } = result;
    const queryParams = {
      expand: true,
    };
    const uppyInstance = getUppyInstance(getState());
    const filesDetails = getFiles(getState());

    axios
      .get(ssl_url, { responseType: 'blob' })
      .then(response => {
        return sdk.images.upload({ image: response.data }, queryParams).then(sdkResponse => {
          const uppyFile = uppyInstance.getFile(localId);
          const fileDetails = filesDetails.find(file => file.id === localId);
          const { data: sdkImage } = sdkResponse.data;

          const listingData = {
            title: fileDetails.title,
            description: fileDetails.description,
            publicData: {
              listingType: 'product-listing',
              categoryLevel1: getCategory(uppyFile),
              imageryCategory: fileDetails.category,
              usage: fileDetails.usage,
              releases: fileDetails.releases,
              keywords: fileDetails.keywords,
              imageSize: fileDetails.dimensions,
              fileType: '',
              aiTerms: fileDetails.isAi ? 'yes' : 'no',
              originalFileName: fileDetails.name,
            },
            price: new Money(fileDetails.price, 'USD'),
            images: [sdkImage.id],
          };

          sdk.ownListings.create(listingData, {
            expand: true,
            include: ['images'],
          });
        });
      })
      .catch(error => {
        console.error('Error during image download or upload:', error);
      });
  };
}

// ================ Thunk ================ //
export function initializeUppy(uppyInstance) {
  return (dispatch, getState, sdk) => {
    dispatch({
      type: INITIALIZE_UPPY,
      payload: { uppy: uppyInstance, files: uppyInstance.getFiles().map(uppyFileToProductFile) },
    });

    uppyInstance.on('file-removed', file => {
      dispatch({ type: REMOVE_FILE, payload: file });
    });

    uppyInstance.on('file-added', file => {
      const { id } = file;
      const uppy = getUppyInstance(getState());

      getFileMetadata(file, metadata => {
        // set the metadata using Uppy interface and then retrieve it again with the updated info
        uppy.setFileMeta(id, metadata);
        const newFile = uppy.getFile(id);
        dispatch({ type: ADD_FILE, payload: newFile });
      });
    });

    uppyInstance.on('cancel-all', () => {
      dispatch({ type: RESET_FILES });
    });

    uppyInstance.on('thumbnail:generated', (file, preview) => {
      const { id } = file;
      dispatch({ type: PREVIEW_GENERATED, payload: { id, preview } });
    });

    uppyInstance.on(
      'transloadit:result',
      handleTransloaditResultComplete(getState, sdk, uppyInstance)
    );
  };
}

export const requestUpdateFileDetails = payload => (dispatch, getState, sdk) => {
  dispatch({ type: UPDATE_FILE_DETAILS, payload });
};

export function requestSaveBatchListings() {
  return (dispatch, getState, sdk) => {
    const uppy = getUppyInstance(getState());
    const files = getFiles(getState());

    // Validate required properties before proceeding
    const allFilesValid = files.every(validateFileProperties);

    if (!allFilesValid) {
      console.error('Validation failed. Some files are missing required properties.');
      return;
    }

    uppy.upload().then(result => {
      console.info('Successful uploads:', result.successful);
    });
  };
}

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };

  const imageryCategoryOptions = getListingFieldOptions(config, 'imageryCategory');
  const usageOptions = getListingFieldOptions(config, 'usage');
  const releaseOptions = getListingFieldOptions(config, 'releases');
  dispatch({
    type: FETCH_LISTING_OPTIONS,
    payload: {
      categories: imageryCategoryOptions,
      usages: usageOptions,
      releases: releaseOptions,
    },
  });

  return dispatch(fetchCurrentUser(fetchCurrentUserOptions))
    .then(response => response)
    .catch(e => {
      throw e;
    });
};
