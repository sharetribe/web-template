import { fetchCustomCategoryConfig } from './api';

// ================ Action types ================ //

export const FETCH_CATEGORY_CONFIG_REQUEST = 'app/categoryConfig/FETCH_COMMISSION_REQUEST';
export const FETCH_CATEGORY_CONFIG_SUCCESS = 'app/categoryConfig/FETCH_COMMISSION_SUCCESS';
export const FETCH_CATEGORY_CONFIG_ERROR = 'app/categoryConfig/FETCH_COMMISSION_ERROR';

// ================ Reducer ================ //

const initialState = {
  config: {},
  fetchCategoryConfigInProgress: false,
  fetchCategoryConfigError: null,
};

export default function categoryConfigReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_CATEGORY_CONFIG_REQUEST:
      return { ...state, fetchCategoryConfigInProgress: true, fetchCategoryConfigError: null };
    case FETCH_CATEGORY_CONFIG_SUCCESS:
      return { ...state, fetchCategoryConfigInProgress: false, config: payload };
    case FETCH_CATEGORY_CONFIG_ERROR:
      return { ...state, fetchCategoryConfigInProgress: false, fetchCategoryConfigError: payload };
    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchCategoryConfigRequest = () => ({ type: FETCH_CATEGORY_CONFIG_REQUEST });
export const fetchCategoryConfigSuccess = config => ({
  type: FETCH_CATEGORY_CONFIG_SUCCESS,
  payload: config,
});
export const fetchCategoryConfigError = e => ({
  type: FETCH_CATEGORY_CONFIG_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchCustomCategoryConfiguration = () => async (dispatch, getState, sdk) => {
  try {
    dispatch(fetchCategoryConfigRequest());
    const categoryConfig = await fetchCustomCategoryConfig();
    dispatch(fetchCategoryConfigSuccess(categoryConfig));
    return categoryConfig;
  } catch (error) {
    dispatch(fetchCategoryConfigError(error));
  }
};
