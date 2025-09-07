/**
 * This is the main server to run the production application.
 *
 * Running the server requires that `npm run build` is run so that the
 * production JS bundle can be imported.
 *
 * This server renders the requested URL in the server side for
 * performance, SEO, etc., and properly handles redirects, HTTP status
 * codes, and serving the static assets.
 *
 * When the application is loaded in a browser, the client side app
 * takes control and all the functionality such as routing is handled
 * in the client.
 */

// This enables nice stacktraces from the minified production bundle
require('source-map-support').install();

// Configure process.env with .env.* files
require('./env').configureEnv();

// Setup Sentry
// Note 1: This needs to happen before other express requires
// Note 2: this doesn't use instrument.js file but log.js
const log = require('./log');

const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const enforceSsl = require('express-enforces-ssl');
const path = require('path');
const passport = require('passport');
const cors = require('cors');

const auth = require('./auth');
const apiRouter = require('./apiRouter');
const wellKnownRouter = require('./wellKnownRouter');
const webmanifestResourceRoute = require('./resources/webmanifest');
const robotsTxtRoute = require('./resources/robotsTxt');
const sitemapResourceRoute = require('./resources/sitemap');
const { getExtractors } = require('./importer');
const renderer = require('./renderer');
const dataLoader = require('./dataLoader');
const cspNonce = require('./middleware/cspNonce');
const sdkUtils = require('./api-util/sdk');
const { getClientScripts, logAssets, BUILD_DIR } = require('./utils/assets');

// Paths + helpers
const exists = p => { try { return fs.existsSync(p); } catch { return false; } };
const readHead = (p, n=20) => {
  try { return fs.readFileSync(p, 'utf8').split('\n').slice(0,n).join('\n'); } catch { return null; }
};

const buildDir  = path.join(__dirname, '..', 'build');
const publicDir = path.join(__dirname, '..', 'public');

console.info('[StaticDiag] buildDir:', buildDir, 'exists:', exists(buildDir));
console.info('[StaticDiag] publicDir:', publicDir, 'exists:', exists(publicDir));
console.info('[StaticDiag] build/index.html exists:', exists(path.join(buildDir,'index.html')));
console.info('[StaticDiag] build/static exists:', exists(path.join(buildDir,'static')));
console.info('[StaticDiag] manifest present:', exists(path.join(buildDir, 'asset-manifest.json')));
try {
  const idx = path.join(buildDir,'index.html');
  const head = readHead(idx, 40);
  console.info('[StaticDiag] build/index.html head:\n', head || '(missing)');
} catch {}

// Log asset information
logAssets();
const dev = process.env.REACT_APP_ENV === 'development';
const PORT = process.env.PORT || 3000;
const redirectSSL =
  process.env.SERVER_SHARETRIBE_REDIRECT_SSL != null
    ? process.env.SERVER_SHARETRIBE_REDIRECT_SSL
    : process.env.REACT_APP_SHARETRIBE_USING_SSL;
const REDIRECT_SSL = redirectSSL === 'true';
const TRUST_PROXY = process.env.SERVER_SHARETRIBE_TRUST_PROXY || null;
const CSP = process.env.REACT_APP_CSP;
const CSP_MODE = process.env.CSP_MODE || 'report'; // 'block' for prod, 'report' for test
const cspReportUrl = '/csp-report';
const cspEnabled = CSP === 'block' || CSP === 'report';
const app = express();

// Health first — must be at the very top
app.get('/healthz', (_req, res) => res.sendStatus(204));
app.head('/healthz', (_req, res) => res.sendStatus(204));

// Boot-time Integration creds presence log
console.log(
  process.env.INTEGRATION_CLIENT_ID && process.env.INTEGRATION_CLIENT_SECRET
    ? '✅ Integration API credentials detected.'
    : '⚠️ Missing Integration API credentials (lender SMS may fail to read protected phone).'
);

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://sherbrt.com',
  'https://www.sherbrt.com',
  'https://web-template-1.onrender.com',       // Render test client
  'https://sherbrt-test.onrender.com'          // any other Render env we use
];

