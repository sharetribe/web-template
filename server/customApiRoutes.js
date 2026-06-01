'use strict';

// AV custom Express routers. Kept in a single mount function so server/index.js
// only carries a one-line addition — easier to resolve on upstream merges.
//
// Mount order matters: these routes must be registered BEFORE the upstream
// `app.use('/api', apiRouter)` in server/index.js, otherwise the upstream
// catch-all SDK proxy can intercept paths like /api/brevo or /api/bulk-import.
//
// `bulk-import` registers its own `multer` middleware per-route for multipart
// uploads. That is local to the router and intentionally does NOT use the
// app-level `express.json()` or `bodyParser.json()` (the Transit body parser
// in server/apiRouter.js also stays scoped to `/api/*` upstream routes).

const brevoRouter = require('./api/brevo');
const instagramRouter = require('./api/instagram');
const myBalanceRouter = require('./api/my-balance');
const bulkImportRouter = require('./api/bulk-import');

const mountCustomApiRoutes = app => {
  app.use('/api/brevo', brevoRouter);
  app.use('/api/instagram', instagramRouter);
  app.use('/api/my-balance', myBalanceRouter);
  app.use('/api/bulk-import', bulkImportRouter);
};

module.exports = { mountCustomApiRoutes };
