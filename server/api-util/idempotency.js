const cache = new Map(); // key -> expiresAt (ms since epoch)
const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

function alreadySent(key, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const exp = cache.get(key);
  if (exp && exp > now) return true;
  cache.set(key, now + ttlMs);
  return false;
}

module.exports = { alreadySent };
