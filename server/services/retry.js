'use strict';

/**
 * Run `fn()` and retry with exponential backoff on rejection.
 *
 * @param {() => Promise<T>} fn          The async operation to run.
 * @param {Object}           [opts]
 * @param {number}           [opts.attempts=2]   Total tries (initial + retries).
 * @param {number}           [opts.baseMs=500]   Base delay; backoff is base * 2^(i-1) + jitter.
 * @param {string}           [opts.label]        For log context.
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
  const attempts = opts.attempts ?? 2;
  const baseMs = opts.baseMs ?? 500;
  const label = opts.label || 'retry';

  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts) break;
      const jitter = Math.floor(Math.random() * 100);
      const delay = baseMs * Math.pow(2, i - 1) + jitter;
      console.warn(
        `[retry] ${label} attempt ${i}/${attempts} failed: ${err.message}; retrying in ${delay}ms`
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

module.exports = { withRetry };
