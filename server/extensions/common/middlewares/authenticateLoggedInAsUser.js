const Ajv = require('ajv');
const jose = require('jose');
const crypto = require('crypto');
const sharetribeSdk = require('sharetribe-flex-sdk');
const { getSdk } = require('../../../api-util/sdk');
const { integrationSdk } = require('../sdk');
const dynamicRequire = require('../utils/dynamicRequire');
const loggedInAsUserMiddlewareOptionsSchema = require('../schemas/loggedInAsUserMiddlewareOptionsSchema');

const idTokenUtils = dynamicRequire('extensions/socials-sign-in/common/utils/idToken');
const config = dynamicRequire('extensions/socials-sign-in/common/config');

const { createIdToken } = idTokenUtils || {};
const privateKeyInPKCS8 = config?.loginAs?.rsaPrivateKey
  ? crypto
      .createPrivateKey(Buffer.from(config.loginAs.rsaPrivateKey, 'base64').toString('utf-8'))
      .export({ type: 'pkcs8' })
  : null;

const authenticateLoggedInAsUser = (opts) => {
  if (!config || !createIdToken || !privateKeyInPKCS8) {
    throw new Error('socials-sign-in plugin is not configured, we need it to use RBAC middleware');
  }
  const ajv = new Ajv();
  const optsValidity = ajv.validate(loggedInAsUserMiddlewareOptionsSchema, opts);
  if (!optsValidity) {
    throw new Error(JSON.stringify(ajv.errors));
  }

  const {
    clientSecret,
    supportedAlgorithm,
    loginAs: { idpId, clientID, rsaKeyId },
  } = config;

  return async (req, res, next) => {
    const { requireTrustedSdk, currentLoginAsUserId, alwaysDenormalised } = opts;

    const tokenStore = sharetribeSdk.tokenStore.memoryStore();
    const loggedInAsSdk = getSdk(req, res, {
      clientSecret,
      tokenStore,
      alwaysDenormalised,
    });
    const loginAsUser = await integrationSdk.users.show({ id: currentLoginAsUserId.trim() });
    const {
      attributes: {
        email,
        profile: { firstName, lastName },
      },
    } = loginAsUser;
    await loggedInAsSdk.loginWithIdp({
      idpClientId: clientID,
      idpId,
      idpToken: await createIdToken(
        clientID,
        {
          email,
          firstName,
          lastName,
          emailVerified: true,
          userId: currentLoginAsUserId,
        },
        {
          signingAlg: supportedAlgorithm,
          rsaPrivateKey: await jose.importPKCS8(privateKeyInPKCS8, supportedAlgorithm),
          keyId: rsaKeyId,
          issuerPath: 'login-as',
        }
      ),
    });

    req.currentUser = loginAsUser;
    req.sdk = loggedInAsSdk;

    if (requireTrustedSdk) {
      const trustedToken = await loggedInAsSdk.exchangeToken();
      const trustedTokenStore = sharetribeSdk.tokenStore.memoryStore();
      trustedTokenStore.setToken(trustedToken.data);
      req.trustedSdk = getSdk(req, res, {
        clientSecret,
        tokenStore: trustedTokenStore,
        alwaysDenormalised,
      });
    }

    return next();
  };
};

module.exports = authenticateLoggedInAsUser;
