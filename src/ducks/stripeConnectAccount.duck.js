// This file deals with Marketplace API which will create Stripe Custom Connect accounts
// from given bank_account tokens.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as log from '../util/log';
import { storableError } from '../util/errors';

// ================ Async thunks ================ //

///////////////////////////
// Create Stripe Account //
///////////////////////////
const createStripeAccountPayloadCreator = (params, { extra: sdk, rejectWithValue }) => {
  if (typeof window === 'undefined' || !window.Stripe) {
    throw new Error('Stripe must be loaded for submitting PayoutPreferences');
  }
  const {
    country,
    accountType,
    businessProfileMCC,
    businessProfileURL,
    stripePublishableKey,
  } = params;
  const stripe = window.Stripe(stripePublishableKey);

  // Capabilities are a collection of settings that can be requested for each provider.
  // What Capabilities are required determines what information Stripe requires to be
  // collected from the providers.
  // You can read more from here: https://stripe.com/docs/connect/capabilities-overview
  // Note: with default processes, both 'card_payments' and 'transfers' are required.
  const requestedCapabilities = ['card_payments', 'transfers'];

  const accountInfo = {
    business_type: accountType,
    tos_shown_and_accepted: true,
  };

  return stripe
    .createToken('account', accountInfo)
    .then(response => {
      const accountToken = response.token.id;
      return sdk.stripeAccount.create(
        {
          country,
          accountToken,
          requestedCapabilities,
          businessProfileMCC,
          businessProfileURL,
        },
        { expand: true }
      );
    })
    .then(response => {
      const stripeAccount = response.data.data;
      return stripeAccount;
    })
    .catch(err => {
      const e = storableError(err);
      const stripeMessage =
        e.apiErrors && e.apiErrors.length > 0 && e.apiErrors[0].meta
          ? e.apiErrors[0].meta.stripeMessage
          : null;
      log.error(err, 'create-stripe-account-failed', { stripeMessage });
      return rejectWithValue(e);
    });
};
export const createStripeAccountThunk = createAsyncThunk(
  'stripeConnectAccount/createStripeAccount',
  createStripeAccountPayloadCreator
);
// Backward compatible wrapper function
export const createStripeAccount = params => dispatch => {
  return dispatch(createStripeAccountThunk(params)).unwrap();
};

///////////////////////////
// Update Stripe Account //
///////////////////////////
const updateStripeAccountPayloadCreator = (params, { extra: sdk, rejectWithValue }) => {
  // This function is used for updating the bank account token
  // but could be expanded to other information as well.
  //
  // If the Stripe account has been created with account token,
  // you need to use account token also to update the account.
  // By default the account token will not be used.
  // See API reference for more information:
  // https://www.sharetribe.com/api-reference/?javascript#update-stripe-account
  return sdk.stripeAccount
    .update({ requestedCapabilities: ['card_payments', 'transfers'] }, { expand: true })
    .then(response => {
      const stripeAccount = response.data.data;
      return stripeAccount;
    })
    .catch(err => {
      const e = storableError(err);
      const stripeMessage =
        e.apiErrors && e.apiErrors.length > 0 && e.apiErrors[0].meta
          ? e.apiErrors[0].meta.stripeMessage
          : null;
      log.error(err, 'update-stripe-account-failed', { stripeMessage });
      return rejectWithValue(e);
    });
};
export const updateStripeAccountThunk = createAsyncThunk(
  'stripeConnectAccount/updateStripeAccount',
  updateStripeAccountPayloadCreator
);
// Backward compatible wrapper function
export const updateStripeAccount = params => dispatch => {
  return dispatch(updateStripeAccountThunk(params)).unwrap();
};

//////////////////////////
// Fetch Stripe Account //
//////////////////////////
const fetchStripeAccountPayloadCreator = (params, { extra: sdk, rejectWithValue }) => {
  return sdk.stripeAccount
    .fetch()
    .then(response => {
      const stripeAccount = response.data.data;
      return stripeAccount;
    })
    .catch(err => {
      const e = storableError(err);
      const stripeMessage =
        e.apiErrors && e.apiErrors.length > 0 && e.apiErrors[0].meta
          ? e.apiErrors[0].meta.stripeMessage
          : null;
      log.error(err, 'fetch-stripe-account-failed', { stripeMessage });
      return rejectWithValue(e);
    });
};
export const fetchStripeAccountThunk = createAsyncThunk(
  'stripeConnectAccount/fetchStripeAccount',
  fetchStripeAccountPayloadCreator
);
// Backward compatible wrapper function
export const fetchStripeAccount = params => dispatch => {
  return dispatch(fetchStripeAccountThunk(params)).unwrap();
};

