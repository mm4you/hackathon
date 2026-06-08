type CacheEntry<T> = { expiresAt: number; value: T };

const globalForCache = globalThis as unknown as { v2DataCache?: Map<string, CacheEntry<unknown>> };
const cache = globalForCache.v2DataCache ?? new Map<string, CacheEntry<unknown>>();

globalForCache.v2DataCache = cache;

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>) {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) return entry.value;

  const value = await load();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateCache(...prefixes: string[]) {
  for (const key of cache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) cache.delete(key);
  }
}
