import { fetchCurrentUser } from '../../ducks/user.duck';
import { getFileMetadata } from '../../util/file-metadata';
import axios from 'axios';
import { Money } from 'sharetribe-flex-sdk/src/types';
import { createUppyInstance } from '../../util/uppy';
import { getStore } from '../../store';
import { uploadOriginalAsset } from '../../util/api';

const SMALL_IMAGE = 'small';
const MEDIUM_IMAGE = 'medium';
const LARGE_IMAGE = 'large';
const UNAVAILABLE_IMAGE_RESOLUTION = 'unavailable';

const AI_TERMS_STATUS_ACCEPTED = 'accepted';
const AI_TERMS_STATUS_REQUIRED = 'required';
const AI_TERMS_STATUS_NOT_REQUIRED = 'not-required';

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
    description: null,
    keywords: keywordsOptions,
    size,
    preview,
    category: [],
    usage: 'editorial',
    releases: 'no-release',
    price: null,
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

export const SET_USER_ID = 'app/BatchEditListingPage/SET_USER_ID';

export const ADD_FILE = 'app/BatchEditListingPage/ADD_FILE';
export const REMOVE_FILE = 'app/BatchEditListingPage/REMOVE_FILE';
export const RESET_FILES = 'app/BatchEditListingPage/RESET_FILES';
export const UPDATE_LISTING = 'app/BatchEditListingPage/UPDATE_LISTING';

export const PREVIEW_GENERATED = 'app/BatchEditListingPage/PREVIEW_GENERATED';
export const FETCH_LISTING_OPTIONS = 'app/BatchEditListingPage/FETCH_LISTING_OPTIONS';
export const SET_INVALID_LISTINGS = 'app/BatchEditListingPage/SET_INVALID_LISTINGS';
export const SET_AI_TERMS_ACCEPTED = 'app/BatchEditListingPage/SET_AI_TERMS_ACCEPTED';
export const SET_AI_TERMS_REQUIRED = 'app/BatchEditListingPage/SET_AI_TERMS_REQUIRED';
export const SET_AI_TERMS_NOT_REQUIRED = 'app/BatchEditListingPage/SET_AI_TERMS_NOT_REQUIRED';

export const CREATE_LISTINGS_REQUEST = 'app/BatchEditListingPage/CREATE_LISTINGS_REQUEST';
export const CREATE_LISTINGS_ERROR = 'app/BatchEditListingPage/CREATE_LISTINGS_REQUEST';
export const CREATE_LISTINGS_ABORTED = 'app/BatchEditListingPage/CREATE_LISTINGS_ABORTED';
export const CREATE_LISTINGS_SUCCESS = 'app/BatchEditListingPage/CREATE_LISTINGS_SUCCESS';

export const SET_SELECTED_ROWS = 'app/BatchEditListingPage/SET_SELECTED_ROWS';
export const ADD_FAILED_LISTING = 'app/BatchEditListingPage/ADD_FAILED_LISTING';
export const ADD_SUCCESSFUL_LISTING = 'app/BatchEditListingPage/ADD_SUCCESSFUL_LISTING';

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
  selectedRowsKeys: [],
  aiTermsStatus: AI_TERMS_STATUS_NOT_REQUIRED,
  createListingsInProgress: false,
  createListingsError: null,
  createListingsSuccess: null,
  userId: null,
  failedListings: [],
  successfulListings: [],
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case SET_USER_ID:
      return { ...state, userId: payload };
    case INITIALIZE_UPPY:
      return { ...state, uppy: payload.uppy, listings: payload.files };
    case ADD_FILE:
      return {
        ...state,
        listings: [...state.listings, payload],
        selectedRowsKeys: [...state.selectedRowsKeys, payload.id],
      };
    case REMOVE_FILE:
      return { ...state, listings: state.listings.filter(file => file.id !== payload.id) };
    case RESET_FILES:
      return { ...state, listings: [] };
    case PREVIEW_GENERATED: {
      const { id, preview } = payload;
      return {
        ...state,
        listings: state.listings.map(listing =>
          listing.id === id
            ? {
                ...listing,
                preview,
              }
            : listing
        ),
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
    case UPDATE_LISTING: {
      const { id, ...values } = payload;
      return {
        ...state,
        listings: state.listings.map(file => (file.id === id ? { ...file, ...values } : file)),
      };
    }
    case SET_INVALID_LISTINGS:
      return { ...state, invalidListings: payload };

    case SET_AI_TERMS_ACCEPTED:
      return { ...state, aiTermsStatus: AI_TERMS_STATUS_ACCEPTED };
    case SET_AI_TERMS_REQUIRED:
      return { ...state, aiTermsStatus: AI_TERMS_STATUS_REQUIRED };
    case SET_AI_TERMS_NOT_REQUIRED:
      return { ...state, aiTermsStatus: AI_TERMS_STATUS_NOT_REQUIRED };

    case SET_SELECTED_ROWS:
      return { ...state, selectedRowsKeys: payload };

    case CREATE_LISTINGS_REQUEST:
      return { ...state, createListingsInProgress: true, createListingsError: null };
    case CREATE_LISTINGS_ERROR:
      return {
        ...state,
        createListingsSuccess: false,
        createListingsInProgress: false,
        createListingsError: payload,
      };
    case CREATE_LISTINGS_ABORTED:
      return {
        ...state,
        createListingsSuccess: null,
        createListingsInProgress: false,
        invalidListings: [],
      };
    case CREATE_LISTINGS_SUCCESS:
      return {
        ...state,
        createListingsSuccess: true,
        createListingsInProgress: false,
        createListingsError: null,
      };
    case ADD_FAILED_LISTING:
      return { ...state, failedListings: [...state.failedListings, payload] };
    case ADD_SUCCESSFUL_LISTING:
      return { ...state, successfulListings: [...state.successfulListings, payload] };
    default:
      return state;
  }
}

