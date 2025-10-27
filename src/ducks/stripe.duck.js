import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as log from '../util/log';
import { storableError } from '../util/errors';

// https://stripe.com/docs/api/payment_intents/object#payment_intent_object-status
const STRIPE_PI_HAS_PASSED_CONFIRM = ['processing', 'requires_capture', 'canceled', 'succeeded'];

// ================ Async thunks ================ //

/////////////////////////////
// Retrieve Payment Intent //
/////////////////////////////
const retrievePaymentIntentPayloadCreator = (params, { rejectWithValue }) => {
  const { stripe, stripePaymentIntentClientSecret } = params;

  return stripe
    .retrievePaymentIntent(stripePaymentIntentClientSecret)
    .then(response => {
      if (response.error) {
        return Promise.reject(response);
      } else {
        return response;
      }
    })
    .catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);

      // Log error
      const { code, doc_url, message, payment_intent } = err.error || {};
      const loggableError = err.error
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: payment_intent
              ? payment_intent.status
              : 'no payment_intent included',
          }
        : e;
      log.error(loggableError, 'stripe-retrieve-payment-intent-failed', {
        stripeMessage: loggableError.message,
      });
      return rejectWithValue(e);
    });
};
export const retrievePaymentIntentThunk = createAsyncThunk(
  'stripe/retrievePaymentIntent',
  retrievePaymentIntentPayloadCreator
);
// Backward compatible wrapper function
export const retrievePaymentIntent = params => dispatch => {
  return dispatch(retrievePaymentIntentThunk(params)).unwrap();
};

//////////////////////////
// Confirm Card Payment //
//////////////////////////
const confirmCardPaymentPayloadCreator = (params, { rejectWithValue }) => {
  // It's required to use the same instance of Stripe as where the card has been created
  // so that's why Stripe needs to be passed here and we can't create a new instance.
  const { stripe, paymentParams, stripePaymentIntentClientSecret } = params;
  const transactionId = params.orderId;

  // When using default payment method paymentParams.payment_method is
  // already set Marketplace API side, when request-payment transition is made
  // so there's no need for paymentParams
  const args = paymentParams
    ? [stripePaymentIntentClientSecret, paymentParams]
    : [stripePaymentIntentClientSecret];

  const doConfirmCardPayment = () =>
    stripe.confirmCardPayment(...args).then(response => {
      if (response.error) {
        return Promise.reject(response);
      } else {
        return { ...response, transactionId };
      }
    });

  // First, check if the payment intent has already been confirmed and it just requires capture.
  return stripe
    .retrievePaymentIntent(stripePaymentIntentClientSecret)
    .then(response => {
      // Handle response.error or response.paymentIntent
      if (response.error) {
        return Promise.reject(response);
      } else if (STRIPE_PI_HAS_PASSED_CONFIRM.includes(response?.paymentIntent?.status)) {
        // Payment Intent has been confirmed already, move forward.
        return { ...response, transactionId };
      } else {
        // If payment intent has not been confirmed yet, confirm it.
        return doConfirmCardPayment();
      }
    })
    .catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);

      // Log error
      const containsPaymentIntent = err.error && err.error.payment_intent;
      const { code, doc_url, message, payment_intent } = containsPaymentIntent ? err.error : {};
      const loggableError = containsPaymentIntent
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: payment_intent.status,
          }
        : e;
      log.error(loggableError, 'stripe-handle-card-payment-failed', {
        stripeMessage: loggableError.message,
      });
      return rejectWithValue(e);
    });
};
export const confirmCardPaymentThunk = createAsyncThunk(
  'stripe/confirmCardPayment',
  confirmCardPaymentPayloadCreator
);
// Backward compatible wrapper function
export const confirmCardPayment = params => dispatch => {
  return dispatch(confirmCardPaymentThunk(params)).unwrap();
};

