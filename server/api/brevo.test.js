'use strict';

jest.mock('node-fetch');

const ORIGINAL_ENV = process.env;
process.env = {
  ...ORIGINAL_ENV,
  BREVO_API_KEY: 'test-api-key',
  BREVO_LIST_ID: '9',
};

const fetch = require('node-fetch');
const router = require('./brevo');

// ─── helpers ────────────────────────────────────────────────────────────────

function brevoOk(status = 201) {
  return { status, json: jest.fn().mockResolvedValue({}) };
}

function brevoErr(status, body) {
  return { status, json: jest.fn().mockResolvedValue(body) };
}

function createReq(body) {
  return { body };
}

function createRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function getSubscribeHandler() {
  const layer = router.stack.find(l => l.route?.path === '/subscribe' && l.route.methods?.post);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...ORIGINAL_ENV,
    BREVO_API_KEY: 'test-api-key',
    BREVO_LIST_ID: '9',
  };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// ─── /subscribe POST ─────────────────────────────────────────────────────────

describe('POST /subscribe', () => {
  const handler = getSubscribeHandler();

  it('returns ok:true for a valid new subscriber', async () => {
    fetch
      .mockResolvedValueOnce(brevoOk(201)) // contact upsert
      .mockResolvedValueOnce(brevoOk(201)); // add to list

    const req = createReq({ email: 'new@example.com', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns ok:true when contact already existed (step-1 returns 204)', async () => {
    fetch
      .mockResolvedValueOnce(brevoOk(204)) // updated, no body
      .mockResolvedValueOnce(brevoOk(201));

    const req = createReq({ email: 'existing@example.com', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns ok:true when contact is already in the list (step-2 returns 400 invalid_parameter)', async () => {
    // This is the main bug fix: Brevo returns 400 for already-subscribed contacts.
    fetch
      .mockResolvedValueOnce(brevoOk(204))
      .mockResolvedValueOnce(
        brevoErr(400, { message: 'Contact already in list', code: 'invalid_parameter' })
      );

    const req = createReq({ email: 'already@example.com', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 for an invalid email', async () => {
    const req = createReq({ email: 'not-an-email', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'Invalid email' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 for a missing email', async () => {
    const req = createReq({ hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'Invalid email' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('silently accepts honeypot-triggered requests (bot detection)', async () => {
    const req = createReq({ email: 'bot@example.com', hp: 'filled' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 when Brevo rejects the contact upsert (step 1)', async () => {
    fetch.mockResolvedValueOnce(
      brevoErr(400, { message: 'Invalid API key', code: 'unauthorized' })
    );

    const req = createReq({ email: 'user@example.com', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'brevo_create_failed' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when Brevo rejects add-to-list with a real error (not already-in-list)', async () => {
    fetch
      .mockResolvedValueOnce(brevoOk(201))
      .mockResolvedValueOnce(
        brevoErr(404, { message: 'List not found', code: 'document_not_found' })
      );

    const req = createReq({ email: 'user@example.com', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'brevo_add_to_list_failed' });
  });

  it('returns 500 when fetch throws (network error)', async () => {
    fetch.mockRejectedValueOnce(new Error('Network failure'));

    const req = createReq({ email: 'user@example.com', hp: '' });
    const res = createRes();
    await handler(req, res, jest.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ ok: false, error: 'server_error' });
  });
});