// ============== Selector =============== //
export const getUppyInstance = state => state.BatchEditListingPage.uppy;
export const getListings = state => state.BatchEditListingPage.listings;
export const getSingleListing = (state, id) =>
  state.BatchEditListingPage.listings.find(l => l.id === id);
export const getInvalidListings = state => state.BatchEditListingPage.invalidListings;
export const getListingFieldsOptions = state => state.BatchEditListingPage.listingFieldsOptions;
export const getSelectedRowsKeys = state => state.BatchEditListingPage.selectedRowsKeys;

export const getListingCreationInProgress = state =>
  state.BatchEditListingPage.createListingsInProgress;
export const getAiTermsRequired = state =>
  state.BatchEditListingPage.aiTermsStatus === AI_TERMS_STATUS_REQUIRED;
export const getAiTermsAccepted = state =>
  state.BatchEditListingPage.aiTermsStatus === AI_TERMS_STATUS_ACCEPTED;

export const getCreateListingsSuccess = state => state.BatchEditListingPage.createListingsSuccess;
export const getCreateListingsError = state => state.BatchEditListingPage.createListingsError;
export const getUserId = state => state.BatchEditListingPage.userId;
export const getFailedListings = state => state.BatchEditListingPage.failedListings;
export const getPublishingData = state => {
  const { failedListings, successfulListings, selectedRowsKeys } = state.BatchEditListingPage;
  return {
    failedListings,
    successfulListings,
    selectedRowsKeys,
  };
};

/**
 * Handles the completion of a Transloadit result.
 *
 * @param dispatch
 * @param {function} getState - Function to get the current state.
 * @param {object} sdk - Instance of Sharetribe's SDK.
 * @returns {function} - A function to handle the Transloadit result.
 */
function handleTransloaditResultComplete(dispatch, getState, sdk) {
  return async (stepName, result, assembly) => {
    const { localId, ssl_url } = result;
    const queryParams = { expand: true };
    const uppyInstance = getUppyInstance(getState());
    const listings = getListings(getState());
    const userId = getUserId(getState());

    const listing = listings.find(file => file.id === localId);

    try {
      // Get the uploaded image from Transloadit
      const response = await axios.get(ssl_url, { responseType: 'blob' });

      // Upload the image to Sharetribe
      const sdkResponse = await sdk.images.upload({ image: response.data }, queryParams);

      const uppyFile = uppyInstance.getFile(localId);

      const { data: sdkImage } = sdkResponse.data;

      const listingData = {
        title: listing.title,
        description: listing.description,
        publicData: {
          listingType: 'product-listing',
          categoryLevel1: getCategory(uppyFile),
          imageryCategory: listing.category,
          usage: listing.usage,
          releases: listing.releases,
          keywords: listing.keywords,
          imageSize: listing.dimensions,
          fileType: '',
          aiTerms: listing.isAi ? 'yes' : 'no',
          originalFileName: listing.name,
        },
        price: new Money(listing.price, 'USD'),
        images: [sdkImage.id],
      };

      // Create the listing, so we have the listing ID
      const draftResponse = await sdk.ownListings.create(listingData, {
        expand: true,
        include: ['images'],
      });
      const listingId = draftResponse.data.data.id;

      // Upload the original asset using the storage manager
      const data = await uploadOriginalAsset({
        userId: userId.uuid,
        listingId: listingId.uuid,
        fileUrl: ssl_url,
        metadata: {},
      });
      console.log(data);

      // Finally, update the listing with the reference to the original asset
      await sdk.ownListings.update(
        {
          id: listingId,
          privateData: {
            originalAsset: data.source,
          },
        },
        { expand: true }
      );
      dispatch({ type: ADD_SUCCESSFUL_LISTING, payload: listing });
    } catch (error) {
      dispatch({ type: ADD_FAILED_LISTING, payload: listing });
      console.error('Error during image download or upload:', error);
    } finally {
      const { successfulListings, failedListings, selectedRowsKeys } = getPublishingData(
        getState()
      );
      const totalListingsProcessed = successfulListings.length + failedListings.length;

      if (totalListingsProcessed === selectedRowsKeys.length) {
        const actionType =
          failedListings.length > 0 ? CREATE_LISTINGS_ERROR : CREATE_LISTINGS_SUCCESS;
        dispatch({ type: actionType });
      }
    }
  };
}

