import { referralProgramOptIn } from '../../util/api';
import { storableError } from '../../util/errors';

import { fetchCurrentUser } from '../../ducks/user.duck';

// ================ Action types ================ //

export const FETCH_REFERRAL_CODE_REQUEST = 'app/ReferralProgramPage/FETCH_REFERRAL_CODE_REQUEST';
export const FETCH_REFERRAL_CODE_SUCCESS = 'app/ReferralProgramPage/FETCH_REFERRAL_CODE_SUCCESS';
export const FETCH_REFERRAL_CODE_ERROR = 'app/ReferralProgramPage/FETCH_REFERRAL_CODE_ERROR';

// ================ Reducer ================ //

const initialState = {
  queryInProgress: false,
  queryReferralCodeError: null,
  referralCode: null,
};

const favoriteListingsPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_REFERRAL_CODE_REQUEST:
      return {
        ...state,
        queryInProgress: true,
        queryReferralCodeError: null,
        referralCode: null,
      };
    case FETCH_REFERRAL_CODE_SUCCESS:
      return {
        ...state,
        queryInProgress: false,
        referralCode: payload,
      };
    case FETCH_REFERRAL_CODE_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return {
        ...state,
        queryInProgress: false,
        queryReferralCodeError: payload,
      };

    default:
      return state;
  }
};
export default favoriteListingsPageReducer;

// ================ Action creators ================ //

export const queryFavoritesRequest = () => ({
  type: FETCH_REFERRAL_CODE_REQUEST,
});

export const queryFavoritesSuccess = payload => ({
  type: FETCH_REFERRAL_CODE_SUCCESS,
  payload,
});

export const queryReferralCodeError = e => ({
  type: FETCH_REFERRAL_CODE_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const queryReferralCode = () => async (dispatch, getState, sdk) => {
  dispatch(queryFavoritesRequest());
  try {
    const { currentUser } = getState().user;
    const userId = currentUser?.id?.uuid;
    const referralCode = currentUser?.attributes.profile.privateData?.referralCode || null;
    const withReferralCode = !!referralCode;

    if (withReferralCode) {
      dispatch(queryFavoritesSuccess(referralCode));
      return referralCode;
    }

    const { code } = await referralProgramOptIn({ userId });
    dispatch(queryFavoritesSuccess(code));
    return code;
  } catch (error) {
    dispatch(queryReferralCodeError(storableError(e)));
    throw e;
  }
};

export const loadData = () => (dispatch, getState, sdk) => {
  return Promise.all([dispatch(fetchCurrentUser()), dispatch(queryReferralCode())]);
};
