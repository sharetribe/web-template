/**
 * Error logging for the Sharetribe Web Template's server. Can be used to
 * strap on an external error logging service like Sentry
 * or just plain printing errors to the log.
 */

const Sentry = require('@sentry/node');

const ENV = process.env.REACT_APP_ENV;
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

const ingoreErrorsMap = {
  ['AxiosError: Network Error']: true,
};

const pickSelectedErrors = (ignored, entry) => {
  const [key, value] = entry;
  return value === true ? [...ignored, key] : ignored;
};

// Initialize Sentry ~ the way their suggested approach using instrument.js would have done it.
if (SENTRY_DSN) {
  const ignoreErrors = Object.entries(ingoreErrorsMap).reduce(pickSelectedErrors, []);

  // Configure the Sentry client. As is, this catches unhandled
  // exceptions from starting the server etc. but does not catch the
  // ones thrown from Express.js middleware functions. For those
  // an error handler has to be added to the Express app.
  Sentry.init({ dsn: SENTRY_DSN, environment: ENV, ignoreErrors });
}

/**
 * Returns a Sentry error handler in case
 * Sentry client is set up.
 */
exports.setupExpressErrorHandler = app => {
  if (SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
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
 * Logs a error. If Sentry client is set up
 * passes the error to that. Otherwise prints
 * the error to `console.error`.
 *
 * @param {Error} e Error that occurred
 * @param {String} code Error code
 * @param {Object} data Additional data to be sent to Sentry
 */
exports.error = (e, code, data) => {
  if (SENTRY_DSN) {
    const extra = { ...data, apiErrorData: responseApiErrorInfo(e) };

    Sentry.withScope(scope => {
      scope.setTag('code', code);
      Object.keys(extra).forEach(key => {
        scope.setExtra(key, extra[key]);
      });
      Sentry.captureException(e);
    });
  }
  // Let's log always to stdout
  console.error(e);
  console.error(code);
  console.error(data);
};
