const radix = 10;
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const DEV_SERVER_PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const useDevApiServer = process.env.NODE_ENV === 'development' && !!DEV_SERVER_PORT;
const marketplaceRootUrlRaw = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const marketplaceRootUrl = marketplaceRootUrlRaw
  ? `${marketplaceRootUrlRaw.replace(/\/$/, '')}`
  : '';

/**
 * Resolves domain and port information from
 * a URL, for example:
 * https://example.com:8080 => example.com:8080
 */
const domainAndPort = rootURL => {
  if (rootURL.indexOf('//') === -1) {
    return rootURL;
  } else {
    return rootURL.split('//')[1];
  }
};

/**
 * Resolves the domain from a URL, for example:
 * https://example.com:8080 => example.com
 */
const domain = rootURL => {
  if (!rootURL) {
    return 'INVALID_URL';
  }

  return domainAndPort(rootURL).split(':')[0];
};

/**
 * Resolves the port number from a URL. If the port
 * can not be found `undefined` will be returned.
 */
const port = rootURL => {
  if (!rootURL) {
    return 'INVALID_URL';
  }

  return domainAndPort(rootURL).split(':')[1];
};

/**
 * This function uses REACT_APP_MARKETPLACE_ROOT_URL by default,
 * Note: on dev/localhost setup this returns hostname to apiServer
 * I.e. if REACT_APP_DEV_API_SERVER_PORT is used, the port is changed to it: e.g. http://localhost:3500
 *
 * @param {Object} options can contain options like rootURL and useDevApiServerPort. If rootURL is undefined, function uses REACT_APP_MARKETPLACE_ROOT_URL
 * @returns hostname
 */
exports.getRootURL = options => {
  const { rootURL, useDevApiServerPort = false } = options || {};
  const protocol = USING_SSL ? 'https' : 'http';
  const rUrl = rootURL || marketplaceRootUrl;
  const portInRootUrl = port(rUrl);
  const portMaybe =
    portInRootUrl && useDevApiServer && useDevApiServerPort
      ? `:${DEV_SERVER_PORT}`
      : portInRootUrl
      ? `:${portInRootUrl}`
      : '';
  return `${protocol}://${domain(rUrl)}${portMaybe}`;
};
