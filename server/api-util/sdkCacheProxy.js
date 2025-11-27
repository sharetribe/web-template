////////////////////////////////////////////////////////////
// The built-in LRU cache is a simple in-memory cache.    //
// Note: If you plan to cache other API endpoints,        //
// you probably should use a more battle-tested solution. //
////////////////////////////////////////////////////////////
const { isPlainObject, isFunction } = require('./types.js');
const { devLogger } = require('../log.js');
const { createLRUCache } = require('./cache.js');

const pickTTL = (variable, defaultValue) =>
  variable != null ? parseInt(variable, 10) : defaultValue;

const MARKETPLACE_ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;

// Used as a default TTL (time-to-live) if there's no endpoint-specific TTL set.
// Note 1: This is used for assets fetched by the 'latest' alias.
// Note 2: This is by default disabled (by using 0 as the default value), but if marketplace operators
// are fine using a small TTL (e.g. 10 seconds), it could be taken into use.
// It would improve performance since app configs (incl. translations) are using 'latest' alias on SSR.
const TTL = pickTTL(process.env.TTL, 0);
// For the versioned assets we use a longer TTL: 1 day
const TTL_ASSETS_BY_VERSION = pickTTL(process.env.TTL_ASSETS_BY_VERSION, 24 * 60 * 60);

// 10Mb aka 10*1024*1024 = 10485760
const MAX_BYTES = 10485760;

// By default, we only cache asset endpoints.
// Marketplace API endpoints need more work:
// - Serialization: responses contain custom types like Money / UUID
// - Relationships: responses contain API entities that are referenced by multiple endpoints
const CACHEABLE_SDK_ENDPOINTS = [
  'sdk.assetByAlias',
  'sdk.assetsByAlias',
  'sdk.assetByVersion',
  'sdk.assetsByVersion',
];

const memoryStore = {
  cache: new Map(),
  expirations: new Map(),
  totalBytes: 0,
};

// Note: asset responses don't need reviver & replacer for stringification & parsing,
// because they don't contain special types like Money / UUID
const serializeAssetResponse = responseObj => JSON.stringify(responseObj);
const deserializeAssetResponse = cacheString => JSON.parse(cacheString);

/**
 * Only these endpoints are considered to be cached.
 * Assets are the primary target because they don't contain
 * API entities that are referenced by multiple endpoints.
 *
 * NOTE: we don't add Marketplace API calls (like sdk.listings.show) to cache.
 * Those API entities might be fetched as a relationship with another call.
 * That could lead to strange behaviour where listing information changes to older one etc.
 */
const sdkEndpointCacheConfig = {
  // Pages (like landing-page.json) uses assetByVersion
  'sdk.assetByVersion': args => {
    // If the key is null, the call is not cached.
    // Therefore, it's possible to filter asset caching by checking args?.[0]?.path === content/pages/landing-page.json etc.
    const argsStr = args?.[0] ? JSON.stringify(args[0]) : null;
    const cacheKey = argsStr ? `${MARKETPLACE_ROOT_URL}#sdk.assetByVersion(${argsStr})` : null;
    return {
      key: cacheKey,
      ttl: TTL_ASSETS_BY_VERSION,
      serialize: serializeAssetResponse,
      deserialize: deserializeAssetResponse,
    };
  },

  // By default, sdk.assetsByAlias is only called for app-wide assets
  'sdk.assetsByAlias': args => {
    // NOTE: we shorten the appCdnAssets, which are a collection of app-wide configs
    //       If you have multiple calls that fetch multiple assets, you need to change this.
    const { paths, alias } = args[0] || {};
    const isAboutAppCdnAssets = paths?.length > 1;
    const argsModified = isAboutAppCdnAssets ? { paths: ['<appCdnAssets>'], alias } : args[0];
    const argsStr = JSON.stringify(argsModified);
    const cacheKey = args?.[0] ? `${MARKETPLACE_ROOT_URL}#sdk.assetsByAlias(${argsStr})` : null;
    return {
      key: cacheKey,
      ttl: TTL,
      serialize: serializeAssetResponse,
      deserialize: deserializeAssetResponse,
    };
  },
};