/////////////////////////////////////
// Get Stripe Connect Account Link //
/////////////////////////////////////
const getStripeConnectAccountLinkPayloadCreator = (params, { extra: sdk, rejectWithValue }) => {
  const { failureURL, successURL, type } = params;

  // Read more from collection_options and verification updates from Stripe's Docs:
  // https://docs.stripe.com/connect/handle-verification-updates
  return sdk.stripeAccountLinks
    .create({
      failureURL,
      successURL,
      type,
      collectionOptions: {
        fields: 'currently_due',
        future_requirements: 'include',
      },
    })
    .then(response => {
      // Return the account link
      return response.data.data.attributes.url;
    })
    .catch(err => {
      const e = storableError(err);
      const stripeMessage =
        e.apiErrors && e.apiErrors.length > 0 && e.apiErrors[0].meta
          ? e.apiErrors[0].meta.stripeMessage
          : null;
      log.error(err, 'get-stripe-account-link-failed', { stripeMessage });
      return rejectWithValue(e);
    });
};
export const getStripeConnectAccountLinkThunk = createAsyncThunk(
  'stripeConnectAccount/getStripeConnectAccountLink',
  getStripeConnectAccountLinkPayloadCreator
);
// Backward compatible wrapper function
export const getStripeConnectAccountLink = params => dispatch => {
  return dispatch(getStripeConnectAccountLinkThunk(params)).unwrap();
};

// ================ Slice ================ //

const stripeConnectAccountSlice = createSlice({
  name: 'stripeConnectAccount',
  initialState: {
    createStripeAccountInProgress: false,
    createStripeAccountError: null,
    updateStripeAccountInProgress: false,
    updateStripeAccountError: null,
    fetchStripeAccountInProgress: false,
    fetchStripeAccountError: null,
    getAccountLinkInProgress: false,
    getAccountLinkError: null,
    stripeAccount: null,
    stripeAccountFetched: false,
  },
  reducers: {
    stripeAccountClearError: state => {
      return {
        createStripeAccountInProgress: false,
        createStripeAccountError: null,
        updateStripeAccountInProgress: false,
        updateStripeAccountError: null,
        fetchStripeAccountInProgress: false,
        fetchStripeAccountError: null,
        getAccountLinkInProgress: false,
        getAccountLinkError: null,
        stripeAccount: null,
        stripeAccountFetched: false,
      };
    },
    updateStripeConnectAccount: (state, action) => {
      state.stripeAccount = action.payload;
      state.stripeAccountFetched = true;
    },
  },
  extraReducers: builder => {
    builder
      // Create Stripe Account cases
      .addCase(createStripeAccountThunk.pending, state => {
        state.createStripeAccountError = null;
        state.createStripeAccountInProgress = true;
      })
      .addCase(createStripeAccountThunk.fulfilled, (state, action) => {
        state.createStripeAccountInProgress = false;
        state.stripeAccount = action.payload;
        state.stripeAccountFetched = true;
      })
      .addCase(createStripeAccountThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.createStripeAccountError = action.payload;
        state.createStripeAccountInProgress = false;
      })
      // Update Stripe Account cases
      .addCase(updateStripeAccountThunk.pending, state => {
        state.updateStripeAccountError = null;
        state.updateStripeAccountInProgress = true;
      })
      .addCase(updateStripeAccountThunk.fulfilled, (state, action) => {
        state.updateStripeAccountInProgress = false;
        state.stripeAccount = action.payload;
        state.stripeAccountFetched = true;
      })
      .addCase(updateStripeAccountThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.updateStripeAccountError = action.payload;
        state.updateStripeAccountInProgress = false;
      })
      // Fetch Stripe Account cases
      .addCase(fetchStripeAccountThunk.pending, state => {
        state.fetchStripeAccountError = null;
        state.fetchStripeAccountInProgress = true;
      })
      .addCase(fetchStripeAccountThunk.fulfilled, (state, action) => {
        state.fetchStripeAccountInProgress = false;
        state.stripeAccount = action.payload;
        state.stripeAccountFetched = true;
      })
      .addCase(fetchStripeAccountThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.fetchStripeAccountError = action.payload;
        state.fetchStripeAccountInProgress = false;
      })
      // Get Account Link cases
      .addCase(getStripeConnectAccountLinkThunk.pending, state => {
        state.getAccountLinkError = null;
        state.getAccountLinkInProgress = true;
      })
      .addCase(getStripeConnectAccountLinkThunk.fulfilled, state => {
        state.getAccountLinkInProgress = false;
      })
      .addCase(getStripeConnectAccountLinkThunk.rejected, (state, action) => {
        console.error(action.payload);
        state.getAccountLinkInProgress = false;
        state.getAccountLinkError = action.payload;
      });
  },
});

// Export the action creators
export const {
  stripeAccountClearError,
  updateStripeConnectAccount,
} = stripeConnectAccountSlice.actions;

export default stripeConnectAccountSlice.reducer;
