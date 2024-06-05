const passport = require('passport');
const passportFacebook = require('passport-facebook');
const loginWithIdp = require('./loginWithIdp');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const rootUrl = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const clientID = process.env.REACT_APP_FACEBOOK_APP_ID;
const clientSecret = process.env.FACEBOOK_APP_SECRET;

const FacebookStrategy = passportFacebook.Strategy;
let callbackURL = null;

const useDevApiServer = process.env.NODE_ENV === 'development' && !!PORT;

if (useDevApiServer) {
  callbackURL = `http://localhost:${PORT}/api/auth/facebook/callback`;
} else {
  callbackURL = `${rootUrl}/api/auth/facebook/callback`;
}

const strategyOptions = {
  clientID,
  clientSecret,
  callbackURL,
  profileFields: ['id', 'name', 'emails'],
  passReqToCallback: true,
};

/**
 * Function Passport calls when a redirect returns the user from Facebook to the application.
 *
 * Normally with Passport, this function is used to validate the received user data, and possibly
 * create a new user and the `done` callback is a session management function provided by Passport.
 * In our case, the Sharetribe SDK handles user creation and session management. Therefore, we only
 * extract user data here and provide a custom session management function in
 * `authenticateFacebookCallback`, that servers as the `done` callback here.
 *
 * @param {Object} req Express request object
 * @param {String} accessToken Access token obtained from Facebook
 * @param {String} refreshToken Refres token obtained from Facebook
 * @param {Object} profile Object containing user information
 * @param {Function} done Session management function, introduced in `authenticateFacebookCallback`
 */
const verifyCallback = (req, accessToken, refreshToken, profile, done) => {
  const { email, first_name, last_name } = profile._json;
  const state = req.query.state;
  const queryParams = JSON.parse(state);

  const { from, defaultReturn, defaultConfirm, userType } = queryParams;

  const userData = {
    email,
    firstName: first_name,
    lastName: last_name,
    idpToken: accessToken,
    refreshToken,
    from,
    defaultReturn,
    defaultConfirm,
    userType,
  };

  done(null, userData);
};

// ClientId is required when adding a new Facebook strategy to passport
if (clientID) {
  passport.use(new FacebookStrategy(strategyOptions, verifyCallback));
}

/**
 * Initiate authentication with Facebook. When the funcion is called, Passport redirects the
 * user to Facebook to perform authentication.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Call the next middleware function in the stack
 */
exports.authenticateFacebook = (req, res, next) => {
  const { from, defaultReturn, defaultConfirm, userType } = req.query || {};
  const params = {
    ...(from ? { from } : {}),
    ...(defaultReturn ? { defaultReturn } : {}),
    ...(defaultConfirm ? { defaultConfirm } : {}),
    ...(userType ? { userType } : {}),
  };

  const paramsAsString = JSON.stringify(params);

  passport.authenticate('facebook', { scope: ['email'], state: paramsAsString })(req, res, next);
};

/**
 * This function is called when user returns to this application after authenticating with
 * Facebook. Passport verifies the recieved tokens and calls a callback function that we've defined
 * for the authentication strategy and an additional session management function, that we introduce
 * in this function.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Call the next middleware function in the stack
 */
exports.authenticateFacebookCallback = (req, res, next) => {
  // We've already defined the `verifyCallback` function for the Passport Facebook authentication
  // strategy. That function is normally used to verify the user information obtained from identity
  // provider, or alternatively create a new use while an internal Passport function is used to
  // store the user data into session. In our case however, we use the SDK to manage sessions.
  // Therefore, we provide an additional session management function here, that is called from the
  // `verifyCallback` fn.
  const sessionFn = (err, user) => loginWithIdp(err, user, req, res, clientID, 'facebook');

  passport.authenticate('facebook', sessionFn)(req, res, next);
};
