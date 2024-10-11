import Axios from 'axios';
import Decimal from 'decimal.js';
import { createInstance } from 'sharetribe-flex-sdk';
import defaultConfig from '../../config/configDefault';
import appSettings from '../../config/settings';
import * as apiUtils from '../../util/api';
import { types as sdkTypes, transit } from '../../util/sdkLoader';

const port = process.env.REACT_APP_DEV_API_SERVER_PORT ?? 3000;
const environment = process.env.NODE_ENV;

// Only this sdk to check authInfo
const sdk = createInstance({
  transitVerbose: appSettings.sdk.transitVerbose,
  clientId: appSettings.sdk.clientId,
  secure: appSettings.usingSSL,
  typeHandlers: apiUtils.typeHandlers,
});

/**
 * Get the base URL of the API
 *
 * @param {string} [marketplaceRootURL]
 * @returns {string} API base URL
 */
const apiBaseUrl = marketplaceRootURL => {
  const useDevApiServer = environment === 'development' && !!port;

  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return marketplaceRootURL?.replace(/\/$/, '') ?? '';
};

const typeHandlers = [
  {
    type: sdkTypes.BigDecimal,
    customType: Decimal,
    writer: v => new sdkTypes.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];

/**
 * @param {any} data
 * @returns {string} Serialized data
 */
const serialize = data => {
  return transit.write(data, {
    typeHandlers,
    verbose: appSettings.sdk.transitVerbose,
  });
};

/**
 * @param {string} str
 * @returns {any} Deserialized data
 */
const deserialize = str => {
  return transit.read(str, { typeHandlers });
};

/**
 *
 * @param {Object} response - Axios response object
 * @returns {any} Parsed response data
 */
const parseResponseData = response => {
  const { data, headers } = response;
  const contentType = headers['Content-Type'] ?? headers['content-type'];
  if (contentType?.includes('application/transit+json')) {
    return deserialize(data);
  }
  if (contentType?.includes('application/json')) {
    return JSON.parse(data);
  }
  return data;
};

const axios = Axios.create({
  baseURL: apiBaseUrl(defaultConfig.marketplaceRootURL),
});

axios.interceptors.response.use(
  response => {
    const data = parseResponseData(response);
    response.data = data;
    return response;
  },
  error => {
    // If error is AxiosError, we can parse the response data
    const data = error.response ? parseResponseData(error.response) : {};
    let e = new Error();
    e = Object.assign(e, data);
    throw e;
  }
);

const methods = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

const formatBody = (headers, body) => {
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;

  if (shouldSerializeBody) {
    return serialize(body);
  }
  return body;
};

export const request = async (path, options = {}) => {
  const {
    credentials = 'include',
    headers = { 'Content-Type': 'application/transit+json' },
    body,
    method,
    ...rest
  } = options;

  const bodyMaybe = body ? { data: formatBody(headers, body) } : {};

  // Todo: might delete this functionality completely later
  // const authInfo = await sdk.authInfo();

  // const { isAnonymous } = authInfo;

  // if (!isAnonymous) {
  //   const token = await getJwtToken();
  //   fetchOptions.headers.jauthorization = `Bearer ${token}`;
  // }

  const response = await axios.request({
    url: path,
    method,
    headers,
    withCredentials: credentials === 'include',
    responseType: 'text',
    ...bodyMaybe,
    ...rest,
  });

  return response.data;
};

export const getMethod = (path, query, options = {}) => {
  const queryParams = new URLSearchParams(query);
  const pathWithQuery = `${path}?${queryParams}`;

  return request(pathWithQuery, { ...options, method: methods.GET });
};

export const requestMethodWithBody = method => (path, body, options = {}) => {
  return request(path, { ...options, body, method });
};

export const downloadMethod = (path, query, options = {}) => {
  const queryParams = new URLSearchParams(query);
  const pathWithQuery = `${path}?${queryParams}`;

  const url = `${apiBaseUrl()}${pathWithQuery}`;
  const { credentials, headers, body, filename, ...rest } = options;

  const fetchOptions = {
    credentials: credentials || 'include',
    headers: headers || { Accept: '*/*' },
    ...rest,
  };

  return window
    .fetch(url, fetchOptions)
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.blob();
    })
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    });
};

export const postMethod = requestMethodWithBody(methods.POST);
export const patchMethod = requestMethodWithBody(methods.PATCH);
export const putMethod = requestMethodWithBody(methods.PUT);
export const deleteMethod = requestMethodWithBody(methods.DELETE);
