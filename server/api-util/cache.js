const { isPlainObject } = require('./types.js');
const { devLogger } = require('../log.js');

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

/**
 * This creates simple (proxied) memory cache using LRU (least-recently-used) pattern.
 *
 * Note 1: if you are planning to use cache heavily, you should look for more battle tested cache libraries!
 * You could consider redis, lru-cache, etc.
 *
 * Note 2: the evinction policy for TTL is created with timeouts, but only for those keys,
 * which have ttl set to max 1 day. The setTimeout-based eviction fails after 2,147,483,647 ms (24.8 days).
 *
 * @example
 * ```
 *   const memoryStore = { cache: new Map(), totalBytes: 0 };
 *   const cache = createLRUCache({ memoryStore, maxBytes: 10485760, ttl: 60 });
 *   cache.someKey = 'string to be cached'; // [[set]] with default ttl
 *   // Or cache.someKey = { data: 'string to be cached', ttl: 10 }; // [[set]] data with custom ttl
 *   const { data, bytes, expiresAt } = cache.someKey; // [[get]]
 * ```
 *
 * Note: maxBytes just evaluates the size of actual serialized data, not meta related to it.
 * The default maxBytes is 10485760 aka 10Mb (10*1024*1024) bytes.
 *
 * @param {Object} param
 * @param {Object} param.memoryStore contains cache, which needs to be and instance of Map and totalBytes counter.
 * @param {Map} param.memoryStore.cache an instance of Map
 * @param {Number} param.memoryStore.totalBytes counter for cached bytes. Note: this does not count full footprint!
 * @param {Number} param.maxBytes - maximum size of saved data in bytes
 * @param {Number} param.defaultTTL the default time-to-live in seconds
 * @returns {Proxy} proxy which uses the given Map instance (memoryStore.cache) and counts bytes of cached strings
 */
exports.createLRUCache = ({ memoryStore, maxBytes = 10485760, defaultTTL = 10 }) => {
  // This simple LRU cache relies heavily for JS Map (memoryStore.cache: new Map()),
  // which maintains order of set properties.
  const store = memoryStore || { cache: new Map(), totalBytes: 0 };
  store.timeouts = store.timeouts || new Map();

  const addEvictionTimeout = (property, delay) => {
    const timeouts = store.timeouts;
    if (timeouts.has(property)) {
      clearTimeout(timeouts.get(property));
    }

    if (delay <= DAY_MS) {
      // This implementation adds timeout-based eviction to short caches only (less than 1 day)
      // Note: if delay is long, timeout may fail (32-bit signed integer overflows after 2,147,483,647 ms)
      const timeout = setTimeout(() => deleteProperty(property), delay);
      if (timeout.unref) {
        // unref: when called, the active Timeout object will not require the Node.js event loop to remain active.
        // https://nodejs.org/api/timers.html#timeoutunref
        // Note: Deno has the same feature: https://github.com/denoland/deno/issues/6141
        timeout.unref();
      }
      timeouts.set(property, timeout);
    }
  };

  const deleteProperty = (property, opts) => {
    const { removeTimeout = true, onlyExpired = false, logOnDev = true } = opts || {};
    const timeouts = store.timeouts;
    const cache = store.cache;
    const cachedValue = cache.get(property);

    if (onlyExpired && cachedValue?.expiresAt > Date.now()) {
      return false;
    }

    if (removeTimeout && timeouts.has(property)) {
      clearTimeout(timeouts.get(property));
      timeouts.delete(property);
    }

    const isDeleted = cache.delete(property);
    if (isDeleted) {
      const cachedValueBytes = cachedValue?.bytes || 0;
      store.totalBytes -= cachedValueBytes;
      if (logOnDev) {
        devLogger(`Evicted cache key: ${property}.\n  Bytes removed:  ${cachedValueBytes}`);
      }
    }
    return isDeleted;
  };

  // Purge properties to capacity (so that there's enough space for the newBytes).
  // This is called on each [[set]] call to maintain the maxBytes limit.
  const purgeToCapacity = (newBytes = 0) => {
    const cache = store.cache;

    while (store.totalBytes + newBytes > maxBytes && cache.size > 0) {
      const oldestCachedProperty = cache.keys().next().value;
      deleteProperty(oldestCachedProperty);
    }
  };

  // Purge expired properties up to maxPurge.
  // This is done on each [[set]] call.
  const purgeExpired = (maxPurge = MAX_PURGE_EXPIRED_PROPERTIES) => {
    const cache = store.cache;
    const purgeExpiredUpTo = cache.size <= maxPurge ? cache.size : maxPurge;

    for (let i = 0; i < purgeExpiredUpTo; i++) {
      const oldestCachedProperty = cache.keys().next().value;
      deleteProperty(oldestCachedProperty, { onlyExpired: true });
    }
  };

  // Return a proxy object that wraps the actual cache (Map)
  return new Proxy(store.cache, {
    // [[get]] trap
    // Note: target refers to Map instance (store.cache).
    get(target, property, receiver) {
      const cachedValue = target.get(property);
      if (!!cachedValue) {
        // Delete the property, if it exists already.
        // This is done to maintain the LRU order inside the cache/Map
        // The timeout deletion is not relevant for the [[get]] trap.
        deleteProperty(property, { removeTimeout: false, logOnDev: false });

        // If the cached data is still fresh, make it the least-reacently-used entry and return it
        if (Date.now() < cachedValue.expiresAt) {
          target.set(property, cachedValue);
          store.totalBytes = store.totalBytes + cachedValue.bytes;

          return cachedValue;
        }
      }
      // Return null wrapped in the default entry shape for an outdated or non-existent property.
      return { ...cachedValue, data: null, bytes: 0 };
    },

    // [[set]] trap
    // Note: target refers to Map instance (store.cache).
    set(target, property, value, receiver) {
      // Delete the property, if it exists already.
      // This is done to maintain the LRU order inside the cache/Map.
      deleteProperty(property);

      const isObject = isPlainObject(value);
      const ttl = (isObject && value.ttl) || defaultTTL;
      const ttlInMs = ttl * 1000;
      const data = isObject ? value.data : value;
      const newBytes = Buffer.byteLength(data, 'utf8');
      devLogger(`  Bytes added: ${newBytes}`);

      // Delete oldest cached properties if maxBytes for cached data is reached.
      purgeToCapacity(newBytes);

      // Add the property as the least-reacently-used entry
      target.set(property, { data, bytes: newBytes, expiresAt: Date.now() + ttlInMs });
      store.totalBytes = store.totalBytes + newBytes;
      addEvictionTimeout(property, ttlInMs + 1);

      // Purge least-recently-used _expired_ properties (up to MAX_PURGE_EXPIRED_PROPERTIES)
      purgeExpired(MAX_PURGE_EXPIRED_PROPERTIES);
      devLogger(`Total bytes: ${store.totalBytes}/${maxBytes}.`);
      
      // Return true to indicate successful property assignment
      return true;
    },
  });
};
