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

const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const enforceSsl = require('express-enforces-ssl');
const path = require('path');

const { configureEnv } = require('./env');
const { loadScripts } = require('./scripts');

async function startServer() {
  try {
    // Configure process.env with .env.* files and SecretManager
    await configureEnv();
    // Load the Event Listeners Scripts
    loadScripts();

    const { auth0RequestHandler } = require('./api/auth/auth0');
    const auth = require('./auth');
    const apiRouter = require('./apiRouter');
    const wellKnownRouter = require('./wellKnownRouter');
    const webmanifestResourceRoute = require('./resources/webmanifest');
    const robotsTxtRoute = require('./resources/robotsTxt');
    const sitemapResourceRoute = require('./resources/sitemap');
    const { getExtractors } = require('./importer');
    const renderer = require('./renderer');
    const dataLoader = require('./dataLoader');
    const log = require('./log');
    const csp = require('./csp');
    const sdkUtils = require('./api-util/sdk');

    const buildPath = path.resolve(__dirname, '..', 'build');
    const dev = process.env.REACT_APP_ENV === 'development';
    const PORT = parseInt(process.env.PORT, 10);
    const redirectSSL =
      process.env.SERVER_SHARETRIBE_REDIRECT_SSL != null
        ? process.env.SERVER_SHARETRIBE_REDIRECT_SSL
        : process.env.REACT_APP_SHARETRIBE_USING_SSL;
    const REDIRECT_SSL = redirectSSL === 'true';
    const TRUST_PROXY = process.env.SERVER_SHARETRIBE_TRUST_PROXY || null;
    const CSP = process.env.REACT_APP_CSP;
    const cspReportUrl = '/csp-report';
    const cspEnabled = CSP === 'block' || CSP === 'report';
    const app = express();

    const errorPage = fs.readFileSync(path.join(buildPath, '500.html'), 'utf-8');

    // Setup error logger
    log.setup();
    // Add logger request handler. In case Sentry is set up
    // request information is added to error context when sent
    // to Sentry.
    app.use(log.requestHandler());

    // The helmet middleware sets various HTTP headers to improve security.
    // See: https://www.npmjs.com/package/helmet
    // Helmet 4 doesn't disable CSP by default so we need to do that explicitly.
    // If csp is enabled we will add that separately.

    app.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );

    if (cspEnabled) {
      // When a CSP directive is violated, the browser posts a JSON body
      // to the defined report URL and we need to parse this body.
      app.use(
        bodyParser.json({
          type: ['json', 'application/csp-report'],
        })
      );

      // CSP can be turned on in report or block mode. In report mode, the
      // browser checks the policy and calls the report URL when the
      // policy is violated, but doesn't block any requests. In block
      // mode, the browser also blocks the requests.

      // In Helmet 4,supplying functions as directive values is not supported.
      // That's why we need to create own middleware function that calls the Helmet's middleware function
      const reportOnly = CSP === 'report';
      app.use((req, res, next) => {
        csp(cspReportUrl, reportOnly)(req, res, next);
      });
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
    app.use('/static', express.static(path.join(buildPath, 'static')));
    app.use(cookieParser());

    // We don't serve favicon.ico from root. PNG images are used instead for icons through link elements.
    app.get('/favicon.ico', (req, res) => {
      res.status(404).send('favicon.ico not found.');
    });

    // robots.txt is generated by resources/robotsTxt.js
    // It creates the sitemap URL with the correct marketplace URL
    app.get('/robots.txt', robotsTxtRoute);

    // Handle different sitemap-* resources. E.g. /sitemap-index.xml
    app.get('/sitemap-:resource', sitemapResourceRoute);

    // Generate web app manifest
    // When developing with "yarn run dev",
    // you can reach the manifest from http://localhost:3500/site.webmanifest
    // The corresponding <link> element is set in src/components/Page/Page.js
    app.get('/site.webmanifest', webmanifestResourceRoute);

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

    // Initialize the authentication middleware for Node.js
    // We use this to enable authenticating with
    // a 3rd party identity provider (Auth0)
    app.use(auth0RequestHandler);

    // Server-side routes that do not render the application
    app.use('/api', apiRouter);

    const noCacheHeaders = {
      'Cache-control': 'no-cache, no-store, must-revalidate',
    };

    app.get('*', (req, res) => {
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

      const context = {};

      // Until we have a better plan for caching dynamic content and we
      // make sure that no sensitive data can appear in the prefetched
      // data, let's disable response caching altogether.
      res.set(noCacheHeaders);

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
          const html = renderer.render(req.url, context, data, renderApp, webExtractor);

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
          res.status(500).send(errorPage);
        });
    });

    // Set error handler. If Sentry is set up, all error responses
    // will be logged there.
    app.use(log.errorHandler());

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
      const mode = dev ? 'development' : 'production';
      console.log(`Listening to port ${PORT} in ${mode} mode`);
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
  } catch (err) {
    throw err;
  }
}

startServer();
