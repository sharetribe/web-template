import { fetchCurrentUser } from '../../ducks/user.duck';
import { getFileMetadata } from '../../util/file-metadata';

const NEW_BATCH_LISTING_FLOW = 'new';

// ================ Action types ================ //
export const ADD_FILE = 'app/BatchEditListingPage/ADD_FILE';
export const REMOVE_FILE = 'app/BatchEditListingPage/REMOVE_FILE';
export const UPDATE_FILE_METADATA = 'app/BatchEditListingPage/UPDATE_FILE_METADATA';

// ================ Reducer ================ //
const initialState = {
  files: [],
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case ADD_FILE:
      return { ...state, files: payload };
    case REMOVE_FILE:
      return { ...state, files: payload };
    default:
      return state;
  }
}

// ================ Thunk ================ //
export function requestCreateBatchListings(payload) {
  return (dispatch, getState, { sdk }) => {};
}

export function requestRemoveFile(files) {
  return dispatch => {
    dispatch({ type: REMOVE_FILE, payload: files });
  };
}

export function requestAddFile(id, newFile, allFiles) {
  return dispatch => {
    getFileMetadata(data, metadata => {
      dispatch()
      uppy.setFileMeta(id, metadata);
    });
    dispatch({ type: ADD_FILE, payload: { id, newFile, allFiles } });
  };
}

export const loadData = (params, search, config) => (dispatch, getState, { sdk }) => {
  const { type } = params;

  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };

  if (type === NEW_BATCH_LISTING_FLOW) {
    return Promise.all([dispatch(fetchCurrentUser(fetchCurrentUserOptions))])
      .then(response => {
        return response;
      })
      .catch(e => {
        throw e;
      });
  }

  return Promise.all([dispatch(fetchCurrentUser(fetchCurrentUserOptions))])
    .then(response => response)
    .catch(e => {
      throw e;
    });
};
