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

// Default CSP whitelist.
//
// NOTE: Do not change these in the customizations, make custom
// additions within the exported function in the bottom of this file.
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
    'places.googleapis.com',
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
    'https://api.stripe.com',
    '*.stripe.com',
  ].filter(Boolean),
  fontSrc: [self, data, 'assets-sharetribecom.sharetribe.com', 'fonts.gstatic.com'],
  formAction: [self],
  frameSrc: [
    self,
    'https://js.stripe.com',
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
    'sharetribe.imgix.net',

    // Styleguide placeholder images
    'picsum.photos',
    '*.picsum.photos',

    'api.mapbox.com',
    'https://*.tiles.mapbox.com',
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
    'https://q.stripe.com',
    '*.stripe.com',
  ],
  scriptSrc: [
    self,
    (req, res) => `'nonce-${res.locals.cspNonce}'`,
    unsafeEval,
    'maps.googleapis.com',
    'api.mapbox.com',
    '*.googletagmanager.com',
    '*.google-analytics.com',
    'www.googleadservices.com',
    '*.g.doubleclick.net',
    'js.stripe.com',
    'plausible.io',
  ],
  "script-src-elem": [self, blob, "https://js.stripe.com", "https://api.mapbox.com", "https://*.mapbox.com"],
  "manifest-src": [self],
  "worker-src": [self, blob],
  styleSrc: [self, unsafeInline, 'fonts.googleapis.com', 'api.mapbox.com'],
};

/**
 * Middleware for creating Content Security Policy
 *
 * @param {Object} options Configuration options
 * @param {string} options.mode CSP mode: 'report' (default) or 'block'
 * @param {string} options.reportUri URL where the browser will POST policy violation reports
 * @returns {Object} Object containing enforce and reportOnly middleware configurations
 */
exports.csp = ({ mode = 'report', reportUri }) => {
  // Single source of truth for header names and behavior
  const cspMode = mode === 'block' ? 'block' : 'report';
  const dualReport = String(process.env.CSP_DUAL_REPORT || '').toLowerCase() === 'true';
  const enforceHeader = 'Content-Security-Policy';
  const reportHeader = 'Content-Security-Policy-Report-Only';
  // ================ START CUSTOM CSP URLs ================ //

  // Add custom CSP whitelisted URLs here. See commented example
  // below. For format specs and examples, see:
  // https://content-security-policy.com/

  // Example: extend default img directive with custom domain
  // const { imgSrc = [self] } = defaultDirectives;
  // const exampleImgSrc = imgSrc.concat('my-custom-domain.example.com');

  // Parse extra hosts from environment variable (only for legitimate third-party services)
  const EXTRA_HOSTS = (process.env.CSP_EXTRA_HOSTS || '').split(/\s+/).filter(Boolean);

  const customDirectives = {
    // Example: Add custom directive override
    // imgSrc: exampleImgSrc,
  };

  // ================ END CUSTOM CSP URLs ================ //

  // Helmet v4 expects every value to be iterable so strings or booleans are not supported directly
  // If we want to add block-all-mixed-content directive we need to add empty array to directives
  // See Helmet's default directives:
  // https://github.com/helmetjs/helmet/blob/bdb09348c17c78698b0c94f0f6cc6b3968cd43f9/middlewares/content-security-policy/index.ts#L51

  // Build base directives with extra hosts
  const baseDirectives = Object.assign({}, defaultDirectives, customDirectives);
  
  if (EXTRA_HOSTS.length > 0) {
    // Add extra hosts to relevant directives
    if (baseDirectives.scriptSrc) {
      baseDirectives.scriptSrc = [...baseDirectives.scriptSrc, ...EXTRA_HOSTS];
    }
    if (baseDirectives.scriptSrcElem) {
      baseDirectives.scriptSrcElem = [...baseDirectives.scriptSrcElem, ...EXTRA_HOSTS];
    }
    if (baseDirectives.connectSrc) {
      baseDirectives.connectSrc = [...baseDirectives.connectSrc, ...EXTRA_HOSTS];
    }
    if (baseDirectives.styleSrc) {
      baseDirectives.styleSrc = [...baseDirectives.styleSrc, ...EXTRA_HOSTS];
    }
    if (baseDirectives.imgSrc) {
      baseDirectives.imgSrc = [...baseDirectives.imgSrc, ...EXTRA_HOSTS];
    }
    if (baseDirectives.manifestSrc) {
      baseDirectives.manifestSrc = [...baseDirectives.manifestSrc, ...EXTRA_HOSTS];
    } else {
      baseDirectives.manifestSrc = [self, ...EXTRA_HOSTS];
    }
  }

  // Build enforce policy (strict)
  const enforceDirectives = Object.assign({}, baseDirectives);
  if (!dev) {
    enforceDirectives.upgradeInsecureRequests = [];
  }

  // Build report-only policy (can be more permissive)
  const reportOnlyDirectives = Object.assign({}, baseDirectives);
  // Add any additional permissive directives for monitoring here
  // For example, you might want to monitor more sources in report-only mode
  if (process.env.CSP_REPORT_ONLY_EXTRA_HOSTS) {
    const reportOnlyExtraHosts = process.env.CSP_REPORT_ONLY_EXTRA_HOSTS.split(/\s+/).filter(Boolean);
    if (reportOnlyExtraHosts.length > 0) {
      if (reportOnlyDirectives.connectSrc) {
        reportOnlyDirectives.connectSrc = [...reportOnlyDirectives.connectSrc, ...reportOnlyExtraHosts];
      }
      if (reportOnlyDirectives.scriptSrc) {
        reportOnlyDirectives.scriptSrc = [...reportOnlyDirectives.scriptSrc, ...reportOnlyExtraHosts];
      }
    }
  }

  // Add report URI to both policies
  enforceDirectives.reportUri = [reportUri];
  reportOnlyDirectives.reportUri = [reportUri];

  return {
    enforce: helmet.contentSecurityPolicy({
      useDefaults: false,
      directives: enforceDirectives,
      reportOnly: false,
    }),
    reportOnly: helmet.contentSecurityPolicy({
      useDefaults: false,
      directives: reportOnlyDirectives,
      reportOnly: true,
    }),
    // Metadata for debugging
    mode: cspMode,
    dualReport,
    enforceHeader,
    reportHeader,
  };
};