const envAllowed = (process.env.CORS_ALLOW_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envAllowed])];

const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin or tools without an Origin header (e.g., curl/health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      console.warn('[CORS] Blocked origin:', origin);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
};

app.use(require('cors')(corsOptions));
app.options('*', require('cors')(corsOptions)); // handle preflight everywhere

const errorPage500 = fs.readFileSync(path.join(buildDir, '500.html'), 'utf-8');
const errorPage404 = fs.readFileSync(path.join(buildDir, '404.html'), 'utf-8');

// Filter out bot requests that scan websites for php vulnerabilities
// from paths like /asdf/index.php, //cms/wp-includes/wlwmanifest.xml, etc.
// There's no need to pass those to React app rendering as it causes unnecessary asset fetches.
// Note: you might want to do this on the edge server instead.
app.use(
  /.*(\.php|\.php7|\/wp-.*\/.*|cgi-bin.*|htdocs\.rar|htdocs\.zip|root\.7z|root\.rar|root\.zip|www\.7z|www\.rar|wwwroot\.7z)$/,
  (req, res) => {
    return res.status(404).send(errorPage404);
  }
);

// 1) Nonce generator (must be first)
app.use(cspNonce);

// 2) Base Helmet (relax COEP/COOP to avoid third-party breakage)
app.use(helmet({ 
  crossOriginEmbedderPolicy: false, 
  crossOriginOpenerPolicy: false 
}));

// 3) CSP with nonce function (if enabled)
if (cspEnabled) {
  // When a CSP directive is violated, the browser posts a JSON body
  // to the defined report URL and we need to parse this body.
  app.use(
    bodyParser.json({
      type: ['json', 'application/csp-report'],
    })
  );

  const nonceFn = (req, res) => `'nonce-${res.locals.cspNonce}'`;
  const isReportOnly = CSP_MODE !== 'block';

  app.use(helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'", nonceFn, "blob:",
        process.env.NODE_ENV !== 'production' ? "'unsafe-eval'" : null,
        "https://js.stripe.com","https://m.stripe.network","https://api.stripe.com",
        "https://api.mapbox.com","https://*.mapbox.com",
        "https://maps.googleapis.com",
        "https://*.googletagmanager.com","https://*.google-analytics.com",
        "https://www.googleadservices.com","https://*.g.doubleclick.net",
        "https://plausible.io",
      ].filter(Boolean),
      "script-src-elem": [
        "'self'", nonceFn, "blob:",
        "https://js.stripe.com","https://m.stripe.network","https://api.stripe.com",
        "https://api.mapbox.com","https://*.mapbox.com",
        "https://maps.googleapis.com",
        "https://*.googletagmanager.com","https://*.google-analytics.com",
        "https://www.googleadservices.com","https://*.g.doubleclick.net",
        "https://plausible.io",
      ],
      "script-src-attr": [nonceFn],
      "style-src": ["'self'","'unsafe-inline'","https://api.mapbox.com","https://*.mapbox.com","https://fonts.googleapis.com"],
      "connect-src": [
        "'self'",
        "https://js.stripe.com","https://m.stripe.network","https://api.stripe.com",
        "https://flex-api.sharetribe.com","https://*.st-api.com",
        "https://maps.googleapis.com","https://places.googleapis.com",
        "https://*.tiles.mapbox.com","https://api.mapbox.com","https://events.mapbox.com",
        "https://*.google-analytics.com","https://*.analytics.google.com","https://*.googletagmanager.com",
        "https://*.g.doubleclick.net","https://*.google.com",
        "https://plausible.io","https://*.plausible.io",
        "https://fonts.googleapis.com",
        "https://sentry.io","https://*.sentry.io",
      ],
      "img-src": [
        "'self'","data:","blob:","https:",
        "https://js.stripe.com","https://m.stripe.network","https://api.stripe.com",
        "https://*.imgix.net","https://sharetribe.imgix.net",
        "https://picsum.photos","https://*.picsum.photos",
        "https://api.mapbox.com","https://maps.googleapis.com",
        "https://*.gstatic.com","https://*.googleapis.com","https://*.ggpht.com",
        "https://*.giphy.com","https://*.google-analytics.com","https://*.analytics.google.com","https://*.googletagmanager.com",
        "https://*.g.doubleclick.net","https://*.google.com","https://*.ytimg.com",
      ],
      "font-src": ["'self'","data:","https://fonts.gstatic.com"],
      "frame-src": ["'self'","https://js.stripe.com","https://m.stripe.network","https://api.stripe.com","https://*.youtube-nocookie.com","https://bid.g.doubleclick.net","https://td.doubleclick.net"],
      "worker-src": ["'self'","blob:"],
      "manifest-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'self'"],
    },
    reportOnly: isReportOnly,
  }));
}