function updateAiTermsStatus(getState, dispatch) {
  if (getAiTermsAccepted(getState())) {
    return;
  }
  const listings = getListings(getState());
  const hasAi = listings.some(listing => listing.isAi);
  dispatch({ type: hasAi ? SET_AI_TERMS_REQUIRED : SET_AI_TERMS_NOT_REQUIRED });
}

// ================ Thunk ================ //
export function initializeUppy(meta) {
  return (dispatch, getState, sdk) => {
    const store = getStore();
    const uppyInstance = createUppyInstance(store, meta, files => {
      // Use the onBeforeUpload event to filter out files that are not selected
      const selectedFilesIds = getSelectedRowsKeys(getState());

      return selectedFilesIds.reduce((acc, key) => {
        if (key in files) {
          acc[key] = files[key];
        }
        return acc;
      }, {});
    });

    dispatch({
      type: INITIALIZE_UPPY,
      payload: { uppy: uppyInstance, files: uppyInstance.getFiles().map(uppyFileToListing) },
    });

    uppyInstance.on('file-removed', file => {
      dispatch({ type: REMOVE_FILE, payload: file });
      updateAiTermsStatus(getState, dispatch);
    });

    uppyInstance.on('file-added', file => {
      const { id } = file;
      const uppy = getUppyInstance(getState());

      getFileMetadata(file, metadata => {
        // set the metadata using Uppy interface and then retrieve it again with the updated info
        uppy.setFileMeta(id, metadata);

        const newFile = uppy.getFile(id);
        const listing = uppyFileToListing(newFile);
        dispatch({ type: ADD_FILE, payload: listing });
        updateAiTermsStatus(getState, dispatch);
      });
    });

    uppyInstance.on('cancel-all', () => {
      dispatch({ type: RESET_FILES });
    });

    uppyInstance.on('thumbnail:generated', (file, preview) => {
      const { id } = file;
      const listing = getSingleListing(getState(), id);
      if (!listing.preview) {
        dispatch({ type: PREVIEW_GENERATED, payload: { id, preview } });
      }
    });

    uppyInstance.on('transloadit:result', handleTransloaditResultComplete(dispatch, getState, sdk));
  };
}

export const requestUpdateListing = payload => (dispatch, getState, sdk) => {
  dispatch({ type: UPDATE_LISTING, payload });
};

export function requestSaveBatchListings() {
  return (dispatch, getState, sdk) => {
    dispatch({ type: CREATE_LISTINGS_REQUEST });

    const selectedFilesIds = getSelectedRowsKeys(getState());
    const listings = getListings(getState()).filter(listing =>
      selectedFilesIds.includes(listing.id)
    );

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
      dispatch({ type: SET_AI_TERMS_REQUIRED });
      return; // Abort saving until terms are accepted
    }

    // 3. Proceed with saving the listings if all validations pass
    const uppy = getUppyInstance(getState());

    uppy
      .upload()
      .then(result => {
        const failedListings = getFailedListings(getState());
        if (failedListings.length > 0) {
          dispatch({ type: CREATE_LISTINGS_ERROR });
        } else {
          //dispatch({ type: CREATE_LISTINGS_SUCCESS });
        }

        console.info('Successful uploads:', result.successful);
      })
      .catch(error => {
        console.error(error);
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
    .then(response => {
      dispatch({ type: SET_USER_ID, payload: response.id });
      return response;
    })
    .catch(e => {
      throw e;
    });
};
