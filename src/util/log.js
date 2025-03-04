/**
 * Error logging
 *
 * Can be used to log errors to console or and eternal
 * error logging system, like Sentry for example.
 *
 */

import * as Sentry from '@sentry/browser';
import appSettings from '../config/settings';
import defaultConfig from '../config/configDefault';

const { marketplaceRootURL } = defaultConfig;

const ingoreErrorsMap = {
  ['ResizeObserver loop limit exceeded']: true, // Some exotic browsers seems to emit these.
  ['Error reading']: true, // Ignore file reader errors (ImageFromFile)
  ['AxiosError: Network Error']: true,
};

const pickSelectedErrors = (ignored, entry) => {
  const [key, value] = entry;
  return value === true ? [...ignored, key] : ignored;
};

/**
 * Set up error handling. If a Sentry DSN is
 * provided a Sentry client will be installed.
 */
export const setup = () => {
  if (appSettings.sentryDsn) {
    const ignoreErrors = Object.entries(ingoreErrorsMap).reduce(pickSelectedErrors, []);

    // Configures the Sentry client. Adds a handler for
    // any uncaught exception.
    Sentry.init({
      dsn: appSettings.sentryDsn,
      environment: appSettings.env,
      ignoreErrors,
      // eslint-disable-next-line new-cap
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: appSettings.dev ? 1.0 : 0.1,
      replaysSessionSampleRate: appSettings.dev ? 1.0 : 0.1, // Production should sets the sample rate at 10%. You may want to change it to 100% while in development
      replaysOnErrorSampleRate: 1.0,

      tracePropagationTargets: [
        'localhost',
        'flex-api.sharetribe.com',
        marketplaceRootURL,
        /^\/api\//,
      ],
    });
  }
};

/**
 * Set user ID for the logger so that it
 * can be attached to Sentry issues.
 *
 * @param {String} userId ID of current user
 */
export const setUserId = userId => {
  Sentry.setUser({ id: userId });
};

/**
 * Clears the user ID.
 */

export const clearUserId = () => {
  Sentry.setUser(null);
};

const printAPIErrorsAsConsoleTable = apiErrors => {
  if (apiErrors != null && apiErrors.length > 0 && typeof console.table === 'function') {
    console.log('Errors returned by Marketplace API call:');
    console.table(apiErrors.map(err => ({ status: err.status, code: err.code, ...err.meta })));
  }
};

const responseAPIErrors = error => {
  return error && error.data && error.data.errors ? error.data.errors : [];
};

const responseApiErrorInfo = err =>
  responseAPIErrors(err).map(e => ({
    status: e.status,
    code: e.code,
    meta: e.meta,
  }));

/**
 * Logs an exception. If Sentry is configured
 * sends the error information there. Otherwise
 * prints the error to the console.
 *
 * @param {Error} e Error that occurred
 * @param {String} code Error code
 * @param {Object} data Additional data to be sent to Sentry
 */
export const error = (e, code, data) => {
  const apiErrors = responseApiErrorInfo(e);
  if (appSettings.sentryDsn) {
    const extra = { ...data, apiErrorData: apiErrors };

    Sentry.withScope(scope => {
      scope.setTag('code', code);
      Object.keys(extra).forEach(key => {
        scope.setExtra(key, extra[key]);
      });
      Sentry.captureException(e);
    });

    printAPIErrorsAsConsoleTable(apiErrors);
  } else {
    console.error(e);
    console.error('Error code:', code, 'data:', data);
    printAPIErrorsAsConsoleTable(apiErrors);
  }
};
