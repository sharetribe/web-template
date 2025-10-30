import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import pick from 'lodash/pick';
import * as log from '../util/log';
import { storableError } from '../util/errors';

// ================ Async thunks ================ //

////////////////////////////
// Create Stripe Customer //
////////////////////////////
const createStripeCustomerPayloadCreator = (
  { stripePaymentMethodId },
  { extra: sdk, rejectWithValue }
) => {
  return sdk.stripeCustomer
    .create({ stripePaymentMethodId }, { expand: true, include: ['defaultPaymentMethod'] })
    .then(response => {
      const stripeCustomer = response.data.data;
      return stripeCustomer;
    })
    .catch(e => {
      const error = storableError(e);
      log.error(error, 'create-stripe-user-failed');
      return rejectWithValue(error);
    });
};
export const createStripeCustomerThunk = createAsyncThunk(
  'paymentMethods/createStripeCustomer',
  createStripeCustomerPayloadCreator
);
// Backward compatible wrapper functions
export const createStripeCustomer = stripePaymentMethodId => dispatch => {
  return dispatch(createStripeCustomerThunk({ stripePaymentMethodId })).unwrap();
};

////////////////////////
// Add Payment Method //
////////////////////////
const addPaymentMethodPayloadCreator = (
  { stripePaymentMethodId },
  { extra: sdk, rejectWithValue }
) => {
  return sdk.stripeCustomer
    .addPaymentMethod({ stripePaymentMethodId }, { expand: true })
    .then(response => {
      const stripeCustomer = response.data.data;
      return stripeCustomer;
    })
    .catch(e => {
      const error = storableError(e);
      log.error(error, 'add-payment-method-failed');
      return rejectWithValue(error);
    });
};
export const addPaymentMethodThunk = createAsyncThunk(
  'paymentMethods/addPaymentMethod',
  addPaymentMethodPayloadCreator
);
// Backward compatible wrapper functions
export const addPaymentMethod = stripePaymentMethodId => dispatch => {
  return dispatch(addPaymentMethodThunk({ stripePaymentMethodId })).unwrap();
};

///////////////////////////
// Delete Payment Method //
///////////////////////////
const deletePaymentMethodPayloadCreator = (_, { extra: sdk, rejectWithValue }) => {
  return sdk.stripeCustomer
    .deletePaymentMethod({}, { expand: true })
    .then(response => {
      const stripeCustomer = response.data.data;
      return stripeCustomer;
    })
    .catch(e => {
      const error = storableError(e);
      log.error(error, 'delete-payment-method-failed');
      return rejectWithValue(error);
    });
};
export const deletePaymentMethodThunk = createAsyncThunk(
  'paymentMethods/deletePaymentMethod',
  deletePaymentMethodPayloadCreator
);
// Backward compatible wrapper functions
export const deletePaymentMethod = () => dispatch => {
  return dispatch(deletePaymentMethodThunk()).unwrap();
};

export const updatePaymentMethod = stripePaymentMethodId => (dispatch, getState, sdk) => {
  return dispatch(deletePaymentMethod())
    .then(() => {
      return dispatch(addPaymentMethod(stripePaymentMethodId));
    })
    .catch(e => {
      log.error(storableError(e), 'updating-payment-method-failed');
    });
};

// This function helps to choose correct thunk function
export const savePaymentMethod = (stripeCustomer, stripePaymentMethodId) => (
  dispatch,
  getState,
  sdk
) => {
  const hasAlreadyDefaultPaymentMethod =
    stripeCustomer && stripeCustomer.defaultPaymentMethod && stripeCustomer.defaultPaymentMethod.id;

  const savePromise =
    !stripeCustomer || !stripeCustomer.id
      ? dispatch(createStripeCustomer(stripePaymentMethodId))
      : hasAlreadyDefaultPaymentMethod
      ? dispatch(updatePaymentMethod(stripePaymentMethodId))
      : dispatch(addPaymentMethod(stripePaymentMethodId));

  return savePromise
    .then(response => {
      const {
        createStripeCustomerError,
        addPaymentMethodError,
        deletePaymentMethodError,
      } = getState().paymentMethods;

      // If there are any errors, return those errors
      if (createStripeCustomerError || addPaymentMethodError || deletePaymentMethodError) {
        return {
          errors: { createStripeCustomerError, addPaymentMethodError, deletePaymentMethodError },
        };
      }
      return response;
    })
    .catch(e => {
      // errors are already catched in other thunk functions.
    });
};

// ================ Slice ================ //

const paymentMethodsSlice = createSlice({
  name: 'paymentMethods',
  initialState: {
    addPaymentMethodInProgress: null,
    addPaymentMethodError: null,
    deletePaymentMethodInProgress: null,
    deletePaymentMethodError: null,
    createStripeCustomerInProgress: null,
    createStripeCustomerError: null,
    stripeCustomer: null,
  },
  reducers: {
    setInitialValues: (state, action) => {
      const initialState = {
        addPaymentMethodInProgress: null,
        addPaymentMethodError: null,
        deletePaymentMethodInProgress: null,
        deletePaymentMethodError: null,
        createStripeCustomerInProgress: null,
        createStripeCustomerError: null,
        stripeCustomer: null,
      };
      return { ...initialState, ...pick(action.payload, Object.keys(initialState)) };
    },
  },
  extraReducers: builder => {
    builder
      // Create Stripe Customer cases
      .addCase(createStripeCustomerThunk.pending, state => {
        state.createStripeCustomerError = null;
        state.createStripeCustomerInProgress = true;
      })
      .addCase(createStripeCustomerThunk.fulfilled, (state, action) => {
        state.createStripeCustomerInProgress = false;
        state.stripeCustomer = action.payload;
      })
      .addCase(createStripeCustomerThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.createStripeCustomerError = action.payload;
        state.createStripeCustomerInProgress = false;
      })
      // Add Payment Method cases
      .addCase(addPaymentMethodThunk.pending, state => {
        state.addPaymentMethodError = null;
        state.addPaymentMethodInProgress = true;
      })
      .addCase(addPaymentMethodThunk.fulfilled, (state, action) => {
        state.addPaymentMethodInProgress = false;
        state.stripeCustomer = action.payload;
      })
      .addCase(addPaymentMethodThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.addPaymentMethodError = action.payload;
        state.addPaymentMethodInProgress = false;
      })
      // Delete Payment Method cases
      .addCase(deletePaymentMethodThunk.pending, state => {
        state.deletePaymentMethodError = null;
        state.deletePaymentMethodInProgress = true;
      })
      .addCase(deletePaymentMethodThunk.fulfilled, state => {
        state.deletePaymentMethodInProgress = false;
      })
      .addCase(deletePaymentMethodThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.deletePaymentMethodError = action.payload;
        state.deletePaymentMethodInProgress = false;
      });
  },
});

// Export the action creator for setInitialValues
export const { setInitialValues } = paymentMethodsSlice.actions;

export default paymentMethodsSlice.reducer;
