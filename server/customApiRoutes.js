'use strict';

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
