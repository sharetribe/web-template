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


// helper to avoid typos
const SELF_ORIGINS = ["'self'", "https://sherbrt.com", "https://www.sherbrt.com"];

app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],

    "script-src": [
      ...SELF_ORIGINS,
      (req,res)=>`'nonce-${res.locals.cspNonce}'`,
      "blob:",
      process.env.NODE_ENV !== 'production' ? "'unsafe-eval'" : null,
      "https://js.stripe.com", "https://m.stripe.network", "https://api.stripe.com",
      "https://api.mapbox.com", "https://*.mapbox.com",
      "https://maps.googleapis.com",
      "*.googletagmanager.com", "*.google-analytics.com",
      "www.googleadservices.com", "*.g.doubleclick.net",
      "plausible.io",
    ].filter(Boolean),

    "script-src-elem": [
      ...SELF_ORIGINS,
      (req,res)=>`'nonce-${res.locals.cspNonce}'`,
      "blob:",
      "https://js.stripe.com", "https://m.stripe.network", "https://api.stripe.com",
      "https://api.mapbox.com", "https://*.mapbox.com",
      "https://maps.googleapis.com",
      "*.googletagmanager.com", "*.google-analytics.com",
      "www.googleadservices.com", "*.g.doubleclick.net",
      "plausible.io",
    ],

    "script-src-attr": [(req,res)=>`'nonce-${res.locals.cspNonce}'`],

    // keep 'unsafe-inline' (you have inline <style> with @font-face)
    "style-src": ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://*.mapbox.com", "https://fonts.googleapis.com"],

    // ✅ add Sharetribe's font host
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://assets-sharetribecom.sharetribe.com"],

    "connect-src": ["'self'","https://js.stripe.com","https://m.stripe.network","https://api.stripe.com","https://flex-api.sharetribe.com","https://*.st-api.com","https://maps.googleapis.com","https://places.googleapis.com","https://*.tiles.mapbox.com","https://api.mapbox.com","https://events.mapbox.com","https://*.google-analytics.com","https://*.analytics.google.com","https://*.googletagmanager.com","https://*.g.doubleclick.net","https://*.google.com","https://plausible.io","https://*.plausible.io","https://fonts.googleapis.com","https://sentry.io","https://*.sentry.io"],
    "img-src": ["'self'","data:","blob:","https:","https://js.stripe.com","https://m.stripe.network","https://api.stripe.com","https://*.imgix.net","https://sharetribe.imgix.net","https://picsum.photos","https://*.picsum.photos","https://api.mapbox.com","https://maps.googleapis.com","https://*.gstatic.com","https://*.googleapis.com","https://*.ggpht.com","https://*.giphy.com","https://*.google-analytics.com","https://*.analytics.google.com","https://*.googletagmanager.com","https://*.g.doubleclick.net","https://*.google.com","https://*.ytimg.com"],
    "frame-src": ["'self'","https://js.stripe.com","https://m.stripe.network","https://api.stripe.com","https://*.youtube-nocookie.com","https://bid.g.doubleclick.net","https://td.doubleclick.net"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "frame-ancestors": ["'self'"],
    "upgrade-insecure-requests": []
  }
}));

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

// Icon caching routes (before static middleware)
app.get(['/favicon.ico', '/apple-touch-icon.png', '/site.webmanifest'], (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

// Serve only actual assets, NOT index.html
app.use('/static', express.static(path.join(__dirname, '..', 'build', 'static'), { immutable: true, maxAge: '1y' }));
app.get('/favicon.ico', (req,res)=>res.sendFile(path.join(__dirname,'..','build','favicon.ico')));
app.get('/site.webmanifest', (req,res)=>res.sendFile(path.join(__dirname,'..','build','site.webmanifest')));
app.get('/apple-touch-icon.png', (req,res)=>res.sendFile(path.join(__dirname,'..','build','apple-touch-icon.png')));
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
  res.type('text/plain').send(res.get('content-security-policy') || 'no csp header');
});

app.get('/debug/html-tail', (req, res) => {
  const html = global.__lastRenderedHtml || '';
  res.type('text/plain').send(html.slice(-2000)); // last 2k chars to see scripts near </body>
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

const renderApp = require('./ssr');
app.get('*', async (req,res,next)=>{
  try {
    const html = await renderApp(req,res);
    res.type('html').send(html);
  } catch (e) { next(e); }
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

const server = app.listen(PORT, () => {
  const mode = process.env.NODE_ENV || 'development';
  const iconsVersion = process.env.ICONS_VERSION || 'sherbrt2';
  console.log(`Listening on port ${PORT} in ${mode} mode`);
  console.log(`Using ICONS_VERSION: ${iconsVersion}`);
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
