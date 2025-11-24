// Mock devLogger to prevent issues during testing
jest.mock('../log.js', () => ({
  devLogger: jest.fn(),
}));

const { createLRUCache } = require('./cache');

describe('LRUcache', () => {
  it('Set and get', () => {
    const memoryStore = { cache: new Map(), totalBytes: 0 };
    const cache = createLRUCache({ memoryStore, maxBytes: 32, ttl: 60 });
    // Set
    cache.xProp = 'x';
    // Get
    expect(cache.xProp.data).toEqual('x');
    expect(cache.xProp.bytes).toEqual(1);
    expect(cache.xProp.expiresAt).toBeGreaterThan(Date.now());
  });

  it('Get non-existent key', () => {
    const memoryStore = { cache: new Map(), totalBytes: 0 };
    const cache = createLRUCache({ memoryStore, maxBytes: 32, defaultTTL: 60 });
    expect(cache.xProp.data).toBeNull();
    expect(cache.xProp.bytes).toEqual(0);
  });

  it('cache does not grow beyond maxBytes', () => {
    const memoryStore = { cache: new Map(), totalBytes: 0 };
    const cache = createLRUCache({ memoryStore, maxBytes: 4, ttl: 60 });
    for (let i = 0; i < 10; i++) {
      // Note: this cache implementation only counts the bytes of cached values - not the keys and metadata
      cache[`x${i}`] = 'x';
    }
    expect([...memoryStore.cache.keys()]).toEqual(['x6', 'x7', 'x8', 'x9']);
    expect(memoryStore.cache.get('x0')).toBeUndefined();
  });

  it('cache does not return expired properties', () => {
    const prefilledCache = new Map();
    // Add expired property
    prefilledCache.set('xProp', { data: 'x', bytes: 1, expiresAt: 1735827232551 });

    const memoryStore = { cache: prefilledCache, totalBytes: 1 };
    const cache = createLRUCache({ memoryStore, maxBytes: 4, ttl: 60 });
    const { data, bytes } = cache.xProp;

    expect(data).toBeNull();
    expect(bytes).toEqual(0);
    // Expired property is deleted from the memory / Map when [[get]] trap is called
    expect(memoryStore.cache.get('xProp')).toBeUndefined();
  });

  it('cache does return non-expired properties', () => {
    const prefilledCache = new Map();
    const xPropExpires = Date.now() + 10000;
    prefilledCache.set('xProp', { data: 'x', bytes: 1, expiresAt: xPropExpires });

    const memoryStore = { cache: prefilledCache, totalBytes: 1 };
    const cache = createLRUCache({ memoryStore, maxBytes: 4, ttl: 60 });
    const { data, bytes, expiresAt } = cache.xProp;

    expect(data).toEqual('x');
    expect(bytes).toEqual(1);
    expect(expiresAt).toEqual(expiresAt);
  });

  it('cache maintains LRU order', () => {
    const memoryStore = { cache: new Map(), totalBytes: 0 };
    const cache = createLRUCache({ memoryStore, maxBytes: 4, ttl: 60 });

    // create x0 - x9
    for (let i = 0; i < 10; i++) {
      cache[`x${i}`] = 'x';
    }
    cache.x6; // x6 is accessed after x9
    cache.x10 = 'x';

    expect([...memoryStore.cache.keys()]).toEqual(['x8', 'x9', 'x6', 'x10']);
  });
});
