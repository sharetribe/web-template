import { fetchCurrentUser } from '../../ducks/user.duck';
import { getFileMetadata } from '../../util/file-metadata';
import { createUppyInstance } from '../../util/uppy';

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
    price: 0,
    dimensions: dimensions,
    isAi: false,
    isIllustration: false,
  };
}

// ================ Action types ================ //
export const INITIALIZE_UPPY = 'app/BatchEditListingPage/INITIALIZE_UPPY';
export const ADD_FILE = 'app/BatchEditListingPage/ADD_FILE';
export const REMOVE_FILE = 'app/BatchEditListingPage/REMOVE_FILE';
export const RESET_FILES = 'app/BatchEditListingPage/RESET_FILES';
export const PREVIEW_GENERATED = 'app/BatchEditListingPage/PREVIEW_GENERATED';
export const FETCH_LISTING_OPTIONS = 'app/BatchEditListingPage/FETCH_LISTING_OPTIONS';

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
      return { ...state, uppy: payload, files: payload.getFiles().map(uppyFileToProductFile) };
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
    default:
      return state;
  }
}

// ============== Selector =============== //
export const getUppyInstance = state => state.BatchEditListingPage.uppy;

export const getFiles = state => state.BatchEditListingPage.files;

// ================ Thunk ================ //
export function initializeUppy() {
  return (dispatch, getState, sdk) => {
    console.log(sdk);
    const uppyInstance = createUppyInstance();
    dispatch({ type: INITIALIZE_UPPY, payload: uppyInstance });

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
  };
}

export function requestCreateBatchListings(payload) {
  return (dispatch, getState, { sdk }) => {};
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
    payload: { categories: imageryCategoryOptions, usages: usageOptions, releases: releaseOptions },
  });

  return dispatch(fetchCurrentUser(fetchCurrentUserOptions))
    .then(response => response)
    .catch(e => {
      throw e;
    });
};
