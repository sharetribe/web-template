const Redis = require('ioredis');

let client;
function getRedis() {
  if (client) return client;

  const url = process.env.REDIS_URL || '';
  if (!url) {
    console.warn('[redis] REDIS_URL not set — using in-memory fallback (dev only)');
    // In-memory fallback so local dev keeps working
    const store = new Map();
    return {
      async get(key) { return store.get(key) || null; },
      async set(key, val, mode, ttl) {
        store.set(key, val);
        if (mode === 'EX' && ttl) setTimeout(() => store.delete(key), ttl * 1000).unref();
      },
      async del(key) { store.delete(key); },
      status: 'mock',
    };
  }

  client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  client.on('error', (e) => console.error('[redis] error', e));
  client.on('connect', () => console.log('[redis] connect'));
  client.on('ready', () => console.log('[redis] ready'));

  // connect eagerly but don't crash if fails; handlers above will log
  client.connect().catch(err => console.error('[redis] connect failed', err));
  return client;
}

module.exports = { getRedis };

