const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const PENDING_SIGNUP_TTL = 15 * 60 * 1000;

exports.pendingSignupDisplayCookieOptions = () => ({
  maxAge: PENDING_SIGNUP_TTL,
  secure: USING_SSL,
  sameSite: 'Lax',
});

exports.pendingSignupTokenCookieOptions = () => ({
  maxAge: PENDING_SIGNUP_TTL,
  httpOnly: true,
  secure: USING_SSL,
  sameSite: 'Lax',
});

exports.authErrorCookieOptions = () => ({
  maxAge: PENDING_SIGNUP_TTL,
  secure: USING_SSL,
  sameSite: 'Lax',
});

exports.clearPendingSignupCookieOptions = () => ({
  secure: USING_SSL,
});

exports.clearPendingSignupTokenCookieOptions = () => ({
  secure: USING_SSL,
  httpOnly: true,
});

/**
 * Parse a JSON cookie value set by express cookie-parser (handles `j:` prefix).
 *
 * @param {string|Object} value
 * @returns {Object|null}
 */
exports.parseJsonCookie = value => {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(String(value).replace(/^j:/, ''));
  } catch (e) {
    return null;
  }
};
