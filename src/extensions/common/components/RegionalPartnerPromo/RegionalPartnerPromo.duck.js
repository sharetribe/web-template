// src/redux/modules/promo.js

// Action Types
const FETCH_PROMO_REQUEST = 'promo/FETCH_PROMO_REQUEST';
const FETCH_PROMO_SUCCESS = 'promo/FETCH_PROMO_SUCCESS';
const FETCH_PROMO_FAILURE = 'promo/FETCH_PROMO_FAILURE';

// Action Creators
export const fetchPromoRequest = () => ({
    type: FETCH_PROMO_REQUEST,
});

export const fetchPromoSuccess = (data) => ({
    type: FETCH_PROMO_SUCCESS,
    payload: data,
});

export const fetchPromoFailure = (error) => ({
    type: FETCH_PROMO_FAILURE,
    payload: error,
});

// Thunk for fetching promo data
export const fetchPromoData = (region) => async (dispatch) => {
    console.log('Dispatching FETCH_PROMO_REQUEST');
    dispatch(fetchPromoRequest());
    try {
        const response = await fetch(`https://partner-promo-api.vendingvillage.com/?region=${region}`);
        const data = await response.json();
        if (data && data['Promo Title']) {
            dispatch(fetchPromoSuccess(data));
        } else {
            console.log('Dispatching FETCH_PROMO_FAILURE: No promo data found');
            dispatch(fetchPromoFailure('No promo data found'));
        }
    } catch (error) {
        console.log('Dispatching FETCH_PROMO_FAILURE:', error.message);
        dispatch(fetchPromoFailure(error.message));
    }
};

// Initial State
const initialState = {
    loading: false,
    promoData: null,
    error: null,
};

// Reducer
export default function reducer(state = initialState, action) {
    switch (action.type) {
        case FETCH_PROMO_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case FETCH_PROMO_SUCCESS:
            return {
                ...state,
                loading: false,
                promoData: action.payload,
            };
        case FETCH_PROMO_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
}