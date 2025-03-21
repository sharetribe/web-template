/**
 * Error logging
 *
 * Can be used to log errors to console or and eternal
 * error logging system, like Sentry for example.
 *
 */

import * as Sentry from '@sentry/browser';
import appSettings from '../config/settings';

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

const setCause = (error, cause) => {
  const seenErrors = new WeakSet();

  const setCauseIfNoExistingCause = (error, cause) => {
    if (seenErrors.has(error)) {
      return;
    }
    if (error.cause) {
      seenErrors.add(error);
      return setCauseIfNoExistingCause(error.cause, cause);
    }
    error.cause = cause;
  };

  setCauseIfNoExistingCause(error, cause);
};

export const onRecoverableError = (error, componentStack) => {
  let data = {};

  if (componentStack) {
    // Generating this synthetic error allows monitoring services to apply sourcemaps
    // to unminify the stacktrace and make it readable.
    const errorBoundaryError = new Error(error.message);
    errorBoundaryError.name = `React ErrorBoundary ${errorBoundaryError.name}`;
    errorBoundaryError.stack = componentStack;

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
    setCause(error, errorBoundaryError);

    data.componentStack = componentStack;
  }

  // Replace with your error monitoring service.
  error(error, 'recoverable-error', data);
};
