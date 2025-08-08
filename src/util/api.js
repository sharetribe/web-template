// These helpers are calling this template's own server-side routes
// so, they are not directly calling Marketplace API or Integration API.
// You can find these api endpoints from 'server/api/...' directory

import appSettings from '../config/settings';
import { types as sdkTypes, transit } from './sdkLoader';
import Decimal from 'decimal.js';

export const apiBaseUrl = marketplaceRootURL => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  if (typeof window === 'undefined') return marketplaceRootURL ? marketplaceRootURL.replace(/\/$/, '') : process.env.RENDER_EXTERNAL_URL; // [SKYFARER]
  // Otherwise, use the given marketplaceRootURL parameter or the same domain and port as the frontend
  return marketplaceRootURL ? marketplaceRootURL.replace(/\/$/, '') : `${window.location.origin}`;
};

// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `server/api-util/sdk.js`
export const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sdkTypes.BigDecimal,
    customType: Decimal,
    writer: v => new sdkTypes.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];

const serialize = data => {
  return transit.write(data, { typeHandlers, verbose: appSettings.sdk.transitVerbose });
};

const deserialize = str => {
  return transit.read(str, { typeHandlers });
};

const methods = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

// If server/api returns data from SDK, you should set Content-Type to 'application/transit+json'
const request = (path, options = {}) => {
  const url = `${apiBaseUrl()}${path}`;
  const { credentials, headers, body, ...rest } = options;

  // If headers are not set, we assume that the body should be serialized as transit format.
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;
  const bodyMaybe = shouldSerializeBody ? { body: serialize(body) } : {};

  const fetchOptions = {
    credentials: credentials || 'include',
    // Since server/api mostly talks to Marketplace API using SDK,
    // we default to 'application/transit+json' as content type (as SDK uses transit).
    headers: headers || { 'Content-Type': 'application/transit+json' },
    ...bodyMaybe,
    ...rest,
  };

  return window.fetch(url, fetchOptions).then(res => {
    const contentTypeHeader = res.headers.get('Content-Type');
    const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

    if (res.status >= 400) {
      return res.json().then(data => {
        let e = new Error();
        e = Object.assign(e, data);

        throw e;
      });
    }
    if (contentType === 'application/transit+json') {
      return res.text().then(deserialize);
    } else if (contentType === 'application/json') {
      return res.json();
    }
    return res.text();
  });
};

// Keep the previous parameter order for the post method.
// For now, only POST has own specific function, but you can create more or use request directly.
const post = (path, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: methods.POST,
    body,
  };

  return request(path, requestOptions);
};

// [SKYFARER]
// Keep the previous parameter order for the get method.
const get = path => {
  const requestOptions = {
    method: methods.GET,
  };

  return request(path, requestOptions);
};

// Fetch transaction line items from the local API endpoint.
//
// See `server/api/transaction-line-items.js` to see what data should
// be sent in the body.
export const transactionLineItems = body => {
  return post('/api/transaction-line-items', body);
};

// Initiate a privileged transaction.
//
// With privileged transitions, the transactions need to be created
// from the backend. This endpoint enables sending the order data to
// the local backend, and passing that to the Marketplace API.
//
// See `server/api/initiate-privileged.js` to see what data should be
// sent in the body.
export const initiatePrivileged = body => {
  return post('/api/initiate-privileged', body);
};

// Transition a transaction with a privileged transition.
//
// This is similar to the `initiatePrivileged` above. It will use the
// backend for the transition. The backend endpoint will add the
// payment line items to the transition params.
//
// See `server/api/transition-privileged.js` to see what data should
// be sent in the body.
export const transitionPrivileged = body => {
  return post('/api/transition-privileged', body);
};

// Create user with identity provider (e.g. Facebook or Google)
//
// If loginWithIdp api call fails and user can't authenticate to Marketplace API with idp
// we will show option to create a new user with idp.
// For that user needs to confirm data fetched from the idp.
// After the confirmation, this endpoint is called to create a new user with confirmed data.
//
// See `server/api/auth/createUserWithIdp.js` to see what data should
// be sent in the body.
export const createUserWithIdp = body => {
  return post('/api/auth/create-user-with-idp', body);
};

// [SKYFARER]
// Google
export const getAuthURL = body => {
  return get('/api/google/generate-auth-url', body);
};

export const saveGoogleAuthToken = ({ code, listingId }) => {
  // Conditionally add listingId to the query string only if it's not null
  const query = `?code=${code}` + (listingId ? `&listingId=${listingId}` : '');
  console.log(query, 'queryquery');
  return get(`/api/google/save-auth-token${query}`);
};


export const revokeGoogleAuthToken = () => {
  return get(`/api/google/revoke-token`);
};

export const deleteGoogleEventByID = body => {
  return post(`/api/google/delete-google-event-by-id`, body);
};

export const fetchEventsFromGoogleCalendar = body => {
  return post(`/api/google/fetch-events-from-google-calendar`, body);
};

export const createGoogleMeeting = body => {
  return post(`/api/google/create-google-meeting`, body);
};

export const rescheduleGoogleEvent = body => {
  return post(`/api/google/reschedule-event`, body);
};

export const cancelGoogleEvent = body => {
  return post(`/api/google/cancel-event`, body);
};

export const rescheduleRequest = body => {
  return post(`/api/reschedule/request`, body);
};

export const acceptRescheduleRequest = body => {
  return post(`/api/reschedule/accept`, body);
};

// Create or get a customer in Voucherify
// TODO: I would like to move this to util/vouchers.js and import post from there
// or just follow the same pattern as the other api calls, but I like the encapsulation
export const voucherifyBackend = {
  customers: {
    createOrGet: body => {
      if (!process.env.REACT_APP_VOUCHERIFY_ENABLED) return;
      return post('/api/vouchers/customers', body);
    },
  },

  vouchers: {
    redeem: body => {
      if (!process.env.REACT_APP_VOUCHERIFY_ENABLED) return;
      return post('/api/vouchers/redeem', body);
    }
  }
}

export const aiBackend = {
  instructors: body => {
    return post('/api/ai/instructor-matches', body);
  }
}
// [/SKYFARER]

export const adjustBooking = body => {
  return post('/api/adjust-booking', body);
};

export const updateTransactionMetadata = body => {
  return post('/api/update-transaction-metadata', body);
};

