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

function uppyFileToListing(file) {
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

function validateListingProperties(listing) {
  const requiredProperties = ['category', 'title', 'description', 'price'];
  const missingProperties = [];

  requiredProperties.forEach(property => {
    if (
      !listing[property] ||
      (Array.isArray(listing[property]) && listing[property].length === 0)
    ) {
      missingProperties.push(property);
    }
  });

  return missingProperties.length === 0 ? null : { listing, missingProperties };
}

// ================ Action types ================ //
export const INITIALIZE_UPPY = 'app/BatchEditListingPage/INITIALIZE_UPPY';
export const ADD_FILE = 'app/BatchEditListingPage/ADD_FILE';
export const REMOVE_FILE = 'app/BatchEditListingPage/REMOVE_FILE';
export const RESET_FILES = 'app/BatchEditListingPage/RESET_FILES';
export const PREVIEW_GENERATED = 'app/BatchEditListingPage/PREVIEW_GENERATED';
export const FETCH_LISTING_OPTIONS = 'app/BatchEditListingPage/FETCH_LISTING_OPTIONS';
export const UPDATE_FILE_DETAILS = 'app/BatchEditListingPage/UPDATE_FILE_DETAILS';
export const SET_INVALID_LISTINGS = 'app/BatchEditListingPage/SET_INVALID_LISTINGS';
export const SET_AI_TERMS_ACCEPTED = 'app/BatchEditListingPage/SET_AI_TERMS_ACCEPTED';
export const SHOW_AI_TERMS_MODAL = 'app/BatchEditListingPage/SHOW_AI_TERMS_MODAL';
// ================ Reducer ================ //
const initialState = {
  listings: [],
  uppy: null,
  listingFieldsOptions: {
    categories: [],
    usages: [],
    releases: [],
  },
  invalidListings: [],
  aiTermsAccepted: false,
  showAiTerms: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case INITIALIZE_UPPY:
      return { ...state, uppy: payload.uppy, listings: payload.files };
    case ADD_FILE:
      return { ...state, listings: [...state.listings, uppyFileToListing(payload)] };
    case REMOVE_FILE:
      return { ...state, listings: state.listings.filter(file => file.id !== payload.id) };
    case RESET_FILES:
      return { ...state, listings: [] };
    case PREVIEW_GENERATED: {
      const { id, preview } = payload;
      return {
        ...state,
        files: state.listings.map(file => (file.id === id ? { ...file, preview } : file)),
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
        listings: state.listings.map(file => (file.id === id ? { ...file, ...values } : file)),
      };
    }
    case SET_INVALID_LISTINGS:
      return { ...state, invalidListings: payload };
    case SET_AI_TERMS_ACCEPTED:
      return { ...state, aiTermsAccepted: payload, showAiTerms: false };
    case SHOW_AI_TERMS_MODAL:
      return { ...state, showAiTerms: true };
    default:
      return state;
  }
}

// ============== Selector =============== //
export const getUppyInstance = state => state.BatchEditListingPage.uppy;
export const getListings = state => state.BatchEditListingPage.listings;
export const getInvalidListings = state => state.BatchEditListingPage.invalidListings;
export const getAiTermsAccepted = state => state.BatchEditListingPage.aiTermsAccepted;
export const getListingFieldsOptions = state => state.BatchEditListingPage.listingFieldsOptions;
export const getAiTermsModalVisibility = state => state.BatchEditListingPage.showAiTerms;
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
    const filesDetails = getListings(getState());

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
      payload: { uppy: uppyInstance, files: uppyInstance.getFiles().map(uppyFileToListing) },
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
    const listings = getListings(getState());

    // 1. Validate required fields for all listings
    const invalidListings = listings
      .map(validateListingProperties)
      .filter(result => result !== null);

    if (invalidListings.length > 0) {
      // Dispatch action to store invalid file names in state and trigger modal
      dispatch({ type: SET_INVALID_LISTINGS, payload: invalidListings.map(f => f.listing.name) });
      return; // Abort saving if there are invalid listings
    }

    // 2. Check if any AI content is listed and if terms are accepted
    const aiListings = listings.filter(listing => listing.isAi);
    const aiTermsAccepted = getAiTermsAccepted(getState());

    if (aiListings.length > 0 && !aiTermsAccepted) {
      // Dispatch action to trigger modal for AI terms
      // Here you would display a different modal if AI listings are present
      dispatch({ type: SHOW_AI_TERMS_MODAL });
      return; // Abort saving until terms are accepted
    }

    // 3. Proceed with saving the listings if all validations pass
    const uppy = getUppyInstance(getState());
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