///////////////////////
// Handle Card Setup //
///////////////////////
const handleCardSetupPayloadCreator = (params, { rejectWithValue }) => {
  // It's required to use the same instance of Stripe as where the card has been created
  // so that's why Stripe needs to be passed here and we can't create a new instance.
  const { stripe, card, setupIntentClientSecret, paymentParams } = params;

  return stripe
    .handleCardSetup(setupIntentClientSecret, card, paymentParams)
    .then(response => {
      if (response.error) {
        return Promise.reject(response);
      } else {
        return response;
      }
    })
    .catch(err => {
      // Unwrap Stripe error.
      const e = err.error || storableError(err);

      // Log error
      const containsSetupIntent = err.error && err.error.setup_intent;
      const { code, doc_url, message, setup_intent } = containsSetupIntent ? err.error : {};
      const loggableError = containsSetupIntent
        ? {
            code,
            message,
            doc_url,
            paymentIntentStatus: setup_intent.status,
          }
        : e;
      log.error(loggableError, 'stripe-handle-card-setup-failed', {
        stripeMessage: loggableError.message,
      });
      return rejectWithValue(e);
    });
};
export const handleCardSetupThunk = createAsyncThunk(
  'stripe/handleCardSetup',
  handleCardSetupPayloadCreator
);
// Backward compatible wrapper function
export const handleCardSetup = params => dispatch => {
  return dispatch(handleCardSetupThunk(params)).unwrap();
};

// ================ Slice ================ //

const stripeSlice = createSlice({
  name: 'stripe',
  initialState: {
    confirmCardPaymentInProgress: false,
    confirmCardPaymentError: null,
    handleCardSetupInProgress: false,
    handleCardSetupError: null,
    paymentIntent: null,
    setupIntent: null,
    retrievePaymentIntentInProgress: false,
    retrievePaymentIntentError: null,
  },
  reducers: {
    stripeAccountClearError: state => {
      return {
        confirmCardPaymentInProgress: false,
        confirmCardPaymentError: null,
        handleCardSetupInProgress: false,
        handleCardSetupError: null,
        paymentIntent: null,
        setupIntent: null,
        retrievePaymentIntentInProgress: false,
        retrievePaymentIntentError: null,
      };
    },
    initializeCardPaymentData: state => {
      state.confirmCardPaymentInProgress = false;
      state.confirmCardPaymentError = null;
      state.paymentIntent = null;
    },
  },
  extraReducers: builder => {
    builder
      // Retrieve Payment Intent cases
      .addCase(retrievePaymentIntentThunk.pending, state => {
        state.retrievePaymentIntentError = null;
        state.retrievePaymentIntentInProgress = true;
      })
      .addCase(retrievePaymentIntentThunk.fulfilled, (state, action) => {
        state.paymentIntent = action.payload.paymentIntent;
        state.retrievePaymentIntentInProgress = false;
      })
      .addCase(retrievePaymentIntentThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.retrievePaymentIntentError = action.payload;
        state.retrievePaymentIntentInProgress = false;
      })
      // Confirm Card Payment cases
      .addCase(confirmCardPaymentThunk.pending, state => {
        state.confirmCardPaymentError = null;
        state.confirmCardPaymentInProgress = true;
      })
      .addCase(confirmCardPaymentThunk.fulfilled, (state, action) => {
        state.paymentIntent = action.payload;
        state.confirmCardPaymentInProgress = false;
      })
      .addCase(confirmCardPaymentThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.confirmCardPaymentError = action.payload;
        state.confirmCardPaymentInProgress = false;
      })
      // Handle Card Setup cases
      .addCase(handleCardSetupThunk.pending, state => {
        state.handleCardSetupError = null;
        state.handleCardSetupInProgress = true;
      })
      .addCase(handleCardSetupThunk.fulfilled, (state, action) => {
        state.setupIntent = action.payload;
        state.handleCardSetupInProgress = false;
      })
      .addCase(handleCardSetupThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.handleCardSetupError = action.payload;
        state.handleCardSetupInProgress = false;
      });
  },
});

// Export the action creators
export const { stripeAccountClearError, initializeCardPaymentData } = stripeSlice.actions;

export default stripeSlice.reducer;
