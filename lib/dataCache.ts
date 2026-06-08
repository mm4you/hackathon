type CacheEntry<T> = { expiresAt: number; value: T };

const MAX_CACHE_ENTRIES = 250;

const globalForCache = globalThis as unknown as { v2DataCache?: Map<string, CacheEntry<unknown>>; v2PendingCache?: Map<string, Promise<unknown>> };
const cache = globalForCache.v2DataCache ?? new Map<string, CacheEntry<unknown>>();
const pending = globalForCache.v2PendingCache ?? new Map<string, Promise<unknown>>();

globalForCache.v2DataCache = cache;
globalForCache.v2PendingCache = pending;

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>) {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) return entry.value;

  const pendingLoad = pending.get(key) as Promise<T> | undefined;
  if (pendingLoad) return pendingLoad;

  const promise = load().then((value) => {
    pruneCache(Date.now());
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    pending.delete(key);
    return value;
  }).catch((error) => {
    pending.delete(key);
    throw error;
  });
  pending.set(key, promise);
  return promise;
}

export function invalidateCache(...prefixes: string[]) {
  for (const key of cache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) cache.delete(key);
  }
  for (const key of pending.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) pending.delete(key);
  }
}

function pruneCache(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}