// Redirect HTTP to HTTPS if REDIRECT_SSL is `true`.
// This also works behind reverse proxies (load balancers) as they are for example used by Heroku.
// In such cases, however, the TRUST_PROXY parameter has to be set (see below)
//
// Read more: https://github.com/aredo/express-enforces-ssl
//
if (REDIRECT_SSL) {
  app.use(enforceSsl());
}

// Set the TRUST_PROXY when running the app behind a reverse proxy.
//
// For example, when running the app in Heroku, set TRUST_PROXY to `true`.
//
// Read more: https://expressjs.com/en/guide/behind-proxies.html
//
if (TRUST_PROXY === 'true') {
  app.enable('trust proxy');
} else if (TRUST_PROXY === 'false') {
  app.disable('trust proxy');
} else if (TRUST_PROXY !== null) {
  app.set('trust proxy', TRUST_PROXY);
}

app.use(compression());

// Explicit favicon route with cache busting - force Sherbrt icon (BEFORE static middleware)
app.get('/favicon.ico', (req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  const sherbrtFav = path.join(publicDir, 'favicon.ico'); // Sherbrt brand icon
  res.sendFile(sherbrtFav, err => err ? next(err) : null);
});

// Bundle request logging middleware
app.use((req,res,next) => {
  // Log all bundle requests and 404s
  if (req.url.startsWith('/static/')) {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        console.error('[BundleDiag]', req.method, req.url, '→', res.statusCode);
      }
    });
  }
  next();
});

// Static middleware: build first, then public fallback
app.use(express.static(buildDir,  { fallthrough: true, etag: true, maxAge: '7d' }));
app.use(express.static(publicDir, { fallthrough: true, etag: true, maxAge: '7d' }));
app.use(cookieParser());

// Helper function for static routes
function sendPreferringBuild(res, file, type) {
  const p1 = path.join(buildDir, file);
  const p2 = path.join(publicDir, file);
  if (type) res.type(type);
  if (exists(p1)) return res.sendFile(p1);
  if (exists(p2)) return res.sendFile(p2);
  return res.status(404).end();
}

// Static diagnostics endpoints
app.get('/__static/diag', (req, res) => {
  const list = d => { try { return fs.readdirSync(d).slice(0,10); } catch { return []; } };
  res.json({
    buildIndex: fs.existsSync(path.join(buildDir,'index.html')),
    buildStatic: fs.existsSync(path.join(buildDir,'static')),
    sampleBuildStatic: list(path.join(buildDir,'static')),
    faviconPublicExists: fs.existsSync(path.join(publicDir,'favicon.ico')),
    faviconBuildExists: fs.existsSync(path.join(buildDir,'favicon.ico')),
    time: new Date().toISOString()
  });
});

