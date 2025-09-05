const helmet = require('helmet');
const crypto = require('crypto');

const dev = process.env.REACT_APP_ENV === 'development';
const self = "'self'";
const unsafeInline = "'unsafe-inline'";
const unsafeEval = "'unsafe-eval'";
const data = 'data:';
const blob = 'blob:';
const devImagesMaybe = dev ? ['*.localhost:8000'] : [];
const baseUrl = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL || 'https://flex-api.sharetribe.com';
// Asset Delivery API is using a different domain than other Sharetribe APIs
// cdn.st-api.com
// If assetCdnBaseUrl is used to initialize SDK (for proxy purposes), then that URL needs to be in CSP
const assetCdnBaseUrl = process.env.REACT_APP_SHARETRIBE_SDK_ASSET_CDN_BASE_URL;

// CSP Kill-switch for emergency situations
const MODE = (process.env.CSP_MODE || '').toLowerCase();
if (MODE === 'off') {
  console.log('[CSP] Kill-switch activated: CSP_MODE=off - CSP disabled');
  exports.csp = (reportUri, reportOnly) => (req, res, next) => next();
  exports.generateCSPNonce = (req, res, next) => next();
  return;
}

// Helper functions for defensive parsing
function toList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  return String(val)
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function ensureArr(v) {
  return Array.isArray(v) ? v : (v ? [String(v)] : []);
}

function maskHosts(list) {
  return list.map(h => (h.length > 80 ? h.slice(0, 80) + '…' : h));
}

exports.generateCSPNonce = (req, res, next) => {
  // Asynchronously generate a unique nonce for each request.
  crypto.randomBytes(32, (err, randomBytes) => {
    if (err) {
      // If there was a problem, bail.
      next(err);
    } else {
      // Save the nonce, as a hex string, to `res.locals` for later.
      res.locals.cspNonce = randomBytes.toString('hex');
      next();
    }
  });
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
exports.csp = (reportUri, reportOnly) => {
  // Build safe allowlists with defensive parsing
  const extraAll = toList(process.env.CSP_EXTRA_HOSTS);
  const reportOnlyExtraAll = toList(process.env.CSP_REPORT_ONLY_EXTRA_HOSTS);

  // Always include Stripe + manifest self
  const STRIPE = [
    'https://js.stripe.com',
    'https://m.stripe.network',
    'https://api.stripe.com',
  ];

  // Parse optional extra hosts for specific directives
  const scriptExtra = toList(process.env.CSP_SCRIPT_EXTRA);
  const connectExtra = toList(process.env.CSP_CONNECT_EXTRA);
  const imgExtra = toList(process.env.CSP_IMG_EXTRA);
  const frameExtra = toList(process.env.CSP_FRAME_EXTRA);
  const styleExtra = toList(process.env.CSP_STYLE_EXTRA);
  const fontExtra = toList(process.env.CSP_FONT_EXTRA);
  const manifestExtra = toList(process.env.CSP_MANIFEST_EXTRA);

  // Build base directives safely
  const baseDirectives = {
    'default-src': ensureArr(self),
    'base-uri': ensureArr(self),
    'child-src': ensureArr(blob),
    'form-action': ensureArr(self),
    'object-src': ["'none'"],
    'frame-ancestors': ensureArr(self),
    'manifest-src': ensureArr(self).concat(manifestExtra),
    'script-src': ensureArr(self).concat(STRIPE, scriptExtra, [
      (req, res) => `'nonce-${res.locals.cspNonce}'`,
      unsafeEval,
      'maps.googleapis.com',
      'api.mapbox.com',
      '*.googletagmanager.com',
      '*.google-analytics.com',
      'www.googleadservices.com',
      '*.g.doubleclick.net',
      'plausible.io',
    ]),
    'script-src-elem': ensureArr(self).concat(STRIPE, scriptExtra, [
      blob,
      'https://api.mapbox.com',
      'https://*.mapbox.com',
    ]),
    'connect-src': ensureArr(self).concat(STRIPE, connectExtra, [
      baseUrl,
      assetCdnBaseUrl,
      '*.st-api.com',
      'maps.googleapis.com',
      'places.googleapis.com',
      '*.tiles.mapbox.com',
      'api.mapbox.com',
      'events.mapbox.com',
      '*.google-analytics.com',
      '*.analytics.google.com',
      '*.googletagmanager.com',
      '*.g.doubleclick.net',
      '*.google.com',
      'plausible.io',
      '*.plausible.io',
      'fonts.googleapis.com',
      'sentry.io',
      '*.sentry.io',
    ]),
    'img-src': ensureArr(self).concat(STRIPE, imgExtra, [
      data,
      blob,
      ...devImagesMaybe,
      '*.imgix.net',
      'sharetribe.imgix.net',
      'picsum.photos',
      '*.picsum.photos',
      'api.mapbox.com',
      'maps.googleapis.com',
      '*.gstatic.com',
      '*.googleapis.com',
      '*.ggpht.com',
      '*.giphy.com',
      '*.google-analytics.com',
      '*.analytics.google.com',
      '*.googletagmanager.com',
      '*.g.doubleclick.net',
      '*.google.com',
      'google.com',
      '*.ytimg.com',
    ]),
    'style-src': ensureArr(self).concat(styleExtra, [
      unsafeInline,
      'fonts.googleapis.com',
      'api.mapbox.com',
    ]),
    'font-src': ensureArr(self).concat(fontExtra, [
      data,
      'assets-sharetribecom.sharetribe.com',
      'fonts.gstatic.com',
    ]),
    'frame-src': ensureArr(self).concat(STRIPE, frameExtra, [
      '*.youtube-nocookie.com',
      'https://bid.g.doubleclick.net',
      'https://td.doubleclick.net',
    ]),
  };

  // Add extra hosts to all directives if specified
  if (extraAll.length > 0) {
    Object.keys(baseDirectives).forEach(key => {
      baseDirectives[key] = baseDirectives[key].concat(extraAll);
    });
  }

  // Add report-only extra hosts if in report-only mode
  if (reportOnly && reportOnlyExtraAll.length > 0) {
    Object.keys(baseDirectives).forEach(key => {
      baseDirectives[key] = baseDirectives[key].concat(reportOnlyExtraAll);
    });
  }

  // Clean duplicates and filter out empty values
  Object.keys(baseDirectives).forEach(key => {
    baseDirectives[key] = Array.from(new Set(baseDirectives[key].filter(Boolean)));
  });

  // Add report URI
  baseDirectives.reportUri = [reportUri];

  // Add upgrade insecure requests for production
  if (!reportOnly && !dev) {
    baseDirectives.upgradeInsecureRequests = [];
  }

  // Robust logging with masked values
  console.info('[CSP] Mode:', MODE);
  console.info('[CSP] Report-only:', reportOnly);
  console.info('[CSP] script-src:', maskHosts(baseDirectives['script-src']));
  console.info('[CSP] connect-src:', maskHosts(baseDirectives['connect-src']));
  console.info('[CSP] img-src:', maskHosts(baseDirectives['img-src']));
  console.info('[CSP] frame-src:', maskHosts(baseDirectives['frame-src']));
  console.info('[CSP] manifest-src:', maskHosts(baseDirectives['manifest-src']));

  // Create the CSP middleware with try/catch guard
  const cspMiddleware = helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: baseDirectives,
    reportOnly,
  });

  // Return middleware function with try/catch guard
  return function csp(req, res, next) {
    try {
      return cspMiddleware(req, res, next);
    } catch (e) {
      console.error('[CSP] middleware error, passing through without CSP:', e && e.stack || e);
      return next(); // never 500 on CSP failure
    }
  };
};
