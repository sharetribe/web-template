const crypto = require('crypto');

const { devLogger } = require('../log');
const sdkUtils = require('../api-util/sdk');
const { buildMarketplaceRedirectUrl } = require('../api-util/url');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';

// redirect_uri param used when initiating a login as authentication flow and
// when requesting a token using an authorization code
const loginAsRedirectUri = `${ROOT_URL.replace(/\/$/, '')}/api/login-as`;

// Cookies used for authorization code authentication.
const stateKey = `st-${CLIENT_ID}-oauth2State`;
const codeVerifierKey = `st-${CLIENT_ID}-pkceCodeVerifier`;

// Cookies used for additional login information
const targetPathKey = `st-${CLIENT_ID}-targetPath`;

const sendUnauthorized = (res, message) => {
  res
    .status(401)
    .type('text/plain')
    .send(message);
};

const isValidOAuthState = (state, storedState) => {
  if (!state || !storedState) {
    return false;
  }
  if (typeof state !== 'string' || typeof storedState !== 'string') {
    return false;
  }
  if (state.length !== storedState.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState));
};

// Works as the redirect_uri passed in an authorization code request. Receives
// an authorization code and uses that to log in and redirect to the landing
// page.
module.exports = (req, res) => {
  const { code, state, error } = req.query || {};
  const storedState = req.cookies[stateKey];

  if (!isValidOAuthState(state, storedState)) {
    sendUnauthorized(res, 'Invalid state parameter.');
    return;
  }

  if (error) {
    devLogger('login-as-authorization-failed', { oauthError: error });
    sendUnauthorized(res, 'Failed to authorize as a user.');
    return;
  }

  const codeVerifier = req.cookies[codeVerifierKey];
  const targetPathRaw = req.cookies[targetPathKey];
  const targetPath = buildMarketplaceRedirectUrl(ROOT_URL, targetPathRaw);

  // clear state and code verifier cookies
  res.clearCookie(stateKey, { secure: USING_SSL });
  res.clearCookie(codeVerifierKey, { secure: USING_SSL });
  // clear additional login cookies
  res.clearCookie(targetPathKey, { secure: USING_SSL });

  const sdk = sdkUtils.getSdk(req, res);

  sdk
    .loginAs({
      code,
      redirect_uri: loginAsRedirectUri,
      code_verifier: codeVerifier,
    })
    .then(() => res.redirect(targetPath))
    .catch(() => sendUnauthorized(res, 'Unable to authenticate as a user'));
};
