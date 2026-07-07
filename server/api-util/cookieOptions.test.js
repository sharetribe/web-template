const {
  parseJsonCookie,
  pendingSignupDisplayCookieOptions,
  pendingSignupTokenCookieOptions,
  authErrorCookieOptions,
} = require('./cookieOptions');

describe('cookieOptions', () => {
  describe('pendingSignupDisplayCookieOptions', () => {
    it('is readable by client JS for form prefill', () => {
      const options = pendingSignupDisplayCookieOptions();
      expect(options.httpOnly).toBeUndefined();
      expect(options.sameSite).toBe('Lax');
      expect(options.maxAge).toBe(15 * 60 * 1000);
    });
  });

  describe('pendingSignupTokenCookieOptions', () => {
    it('is httpOnly and SameSite=Lax', () => {
      const options = pendingSignupTokenCookieOptions();
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('Lax');
      expect(options.maxAge).toBe(15 * 60 * 1000);
    });
  });

  describe('authErrorCookieOptions', () => {
    it('uses SameSite=Lax', () => {
      const options = authErrorCookieOptions();
      expect(options.sameSite).toBe('Lax');
      expect(options.maxAge).toBe(15 * 60 * 1000);
    });
  });

  describe('parseJsonCookie', () => {
    it('parses cookie-parser JSON prefix', () => {
      expect(parseJsonCookie('j:{"idpId":"google","email":"a@b.com"}')).toEqual({
        idpId: 'google',
        email: 'a@b.com',
      });
    });

    it('returns objects as-is', () => {
      const value = { idpId: 'facebook' };
      expect(parseJsonCookie(value)).toBe(value);
    });

    it('returns null for missing or invalid values', () => {
      expect(parseJsonCookie(null)).toBeNull();
      expect(parseJsonCookie('not-json')).toBeNull();
    });
  });
});
