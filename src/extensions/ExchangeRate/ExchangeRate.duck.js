import { storableError } from '../../util/errors';
import { fetchCurrencyExchangeRate } from './api';

// ================ Action types ================ //

export const FETCH_EXCHANGE_RATE_REQUEST = 'app/currency/CURRENCY_SELECTED_REQUEST';
export const FETCH_EXCHANGE_RATE_SUCCESS = 'app/currency/CURRENCY_SELECTED_SUCCESS';
export const FETCH_EXCHANGE_RATE_ERROR = 'app/currency/CURRENCY_SELECTED_ERROR';

// ================ Reducer ================ //

const initialState = {
  exchangeRate: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_EXCHANGE_RATE_REQUEST:
      return state;
    case FETCH_EXCHANGE_RATE_SUCCESS:
      return {
        ...state,
        exchangeRate: payload,
      };
    case FETCH_EXCHANGE_RATE_ERROR:
      return {
        ...state,
        exchangeRate: null,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchExchangeRateRequest = () => ({
  type: FETCH_EXCHANGE_RATE_REQUEST,
});
export const fetchExchangeRateSuccess = exchangeRate => ({
  type: FETCH_EXCHANGE_RATE_SUCCESS,
  payload: exchangeRate,
});
export const fetchExchangeRateError = error => ({
  type: FETCH_EXCHANGE_RATE_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const fetchExchangeRate = () => async dispatch => {
  try {
    const response = await fetchCurrencyExchangeRate();

    if (response) {
      dispatch(fetchExchangeRateSuccess(response));
    }
  } catch (error) {
    console.log('Error fetching exchange rate.', error);
    dispatch(fetchExchangeRateError(storableError(error)));
  }
};
