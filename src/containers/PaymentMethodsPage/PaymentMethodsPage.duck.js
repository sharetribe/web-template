import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { setInitialValues as setInitialValuesForPaymentMethods } from '../../ducks/paymentMethods.duck';

// ================ Async thunks ================ //

export const createStripeSetupIntentThunk = createAsyncThunk(
  'PaymentMethodsPage/createStripeSetupIntent',
  (_, { extra: sdk, rejectWithValue }) => {
    return sdk.stripeSetupIntents
      .create()
      .then(response => {
        const setupIntent = response.data.data;
        return setupIntent;
      })
      .catch(e => {
        const error = storableError(e);
        log.error(error, 'create-setup-intent-failed');
        return rejectWithValue(error);
      });
  }
);

export const stripeCustomerThunk = createAsyncThunk(
  'PaymentMethodsPage/stripeCustomer',
  (_, { dispatch, extra: sdk, rejectWithValue }) => {
    const fetchCurrentUserOptions = {
      callParams: { include: ['stripeCustomer.defaultPaymentMethod'] },
      updateHasListings: false,
      updateNotifications: false,
      enforce: true,
    };

    return dispatch(fetchCurrentUser(fetchCurrentUserOptions))
      .then(response => {
        return response;
      })
      .catch(e => {
        const error = storableError(e);
        log.error(error, 'fetch-stripe-customer-failed');
        return rejectWithValue(error);
      });
  }
);

// Backward compatible wrapper functions
export const createStripeSetupIntent = () => dispatch => {
  return dispatch(createStripeSetupIntentThunk()).unwrap();
};

export const stripeCustomer = () => dispatch => {
  return dispatch(stripeCustomerThunk()).unwrap();
};

// ================ Slice ================ //

const paymentMethodsPageSlice = createSlice({
  name: 'PaymentMethodsPage',
  initialState: {
    setupIntentInProgress: false,
    setupIntentError: null,
    setupIntent: null,
    stripeCustomerFetched: false,
    stripeCustomerFetchError: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // Setup Intent cases
      .addCase(createStripeSetupIntentThunk.pending, state => {
        state.setupIntentInProgress = true;
        state.setupIntentError = null;
      })
      .addCase(createStripeSetupIntentThunk.fulfilled, (state, action) => {
        state.setupIntentInProgress = false;
        state.setupIntentError = null;
        state.setupIntent = action.payload;
      })
      .addCase(createStripeSetupIntentThunk.rejected, (state, action) => {
        console.error(action.payload); // eslint-disable-line no-console
        state.setupIntentInProgress = false;
        state.setupIntentError = action.payload;
      })
      // Stripe Customer cases
      .addCase(stripeCustomerThunk.pending, state => {
        state.stripeCustomerFetched = false;
        state.stripeCustomerFetchError = null;
      })
      .addCase(stripeCustomerThunk.fulfilled, state => {
        state.stripeCustomerFetched = true;
      })
      .addCase(stripeCustomerThunk.rejected, (state, action) => {
        console.error(action.payload); // eslint-disable-line no-console
        state.stripeCustomerFetchError = action.payload;
      });
  },
});

export default paymentMethodsPageSlice.reducer;

// ================ Load Data ================ //

export const loadData = () => (dispatch, getState, sdk) => {
  dispatch(setInitialValuesForPaymentMethods());

  return dispatch(stripeCustomer());
};
