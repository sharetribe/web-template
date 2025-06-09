const { auth } = require('express-openid-connect');
const jose = require('jose');

const loginWithIdp = require('./loginWithIdp');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const useDevApiServer = process.env.NODE_ENV === 'development' && !!PORT;
const baseURL = useDevApiServer
  ? `http://localhost:${PORT}`
  : process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const clientID = process.env.AUTH0_MARKETPLACE_CLIENT_ID;

const authorizationParams = {
  response_type: 'code',
  scope: 'openid email profile',
  audience: process.env.AUTH0_AUDIENCE,
};

const configParams = {
  idpLogout: true,
  authRequired: false,
  baseURL: baseURL,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  clientID,
  clientSecret: process.env.AUTH0_MARKETPLACE_CLIENT_SECRET,
  secret: process.env.AUTH0_COOKIE_SECRET,
  authorizationParams,
  routes: {
    callback: '/api/auth/auth0/callback',
    login: false,
  },
  session: {
    rollingDuration: process.env.AUTH_COOKIE_LIFETIME || 86400 * 7, // 1 week by default
    cookie: {
      domain: process.env.AUTH0_COOKIE_DOMAIN,
    },
  },
};

exports.authenticateAuth0 = (req, res) => {
  const { from, defaultReturn, defaultConfirm, userType, brandStudioId, screenHint } =
    req.query || {};
  const params = {
    ...(from ? { 'ext-mp-from': Buffer.from(from).toString('base64') } : {}),
    ...(defaultReturn ? { 'ext-mp-default-return': defaultReturn } : {}),
    ...(defaultConfirm ? { 'ext-mp-default-confirm': defaultConfirm } : {}),
    ...(userType ? { 'ext-mp-user-type': userType } : {}),
    ...(brandStudioId ? { 'ext-mp-brand-studio-id': brandStudioId } : {}),
    screen_hint: screenHint || 'login',
  };
  res.oidc.login({
    returnTo: '/api/auth/auth0/custom-callback',
    authorizationParams: {
      ...authorizationParams,
      ...params,
    },
  });
};

exports.auth0RequestHandler = auth({ ...configParams });

exports.authenticateAuth0Callback = (req, res) => {
  const { accessToken, idToken: idpToken } = req.oidc;
  const userMetadata = jose.decodeJwt(accessToken.access_token);
  const routingNS = process.env.AUTH0_MARKETPLACE_ROUTING_NAMESPACE || '';
  const profileNS = process.env.AUTH0_MARKETPLACE_PROFILE_NAMESPACE || '';
  const defaultUserType = process.env.MARKETPLACE_ROLE_ID_BUYER || '';
  const initialRoutes = userMetadata[routingNS] || {};
  const initialProfile = userMetadata[profileNS] || {};
  const {
    from, // Can be empty
    defaultReturn = '/',
    defaultConfirm = '/',
  } = initialRoutes;
  const {
    userType = defaultUserType,
    given_name: firstName,
    family_name: lastName,
    brandStudioId,
  } = initialProfile;
  const userInfo = req.oidc.user;
  const { email } = userInfo;
  const userProfile = {
    email,
    firstName,
    lastName,
    idpToken,
    defaultReturn,
    defaultConfirm,
    ...(from ? { from: Buffer.from(from, 'base64').toString('utf8') } : {}),
    ...(userType ? { userType } : {}),
    ...(brandStudioId ? { brandStudioId } : {}),
  };
  loginWithIdp(null, userProfile, req, res, clientID, process.env.AUTH0_IDP_ID);
};