app.get('/__static/which-index', (req, res) => {
  // Show which index we are about to send
  const p = exists(path.join(buildDir,'index.html'))
    ? path.join(buildDir,'index.html')
    : path.join(publicDir,'index.html');
  res.type('text/plain').send(p + '\n\n' + (readHead(p, 30) || '(missing)'));
});

// Health and assets diagnostic endpoints
app.get('/__health', (req, res) => {
  const buildExists = fs.existsSync(path.join(buildDir, 'index.html'));
  const manifestExists = fs.existsSync(path.join(buildDir, 'asset-manifest.json'));
  const { js } = getClientScripts();
  res.json({ 
    ok: buildExists && manifestExists && js.length > 0, 
    buildExists, 
    manifestExists, 
    injectedScriptsCount: js.length 
  });
});

app.get('/__assets', (req, res) => {
  const { js, css, error } = getClientScripts();
  res.json({ js, css, error });
});

// CSP debug endpoint
app.get('/debug/csp', (req, res) => {
  const n = res.locals.cspNonce || 'missing';
  res.send(`<!doctype html><body><!-- n8=${n.slice(0,8)} --><script nonce="${n}">document.body.innerHTML='inline ok';</script></body>`);
});

// Headers debug endpoint
app.get('/debug/headers', (req, res) => {
  res.set('content-type', 'text/plain');
  res.send(JSON.stringify(req.headers, null, 2));
});

// Manifest/robots/sitemaps (prefer build, fallback public, correct type)
app.get('/site.webmanifest', (req,res) => sendPreferringBuild(res, 'site.webmanifest', 'application/manifest+json'));
app.get(['/robots.txt','/sitemap.xml','/sitemap-index.xml'], (req,res) => {
  const map = {'/robots.txt':'robots.txt','/sitemap.xml':'sitemap.xml','/sitemap-index.xml':'sitemap-index.xml'};
  return sendPreferringBuild(res, map[req.path]);
});

// These .well-known/* endpoints will be enabled if you are using this template as OIDC proxy
// https://www.sharetribe.com/docs/cookbook-social-logins-and-sso/setup-open-id-connect-proxy/
// We need to handle these endpoints separately so that they are accessible by Sharetribe backend
// even if you have enabled basic authentication e.g. in staging environment.
app.use('/.well-known', wellKnownRouter);

// Use basic authentication when not in dev mode. This is
// intentionally after the static middleware and /.well-known
// endpoints as those will bypass basic auth.
if (!dev) {
  const USERNAME = process.env.BASIC_AUTH_USERNAME;
  const PASSWORD = process.env.BASIC_AUTH_PASSWORD;
  const hasUsername = typeof USERNAME === 'string' && USERNAME.length > 0;
  const hasPassword = typeof PASSWORD === 'string' && PASSWORD.length > 0;

  // If BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD have been set - let's use them
  if (hasUsername && hasPassword) {
    app.use(auth.basicAuth(USERNAME, PASSWORD));
  }
}

// Initialize Passport.js  (http://www.passportjs.org/)
// Passport is authentication middleware for Node.js
// We use passport to enable authenticating with
// a 3rd party identity provider (e.g. Facebook or Google)
app.use(passport.initialize());

// Server-side routes that do not render the application
app.use('/api', apiRouter);

const noCacheHeaders = {
  'Cache-control': 'no-cache, no-store, must-revalidate',
};

