const sdkUtils = require('../api-util/sdk');

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

// Works as the redirect_uri passed in an authorization code request. Receives
// an authorization code and uses that to log in and redirect to the landing
// page.
module.exports = (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies[stateKey];

  if (state !== storedState) {
    res.status(401).send('Invalid state parameter.');
    return;
  }

  if (error) {
    res.status(401).send(`Failed to authorize as a user, error: ${error}.`);
    return;
  }

  const codeVerifier = req.cookies[codeVerifierKey];
  const targetPath = req.cookies[targetPathKey];

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
    .then(() => res.redirect(targetPath || '/'))
    .catch(() => res.status(401).send('Unable to authenticate as a user'));
};
