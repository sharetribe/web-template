const helmet = require('helmet');

const dev = process.env.REACT_APP_ENV === 'development';
const self = "'self'";
const unsafeInline = "'unsafe-inline'";
const unsafeEval = "'unsafe-eval'";
const data = 'data:';
const blob = 'blob:';
const devImagesMaybe = dev ? ['*.localhost:8000'] : [];
const baseUrl = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL || 'https://flex-api.sharetribe.com';
const assetCdnBaseUrl = process.env.REACT_APP_SHARETRIBE_SDK_ASSET_CDN_BASE_URL;

const defaultDirectives = {
  baseUri: [self],
  defaultSrc: [self],
  childSrc: [blob],
  connectSrc: [
    self,
    baseUrl,
    assetCdnBaseUrl,
    '*.st-api.com',
    'maps.googleapis.com',
    '*.tiles.mapbox.com',
    'api.mapbox.com',
    'events.mapbox.com',

    // Google Analytics
    '*.google-analytics.com',
    '*.analytics.google.com',
    '*.googletagmanager.com',
    '*.g.doubleclick.net',
    '*.google.com',

    // Plausible analytics
    'plausible.io',
    '*.plausible.io',

    'fonts.googleapis.com',

    'sentry.io',
    '*.sentry.io',
    '*.stripe.com',
  ],
  fontSrc: [self, data, 'assets-sharetribecom.sharetribe.com', 'fonts.gstatic.com'],
  formAction: [self],
  frameSrc: [
    self,
    '*.stripe.com',
    '*.youtube-nocookie.com',
    'https://bid.g.doubleclick.net',
    'https://td.doubleclick.net',
  ],
  imgSrc: [
    self,
    data,
    blob,
    ...devImagesMaybe,
    '*.imgix.net',
    'sharetribe.imgix.net', // Safari 9.1 didn't recognize asterisk rule.

    // Styleguide placeholder images
    'picsum.photos',
    '*.picsum.photos',

    'api.mapbox.com',
    'maps.googleapis.com',
    '*.gstatic.com',
    '*.googleapis.com',
    '*.ggpht.com',

    // Giphy
    '*.giphy.com',

    // Google Analytics
    '*.google-analytics.com',
    '*.analytics.google.com',
    '*.googletagmanager.com',
    '*.g.doubleclick.net',
    '*.google.com',
    'google.com',

    // Youtube (static image)
    '*.ytimg.com',

    // Stripe
    '*.stripe.com',
  ],
  scriptSrc: [
    self,
    unsafeInline,
    unsafeEval,
    data,
    'maps.googleapis.com',
    'api.mapbox.com',
    '*.googletagmanager.com',
    '*.google-analytics.com',
    'www.googleadservices.com',
    '*.g.doubleclick.net',
    'js.stripe.com',
    
    // Plausible analytics
    'plausible.io',
  ],
  styleSrc: [self, unsafeInline, 'fonts.googleapis.com', 'api.mapbox.com'],
};

// Custom CSP directives for Facebook and other required domains
const { imgSrc = [self] } = defaultDirectives;
const facebookImgSrc = imgSrc.concat([
  '*.facebook.com',
  '*.fbcdn.net',
  '*.fbsbx.com',
]);

const { scriptSrc = [self] } = defaultDirectives;
const facebookScriptSrc = scriptSrc.concat([
  '*.facebook.net',
  '*.facebook.com',
]);

const { frameSrc = [self] } = defaultDirectives;
const facebookFrameSrc = frameSrc.concat([
  '*.facebook.com',
]);

const customDirectives = {
  imgSrc: facebookImgSrc,
  scriptSrc: facebookScriptSrc,
  frameSrc: facebookFrameSrc,
};

/**
 * Middleware for creating a Content Security Policy
 *
 * @param {String} reportUri URL where the browser will POST the
 * policy violation reports
 *
 * @param {Boolean} reportOnly In the report mode, requests are only
 * reported to the report URL instead of blocked
 */
module.exports = (reportUri, reportOnly) => {
  // Merging default and custom directives
  const directives = Object.assign({ reportUri: [reportUri] }, defaultDirectives, customDirectives);

  if (!reportOnly) {
    directives.upgradeInsecureRequests = [];
  }

  return helmet.contentSecurityPolicy({
    useDefaults: false,
    directives,
    reportOnly,
  });
};
