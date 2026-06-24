/**
 * Returns true when path is safe to use as a same-origin relative redirect path.
 *
 * @param {unknown} path
 * @returns {boolean}
 */
const isRelativePath = path =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

/**
 * Builds an absolute marketplace redirect URL from a relative path.
 * Falls back when path (or fallback) is missing or unsafe.
 *
 * @param {string} rootUrl Marketplace root URL from REACT_APP_MARKETPLACE_ROOT_URL
 * @param {string} [path] Preferred relative path
 * @param {string} [fallback='/'] Fallback relative path when path is unsafe
 * @returns {string}
 */
const buildMarketplaceRedirectUrl = (rootUrl, path, fallback = '/') => {
  const safePath =
    path && isRelativePath(path) ? path : fallback && isRelativePath(fallback) ? fallback : '/';

  const base = (rootUrl || '').replace(/\/$/, '');
  if (!base) {
    return safePath;
  }

  return `${base}${safePath}`;
};

module.exports = {
  isRelativePath,
  buildMarketplaceRedirectUrl,
};
