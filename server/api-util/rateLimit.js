'use strict';

const defaultKeyGenerator = req =>
  req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.ip ||
  req.connection?.remoteAddress ||
  'unknown';

const createRateLimiter = options => {
  const {
    windowMs = 60 * 1000,
    max = 60,
    keyGenerator = defaultKeyGenerator,
    message = { ok: false, error: 'rate_limited' },
  } = options || {};
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);
    const existing = hits.get(key);
    const record =
      existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

    record.count += 1;
    hits.set(key, record);

    if (record.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json(message);
    }

    if (hits.size > max * 20) {
      for (const [entryKey, entry] of hits.entries()) {
        if (entry.resetAt <= now) {
          hits.delete(entryKey);
        }
      }
    }

    return next();
  };
};

module.exports = { createRateLimiter };
