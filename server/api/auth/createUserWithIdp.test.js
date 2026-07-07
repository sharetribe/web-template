const sharetribeSdk = require('sharetribe-flex-sdk');

process.env.REACT_APP_GOOGLE_CLIENT_ID = 'google-client-id';

jest.mock('../../api-util/sdk', () => ({
  handleError: jest.fn(),
  serialize: jest.fn(data => JSON.stringify(data)),
  typeHandlers: [],
}));

jest.mock('sharetribe-flex-sdk', () => {
  const createWithIdp = jest.fn();
  const loginWithIdp = jest.fn();
  return {
    tokenStore: {
      expressCookieStore: jest.fn(() => ({})),
    },
    createInstance: jest.fn(),
    __mockFns: { createWithIdp, loginWithIdp },
  };
});

const createUserWithIdp = require('./createUserWithIdp');

const { __mockFns } = sharetribeSdk;

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
});

const authInfoCookie = 'j:{"idpId":"google","email":"a@example.com"}';

describe('createUserWithIdp', () => {
  beforeEach(() => {
    __mockFns.createWithIdp.mockReset();
    __mockFns.loginWithIdp.mockReset();
    __mockFns.createWithIdp.mockResolvedValue({});
    __mockFns.loginWithIdp.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {},
    });
    sharetribeSdk.createInstance.mockReturnValue({
      currentUser: { createWithIdp: __mockFns.createWithIdp },
      loginWithIdp: __mockFns.loginWithIdp,
    });
  });

  it('returns 400 when st-idp-token cookie is missing', () => {
    const res = mockRes();
    createUserWithIdp(
      {
        cookies: { 'st-authinfo': authInfoCookie },
        body: {},
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(__mockFns.createWithIdp).not.toHaveBeenCalled();
  });

  it('returns 400 when st-authinfo cookie is missing', () => {
    const res = mockRes();
    createUserWithIdp(
      {
        cookies: { 'st-idp-token': 'token-from-cookie' },
        body: {},
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(__mockFns.createWithIdp).not.toHaveBeenCalled();
  });

  it('uses idpToken and idpId from cookies, not request body', async () => {
    const res = mockRes();
    createUserWithIdp(
      {
        cookies: {
          'st-idp-token': 'token-from-cookie',
          'st-authinfo': authInfoCookie,
        },
        body: {
          idpToken: 'token-from-body',
          idpId: 'facebook',
          firstName: 'Edited',
        },
      },
      res
    );

    await new Promise(resolve => setImmediate(resolve));

    expect(__mockFns.createWithIdp).toHaveBeenCalledWith({
      idpId: 'google',
      idpClientId: 'google-client-id',
      idpToken: 'token-from-cookie',
      firstName: 'Edited',
    });
    expect(__mockFns.loginWithIdp).toHaveBeenCalledWith({
      idpId: 'google',
      idpClientId: 'google-client-id',
      idpToken: 'token-from-cookie',
    });
    expect(res.clearCookie).toHaveBeenCalledWith('st-authinfo', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('st-idp-token', expect.any(Object));
  });
});
