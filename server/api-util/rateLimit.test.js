'use strict';

const { createRateLimiter } = require('./rateLimit');

const createReq = key => ({ ip: key, headers: {} });

const createRes = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

describe('createRateLimiter', () => {
  it('allows requests up to the limit and rejects later requests', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    const next = jest.fn();

    limiter(createReq('1.2.3.4'), createRes(), next);
    limiter(createReq('1.2.3.4'), createRes(), next);
    const blockedRes = createRes();
    limiter(createReq('1.2.3.4'), blockedRes, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.body).toEqual({ ok: false, error: 'rate_limited' });
    expect(blockedRes.headers['Retry-After']).toBeDefined();
  });

  it('tracks independent client keys separately', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    const next = jest.fn();

    limiter(createReq('1.2.3.4'), createRes(), next);
    limiter(createReq('5.6.7.8'), createRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