app.get('*', async (req, res) => {
  if (req.url.startsWith('/static/')) {
    // The express.static middleware only handles static resources
    // that it finds, otherwise passes them through. However, we don't
    // want to render the app for missing static resources and can
    // just return 404 right away.
    return res.status(404).send('Static asset not found.');
  }

  if (req.url === '/_status.json') {
    return res.status(200).send({ status: 'ok' });
  }

  // For SPA routes, use SSR renderer to inject client scripts
  if (req.accepts('html')) {
    const idx = path.join(buildDir, 'index.html');
    if (!exists(idx)) {
      console.error('[StaticDiag] MISSING build/index.html — falling back to public (may cause blank page).');
      res.set('Cache-Control','no-cache');
      return res.sendFile(path.join(publicDir, 'index.html'), e => e ? next(e) : null);
    }
    // Continue to SSR renderer instead of serving static file
  }

  const context = {};

  // Until we have a better plan for caching dynamic content and we
  // make sure that no sensitive data can appear in the prefetched
  // data, let's disable response caching altogether.
  res.set(noCacheHeaders);
  
  // For HTML requests, ensure no-cache to prevent stale shells
  if (req.accepts('html')) {
    res.set('Cache-Control','no-cache');
  }

  // Get chunk extractors from node and web builds
  // https://loadable-components.com/docs/api-loadable-server/#chunkextractor
  const { nodeExtractor, webExtractor } = getExtractors();

  // Server-side entrypoint provides us the functions for server-side data loading and rendering
  const nodeEntrypoint = nodeExtractor.requireEntrypoint();
  const { default: renderApp, ...appInfo } = nodeEntrypoint;

  const sdk = sdkUtils.getSdk(req, res);

  dataLoader
    .loadData(req.url, sdk, appInfo)
    .then(data => {
      const cspNonce = cspEnabled ? res.locals.cspNonce : null;
      return renderer.render(req.url, context, data, renderApp, webExtractor, cspNonce);
    })
    .then(html => {
      if (dev) {
        const debugData = {
          url: req.url,
          context,
        };
        console.log(`\nRender info:\n${JSON.stringify(debugData, null, '  ')}`);
      }

      if (context.unauthorized) {
        // Routes component injects the context.unauthorized when the
        // user isn't logged in to view the page that requires
        // authentication.
        sdk.authInfo().then(authInfo => {
          if (authInfo && authInfo.isAnonymous === false) {
            // It looks like the user is logged in.
            // Full verification would require actual call to API
            // to refresh the access token
            res.status(200).send(html);
          } else {
            // Current token is anonymous.
            res.status(401).send(html);
          }
        });
      } else if (context.forbidden) {
        res.status(403).send(html);
      } else if (context.url) {
        // React Router injects the context.url if a redirect was rendered
        res.redirect(context.url);
      } else if (context.notfound) {
        // NotFoundPage component injects the context.notfound when a
        // 404 should be returned
        res.status(404).send(html);
      } else {
        res.send(html);
      }
    })
    .catch(e => {
      log.error(e, 'server-side-render-failed');
      res.status(500).send(errorPage500);
    });
});

// Set error handler. If Sentry is set up, all error responses
// will be logged there.
log.setupExpressErrorHandler(app);

// Global error handler to prevent blank 500s
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ServerError]', err && err.stack || err);
  // If the request is GET / (or other HTML route), try to serve the SPA shell instead of raw 500
  if (req.method === 'GET' && req.accepts('html')) {
    return res.status(200).sendFile(path.join(publicDir, 'index.html'));
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

if (cspEnabled) {
  // Dig out the value of the given CSP report key from the request body.
  const reportValue = (req, key) => {
    const report = req.body ? req.body['csp-report'] : null;
    return report && report[key] ? report[key] : key;
  };

  // Handler for CSP violation reports.
  app.post(cspReportUrl, (req, res) => {
    const effectiveDirective = reportValue(req, 'effective-directive');
    const blockedUri = reportValue(req, 'blocked-uri');
    const msg = `CSP: ${effectiveDirective} doesn't allow ${blockedUri}`;
    log.error(new Error(msg), 'csp-violation');
    res.status(204).end();
  });
}

const server = app.listen(PORT, () => {
  const mode = process.env.NODE_ENV || 'development';
  console.log(`Listening on port ${PORT} in ${mode} mode`);
  if (dev) {
    console.log(`Open http://localhost:${PORT}/ and start hacking!`);
  }
});

// Graceful shutdown:
// https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log('Shutting down...');
    server.close(() => {
      console.log('Server shut down.');
    });
  });
});