/**
 * Initialize proxy for selected SDK endpoint (sdk.assetByVersion and sdk.assetsByAlias) calls.
 * The proxy uses a simple LRU cache for calls hitting those endpoints.
 * Note: If you plan to cache other API endpoints,
 * you probably should use a more battle-tested solution.
 *
 * @param {SharetribeSDK} sdk - SharetribeSDK instance
 * @param {number} [maxBytes] - Maximum bytes to store in cache (overrides the default value 10485760).
 * @returns {Proxy|SharetribeSDK} - Proxied SharetribeSDK instance if ttl is given or set through environment variables, otherwise the original SDK instance
 */
exports.getSDKProxy = (sdk, maxBytes = MAX_BYTES) => {
  // Note, memoryStore is defined on this file scope
  const cache = createLRUCache({ memoryStore, maxBytes, defaultTTL: TTL });

  // Return proxied SDK instance that uses LRU cache for given endpoints (sdkEndpointCacheConfig)
  const createProxy = (sdkPartial, path) => {
    return new Proxy(sdkPartial, {
      // [[get]] trap
      get(target, property, receiver) {
        // Note: the expectation is that only a proxy will have this property (not the target).
        // So, we can use this from-a-proxy response to avoid creating proxys on top of proxys.
        if (property === '_isProxy') {
          return true;
        }

        const value = target[property];

        if (value == null) {
          // calling non-existing SDK endpoint
          return;
        }

        if (value._isProxy) {
          // Is this nested object already proxied?
          return value;
        }

        // Let's proxy only relevant nested objects instead of Arrays, Dates, Strings, etc.
        if (isPlainObject(value)) {
          // Create a new proxy for a nested object in the current SDK endpoint path
          target[property] = createProxy(value, `${path}.${property}`);
          return target[property];
        }

        const endPointPath = `${path}.${property}`;
        const isCacheable = CACHEABLE_SDK_ENDPOINTS.includes(endPointPath);
        const getCacheConfig = sdkEndpointCacheConfig[endPointPath];

        if (isFunction(value) && isCacheable && !!getCacheConfig) {
          // Handle configured API endpoints
          const handler = (...args) => {
            const { key, ttl, serialize, deserialize } = getCacheConfig(args);

            // If cache key, serialize and deserialize are not given, the call is not cached.
            const useCache = key != null && serialize != null && deserialize != null;

            const cachedEntry = useCache ? cache[key] : {};
            if (cachedEntry.data) {
              devLogger(`Cache was hit for the key: ${key}`);
              return Promise.resolve(deserialize(cachedEntry.data));
            }

            const beforeCallTimestamp = Date.now();
            const _this = this === receiver ? target : this;

            // If cache does not have the data, we need to call the SDK endpoint and cache the response
            return value.apply(_this, args).then(response => {
              const entryTTL = ttl && ttl > 0 ? ttl : 0;

              if (useCache && entryTTL > 0 && response.status === 200) {
                const serializedResponse = serialize(response);

                devLogger(
                  `Add cache entry.\n  Cache key: ${key}\n  The call took: ${Date.now() -
                    beforeCallTimestamp} ms`
                );
                // Set the response value to cache
                cache[key] = { ttl: entryTTL, data: serializedResponse };
              }
              return response;
            });
          };
          return handler;
        } else {
          // Unhandled functions and objects. Mainly live calls to SDK-
          // The [[get]] handles the SDK endpoint calls
          devLogger(`${endPointPath} was called.`);
          return value;
        }
      },

      // [[apply]] trap for functions
      apply(target, thisArg, args = []) {
        // NOTE: this is not really in use, since we don't create proxy for functions
        return Reflect.apply(target, thisArg, args);
      },
    });
  };
  return createProxy(sdk, 'sdk');
};
