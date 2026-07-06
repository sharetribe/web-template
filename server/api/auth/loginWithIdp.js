const http = require('http');
const https = require('https');
const sharetribeSdk = require('sharetribe-flex-sdk');
const log = require('../../log.js');
const sdkUtils = require('../../api-util/sdk');
const { buildMarketplaceRedirectUrl, isRelativePath } = require('../../api-util/url');
const {
  authErrorCookieOptions,
  pendingSignupDisplayCookieOptions,
  pendingSignupTokenCookieOptions,
} = require('../../api-util/cookieOptions');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;
const rootUrl = process.env.REACT_APP_MARKETPLACE_ROOT_URL;

// Instantiate HTTP(S) Agents with keepAlive set to true.
// This will reduce the request time for consecutive requests by
// reusing the existing TCP connection, thus eliminating the time used
// for setting up new TCP connections.
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const baseUrl = BASE_URL ? { baseUrl: BASE_URL } : {};

module.exports = (err, user, req, res, idpClientId, idpId) => {
  if (err) {
    log.error(err, 'fetching-user-data-from-idp-failed');

    // Save error details to cookie so that we can show
    // relevant information in the frontend
    return res
      .cookie(
        'st-autherror',
        {
          status: err.status,
          code: err.code,
          message: err.message,
        },
        authErrorCookieOptions()
      )
      .redirect(`${rootUrl}/login#`);
  }

  if (!user) {
    log.error(
      new Error('Failed to fetch user details from identity provider'),
      'fetching-user-data-from-idp-failed'
    );

    // Save error details to cookie so that we can show
    // relevant information in the frontend
    return res
      .cookie(
        'st-autherror',
        {
          status: 'Bad Request',
          code: 400,
          message: 'Failed to fetch user details from identity provider!',
        },
        authErrorCookieOptions()
      )
      .redirect(`${rootUrl}/login#`);
  }

  const { from, defaultReturn, defaultConfirm, userType } = user;

  const tokenStore = sharetribeSdk.tokenStore.expressCookieStore({
    clientId: CLIENT_ID,
    req,
    res,
    secure: USING_SSL,
  });

  const sdk = sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    httpAgent,
    httpsAgent,
    tokenStore,
    typeHandlers: sdkUtils.typeHandlers,
    ...baseUrl,
  });

  return sdk
    .loginWithIdp({
      idpId,
      idpClientId,
      idpToken: user.idpToken,
    })
    .then(response => {
      if (response.status === 200) {
        // If the user was authenticated, redirect back to to LandingPage
        // We need to add # to the end of the URL because otherwise Facebook
        // login will add their defaul #_#_ which breaks the routing in frontend.

        const redirectUrl = buildMarketplaceRedirectUrl(rootUrl, from, defaultReturn);
        res.redirect(`${redirectUrl}#`);
      }
    })
    .catch(() => {
      // eslint-disable-next-line no-console
      console.log(
        'Authenticating with idp failed. User needs to confirm creating sign up in frontend.'
      );

      // If authentication fails, we want to create a new user with idp.
      // Display fields go in a JS-readable cookie; idpToken is httpOnly only.
      res
        .cookie(
          'st-authinfo',
          {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            idpId,
            from: from && isRelativePath(from) ? from : undefined,
            userType,
          },
          pendingSignupDisplayCookieOptions()
        )
        .cookie('st-idp-token', user.idpToken, pendingSignupTokenCookieOptions());

      const confirmUrl = buildMarketplaceRedirectUrl(rootUrl, defaultConfirm);
      res.redirect(`${confirmUrl}#`);
    });
};
