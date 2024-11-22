import { fetchCurrentUser } from '../../ducks/user.duck';
import { getFileMetadata } from '../../util/file-metadata';
import _ from 'lodash';
import { createUppyInstance } from '../../util/uppy';
import { convertUnitToSubUnit, unitDivisor } from '../../util/currency';
import { LISTING_TYPES } from '../../util/types';
import { parse } from '../../util/urlHelpers';
import { queryListingsError } from '../ManageListingsPage/ManageListingsPage.duck';
import { storableError } from '../../util/errors';

const SMALL_IMAGE = 'small';
const MEDIUM_IMAGE = 'medium';
const LARGE_IMAGE = 'large';
const UNAVAILABLE_IMAGE_RESOLUTION = 'unavailable';
const USAGE_EDITORIAL = 'editorial';
const NO_RELEASES = 'no-release';

const AI_TERMS_STATUS_ACCEPTED = 'accepted';
const AI_TERMS_STATUS_REQUIRED = 'required';
const AI_TERMS_STATUS_NOT_REQUIRED = 'not-required';
const RESULT_PAGE_SIZE = 30;

export const MAX_KEYWORDS = 30;

export const IMAGE_DIMENSIONS_MAP = {
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
  if (largestDimension <= IMAGE_DIMENSIONS_MAP.small.maxDimension) {
    return SMALL_IMAGE;
  }
  if (largestDimension <= IMAGE_DIMENSIONS_MAP.medium.maxDimension) {
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

function listingsFromSdkResponse(sdkResponse) {
  const { data, included } = sdkResponse;
  return data.map(ownListing => {
    const images = ownListing.relationships.images;
    const image =
      images.data.length > 0 ? included.find(img => img.id.uuid === images.data[0].id.uuid) : null;
    const preview = image?.attributes?.variants?.default?.url;

    return {
      id: ownListing.id.uuid,
      name: ownListing.attributes.publicData.originalFileName,
      title: ownListing.attributes.title,
      description: ownListing.attributes.description,
      keywords: ownListing.attributes.publicData.keywords,
      category: ownListing.attributes.publicData.imageryCategory,
      usage: ownListing.attributes.publicData.usage,
      releases: ownListing.attributes.publicData.releases,
      dimensions: ownListing.attributes.publicData.imageSize,
      price: ownListing.attributes.price.amount / 100,
      isAi: ownListing.attributes.publicData.aiTerms === 'yes',
      preview,
    };
  });
}

function uppyFileToListing(file) {
  const { id, meta, name, size, preview, type } = file;

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
    keywords: keywordsOptions.slice(0, MAX_KEYWORDS),
    size,
    preview,
    category: [],
    usage: USAGE_EDITORIAL,
    releases: NO_RELEASES,
    price: null,
    dimensions: dimensions,
    isAi: false,
    isIllustration: false,
    type,
  };
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

function getListingCategory(listing) {
  const isVideo = listing.type.startsWith('video/');
  if (listing.isAi) return isVideo ? 'ai-video' : 'ai-image';
  if (listing.isIllustration) return 'illustrations';
  return isVideo ? 'videos' : 'photos';
}

// ================ Action types ================ //
export const INITIALIZE_UPPY = 'app/BatchEditListingPage/INITIALIZE_UPPY';

export const SET_LISTINGS_DEFAULTS = 'app/BatchEditListingPage/SET_LISTINGS_DEFAULTS';
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

export const RESET_STATE = 'app/BatchEditListingPage/RESET_STATE';

export const FETCH_LISTINGS_FOR_EDIT_REQUEST =
  'app/BatchEditListingPage/FETCH_LISTINGS_FOR_EDIT_REQUEST';
export const FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS =
  'app/BatchEditListingPage/FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS';

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
  listingCategory: null,
  queryParams: [],
  queryInProgress: false,
  queryListingsError: null,
  listingDefaults: {
    currency: 'USD',
    transactionType: {
      process: 'default-purchase',
      alias: 'default-purchase/release-1',
      unitType: 'item',
    },
  },
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case SET_USER_ID:
      return { ...state, userId: payload };
    case SET_LISTINGS_DEFAULTS:
      return { ...state, listingDefaults: payload };
    case INITIALIZE_UPPY:
      return { ...state, uppy: payload.uppy, listings: payload.files };
    case ADD_FILE:
      return {
        ...state,
        listings: [...state.listings, payload],
        selectedRowsKeys: _.uniq([...state.selectedRowsKeys, payload.id]),
      };
    case REMOVE_FILE:
      return {
        ...state,
        listings: state.listings.filter(file => file.id !== payload.id),
        selectedRowsKeys: state.selectedRowsKeys.filter(key => key !== payload.id),
      };
    case RESET_FILES:
      return { ...state, listings: [], selectedRowsKeys: [] };
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
    case RESET_STATE:
      return initialState;
    case FETCH_LISTINGS_FOR_EDIT_REQUEST:
      return {
        ...state,
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryListingsError: null,
      };
    case FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS:
      return {
        ...state,
        queryInProgress: false,
        queryListingsError: null,
        listings: listingsFromSdkResponse(payload.data),
      };
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
export const getFailedListings = state => state.BatchEditListingPage.failedListings;
export const getPublishingData = state => {
  const { failedListings, successfulListings, selectedRowsKeys } = state.BatchEditListingPage;
  return {
    failedListings,
    successfulListings,
    selectedRowsKeys,
  };
};
export const getListingsDefaults = state => state.BatchEditListingPage.listingDefaults;
export const getIsQueryInProgress = state => state.BatchEditListingPage.queryInProgress;

/**
 * Handles the completion of a Transloadit result.
 *
 * @param dispatch
 * @param {function} getState - Function to get the current state.
 * @param {object} sdk - Instance of Sharetribe's SDK.
 * @returns {function} - A function to handle the Transloadit result.
 */
function handleTransloaditResultComplete(dispatch, getState, sdk) {
  return async (stepName, result) => {
    const { localId, ssl_url } = result;
    const listing = getSingleListing(getState(), localId);
    const { currency, transactionType } = getListingsDefaults(getState());

    try {
      const price = convertUnitToSubUnit(listing.price, unitDivisor(currency));

      const listingData = {
        title: listing.title,
        description: listing.description,
        publicData: {
          listingType: LISTING_TYPES.PRODUCT,
          categoryLevel1: getListingCategory(listing),
          imageryCategory: listing.category,
          usage: listing.usage,
          releases: listing.releases,
          keywords: listing.keywords,
          imageSize: IMAGE_DIMENSIONS_MAP[listing.dimensions].value,
          fileType: listing.type,
          aiTerms: listing.isAi ? 'yes' : 'no',
          originalFileName: listing.name,
          transactionProcessAlias: transactionType.alias,
          unitType: transactionType.unitType,
        },
        privateData: {
          transloaditSslUrl: ssl_url,
        },
        price: {
          amount: price,
          currency: currency,
        },
      };

      await sdk.ownListings.create(listingData, {
        expand: true,
      });

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

function getOnBeforeUpload(getState) {
  return files => {
    // Use the onBeforeUpload event to filter out files that are not selected
    const selectedFilesIds = getSelectedRowsKeys(getState());

    return selectedFilesIds.reduce((acc, key) => {
      if (key in files) {
        acc[key] = files[key];
      }
      return acc;
    }, {});
  };
}

// ================ Thunk ================ //
export function initializeUppy(meta) {
  return (dispatch, getState, sdk) => {
    createUppyInstance(meta, getOnBeforeUpload(getState)).then(uppyInstance => {
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

      uppyInstance.on(
        'transloadit:result',
        handleTransloaditResultComplete(dispatch, getState, sdk)
      );
      uppyInstance.on('error', error => {
        console.log(error);
        if (error.assembly) {
          console.log(`Assembly ID ${error.assembly.assembly_id} failed!`);
          console.log(error.assembly);
        }
      });
    });
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

export const queryOwnListings = queryParams => (dispatch, getState, sdk) => {
  dispatch({
    type: FETCH_LISTINGS_FOR_EDIT_REQUEST,
    payload: { queryParams },
  });

  const { perPage, ...rest } = queryParams;
  const params = { ...rest, perPage };

  return sdk.ownListings
    .query(params)
    .then(response => {
      dispatch({
        type: FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS,
        payload: response,
      });

      return response;
    })
    .catch(e => {
      dispatch(queryListingsError(storableError(e)));
      throw e;
    });
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const { transactionType } = config.listing.listingTypes.find(
    ({ listingType }) => listingType === LISTING_TYPES.PRODUCT
  );
  dispatch({
    type: SET_LISTINGS_DEFAULTS,
    payload: {
      currency: config.currency,
      transactionType,
    },
  });
  const { type } = params;

  if (type !== 'new') {
    const queryParams = parse(search);
    const page = queryParams.page || 1;

    dispatch(
      queryOwnListings({
        ...queryParams,
        page,
        perPage: RESULT_PAGE_SIZE,
        include: ['images'],
        'fields.image': ['variants.default'],
        'limit.images': 1,
      })
    );
  }

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

  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };
  return dispatch(fetchCurrentUser(fetchCurrentUserOptions))
    .then(response => {
      dispatch({ type: SET_USER_ID, payload: response.id });
      return response;
    })
    .catch(e => {
      throw e;
    });
};
