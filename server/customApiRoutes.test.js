'use strict';

const express = require('express');
const auth = require('./auth');

process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-api-key';
process.env.BREVO_LIST_ID = process.env.BREVO_LIST_ID || '9';

const { mountCustomApiRoutes } = require('./customApiRoutes');

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  set(headers) {
    this.headers = { ...this.headers, ...headers };
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  end(body) {
    this.body = body;
    return this;
  },
});

describe('custom API route protection', () => {
  it('mounts custom API routes after staging basic auth middleware', () => {
    const app = express();
    const basicAuthMiddleware = auth.basicAuth('stage-user', 'stage-pass');
    app.use(basicAuthMiddleware);
    mountCustomApiRoutes(app);

    const stack = app.router.stack;
    const authIndex = stack.findIndex(layer => layer.handle === basicAuthMiddleware);
    const brevoIndex = stack.findIndex(layer =>
      layer.matchers?.some(matcher => matcher('/api/brevo/health'))
    );
    const instagramIndex = stack.findIndex(layer =>
      layer.matchers?.some(matcher => matcher('/api/instagram/feed'))
    );
    const bulkImportIndex = stack.findIndex(layer =>
      layer.matchers?.some(matcher => matcher('/api/bulk-import/template'))
    );
    const myBalanceIndex = stack.findIndex(layer =>
      layer.matchers?.some(matcher => matcher('/api/my-balance/summary'))
    );

    expect(authIndex).toBeGreaterThanOrEqual(0);
    expect(brevoIndex).toBeGreaterThan(authIndex);
    expect(instagramIndex).toBeGreaterThan(authIndex);
    expect(bulkImportIndex).toBeGreaterThan(authIndex);
    expect(myBalanceIndex).toBeGreaterThan(authIndex);
  });

  it('basic auth blocks unauthenticated custom API requests before a mounted route can run', () => {
    const basicAuthMiddleware = auth.basicAuth('stage-user', 'stage-pass');
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    basicAuthMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.headers['WWW-Authenticate']).toContain('Basic');
    expect(next).not.toHaveBeenCalled();
  });
});
