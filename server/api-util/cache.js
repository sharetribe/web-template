const { isPlainObject } = require('./types.js');

const DAY_MS = 864e5; // milliseconds in a 24h
const MAX_PURGE_EXPIRED_PROPERTIES = 10; // on [[set]]

/**
 * This creates simple (proxied) memory cache.
 * If ttl is not explicitly given, it's set to 1 minute.
 *
 * Note: this does not have an eviction policy yet. Therefore, you should only use this with data
 * that can be cached whole time the app is running (e.g. robots.txt)
 *
 * @example
 * ```
 *   const cache = createTTLCache(3600);
 *   cache.someKey = 'string to be cached'; // [[set]]
 *   const { data, timestamp, expiresAt } = cache.someKey; // [[get]]
 * ```
 *
 * @param {Number} ttl time-to-live in seconds
 * @returns Proxy instance
 */
exports.createTTLCache = (ttl = 60) => {
  const cache = {};
  return new Proxy(cache, {
    get(target, property, receiver) {
      const cachedData = target[property];
      if (!!cachedData) {
        // Check if the cached data has expired
        if (Date.now() < cachedData.expiresAt) {
          return cachedData;
        }
      }
      const timestamp = cachedData?.timestamp || Date.now();
      const expiresAt = cachedData?.expiresAt || Date.now();
      return { data: null, timestamp, expiresAt };
    },
    set(target, property, value, receiver) {
      const timestamp = Date.now();
      const expiresAt = timestamp + ttl * 1000;
      target[property] = { data: value, timestamp, expiresAt };
    },
  });
};
