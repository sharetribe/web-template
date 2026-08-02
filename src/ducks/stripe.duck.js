import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as log from '../util/log';
import { storableError } from '../util/errors';
import { getPaymentMethodConfig } from '../transactions/paymentMethods';

// https://stripe.com/docs/api/payment_intents/object#payment_intent_object-status
const STRIPE_PI_HAS_PASSED_CONFIRM = ['processing', 'requires_capture', 'canceled', 'succeeded'];

/**
 * Retrieve PaymentIntent; if already past confirm, return { paymentIntent, transactionId }.
 * Otherwise run confirmPayment and return the same shape. Shared by card and redirect confirms.
 *
 * @param {Object} params
 * @param {Object} params.stripe Stripe.js instance
 * @param {string} params.stripePaymentIntentClientSecret
 * @param {*} params.transactionId order / transaction id attached to the result
 * @param {string} params.errorEventName log.error event id on failure
 * @param {Object} [params.errorEventDetails] extra fields for log.error
 * @param {Function} params.confirmPayment () => Promise<Stripe response>
 * @param {Function} params.rejectWithValue
 */
const confirmPaymentIntentIfNeeded = ({
  stripe,
  stripePaymentIntentClientSecret,
  transactionId,
  errorEventName,
  errorEventDetails = {},
  confirmPayment,
  rejectWithValue,
}) => {
  return stripe
    .retrievePaymentIntent(stripePaymentIntentClientSecret)
    .then(response => {
      if (response.error) {
        return Promise.reject(response);
      }
      if (STRIPE_PI_HAS_PASSED_CONFIRM.includes(response?.paymentIntent?.status)) {
        return { paymentIntent: response.paymentIntent, transactionId };
      }
      return confirmPayment().then(confirmResponse => {
        if (confirmResponse.error) {
          return Promise.reject(confirmResponse);
        }
        return { paymentIntent: confirmResponse.paymentIntent, transactionId };
      });
    })
    .catch(err => {
      const e = err.error || storableError(err);
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
      log.error(loggableError, errorEventName, {
        stripeMessage: loggableError.message,
        ...errorEventDetails,
      });
      return rejectWithValue(e);
    });
};

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

  return confirmPaymentIntentIfNeeded({
    stripe,
    stripePaymentIntentClientSecret,
    transactionId,
    errorEventName: 'stripe-handle-card-payment-failed',
    confirmPayment: () => stripe.confirmCardPayment(...args),
    rejectWithValue,
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

//////////////////////////////////////
// Confirm redirect payment methods //
//////////////////////////////////////
const confirmRedirectPaymentPayloadCreator = (params, { rejectWithValue }) => {
  const {
    stripe,
    stripePaymentIntentClientSecret,
    billingDetails,
    returnUrl,
    orderId,
    checkoutPaymentMethod,
  } = params;

  if (!checkoutPaymentMethod) {
    const e = storableError(
      new Error('checkoutPaymentMethod is required to confirm a redirect payment')
    );
    log.error(e, 'stripe-handle-redirect-payment-failed', {
      stripeMessage: e.message,
    });
    return rejectWithValue(e);
  }

  const transactionId = orderId;
  const { paymentMethodType } = getPaymentMethodConfig(checkoutPaymentMethod).stripe;

  // Note 1: not in use yet. Code is here for reference.
  // Note 2: The Stripe.js page emphasizes Payment Element + merge.
  // Manual payment_method_data.type without Elements is less shown there,
  // but docs say confirmParams accepts Payment Intents confirm params,
  // and the REST confirm API documents type / ideal / mobilepay exactly this way.
  const confirmRedirectPaymentWithStripe = () => {
    return stripe.confirmPayment({
      clientSecret: stripePaymentIntentClientSecret,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          type: paymentMethodType,
          billing_details: billingDetails,
        },
      },
    });
  };

  return confirmPaymentIntentIfNeeded({
    stripe,
    stripePaymentIntentClientSecret,
    transactionId,
    errorEventName: 'stripe-handle-redirect-payment-failed',
    errorEventDetails: { checkoutPaymentMethod },
    confirmPayment: confirmRedirectPaymentWithStripe,
    rejectWithValue,
  });
};

export const confirmRedirectPaymentThunk = createAsyncThunk(
  'stripe/confirmRedirectPayment',
  confirmRedirectPaymentPayloadCreator
);

export const confirmRedirectPayment = params => dispatch => {
  return dispatch(confirmRedirectPaymentThunk(params)).unwrap();
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
        state.paymentIntent = action.payload.paymentIntent;
        state.confirmCardPaymentInProgress = false;
      })
      .addCase(confirmCardPaymentThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.confirmCardPaymentError = action.payload;
        state.confirmCardPaymentInProgress = false;
      })
      // Confirm redirect payment (shares confirmCardPayment* UI state)
      .addCase(confirmRedirectPaymentThunk.pending, state => {
        state.confirmCardPaymentError = null;
        state.confirmCardPaymentInProgress = true;
      })
      .addCase(confirmRedirectPaymentThunk.fulfilled, (state, action) => {
        state.paymentIntent = action.payload.paymentIntent;
        state.confirmCardPaymentInProgress = false;
      })
      .addCase(confirmRedirectPaymentThunk.rejected, (state, action) => {
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
