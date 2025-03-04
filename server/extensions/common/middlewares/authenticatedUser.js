const Ajv = require('ajv');
const merge = require('lodash/merge');
const { getSdk, getTrustedSdk } = require('../../../api-util/sdk');
const verifyPermissions = require('../permissions/mod/loginAs/verifier');
const { sendUnauthorized } = require('../mod/jwt/sendUnauthorized');
const authenticateLoggedInAsUser = require('./authenticateLoggedInAsUser');
const currentUserMiddlewareOptionsSchema = require('../schemas/currentUserMiddlewareOptionsSchema');

const getCurrentLoginAsUserId = (req) => {
  const currentCookie = req?.headers?.cookie;
  if (!currentCookie) {
    return null;
  }
  const currentCookieArray = currentCookie.split(';');
  return currentCookieArray
    .find((cookie) => cookie.includes(`st-super-login-as-impersonating`))
    ?.replace('st-super-login-as-impersonating=', '');
};

const authenticatedUser = (opts = {}) => {
  const ajv = new Ajv();
  const optsValidity = ajv.validate(currentUserMiddlewareOptionsSchema, opts);
  if (!optsValidity) {
    throw new Error(JSON.stringify(ajv.errors));
  }
  return async (req, res, next) => {
    req.currentUser = null;
    const {
      requireTrustedSdk,
      currentLoggedInAsUserId: jwtLoggedInAsUserId,
      alwaysDenormalised,
    } = opts;
    try {
      const sdk = getSdk(req, res, { alwaysDenormalised });
      req.sdk ||= sdk;

      const response = await sdk.currentUser.show();
      req.currentUser = alwaysDenormalised ? response : response.data.data;

      if (requireTrustedSdk) {
        req.trustedSdk = await getTrustedSdk(req, { alwaysDenormalised });
      }

      const currentLoginAsUserId = jwtLoggedInAsUserId || getCurrentLoginAsUserId(req);
      if (!currentLoginAsUserId) {
        return next();
      }

      const verificationResult = verifyPermissions({
        currentUser: req.currentUser,
        url: req.originalUrl.replace('/api/', ''),
        loginAsUserId: currentLoginAsUserId,
        req,
      });
      if (verificationResult.error) {
        return sendUnauthorized(res);
      }

      req.impersonator = req.currentUser;
      req.impersonatorSdk = req.sdk;
      req.impersonatorTrustedSdk = req.trustedSdk;

      return authenticateLoggedInAsUser(merge(opts, { currentLoginAsUserId }))(req, res, next);
    } catch (error) {
      console.error('Error in authenticatedUser', error);
      return sendUnauthorized(res);
    }
  };
};

module.exports = authenticatedUser;
