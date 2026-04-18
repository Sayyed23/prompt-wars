import { getCache, setCache } from './redis';

/**
 * Centralized Cache Strategy (Requirement 5.2)
 * TTL configuration, request coalescing, and connection pool constants.
 */

/** Cache TTLs in seconds per data type */
export const CACHE_TTL = {
  densitySnapshot: 30,
  zoneDensity: 30,
  queuePrediction: 60,
  activealerts: 15,
  healthCheck: 10,
  staticAssets: 31536000, // 1 year
} as const;

/** Connection pool configuration */
export const POOL_CONFIG = {
  redis: { maxConnections: 50 },
  postgres: { maxConnections: 20, idleTimeoutMs: 30000 },
} as const;

/** HTTP Cache-Control header presets */
export const CACHE_HEADERS = {
  realtime: 'no-cache, no-store, must-revalidate',
  density: 'public, max-age=10, stale-while-revalidate=10',
  predictions: 'public, max-age=30, stale-while-revalidate=30',
  static: 'public, max-age=31536000, immutable',
  sse: 'no-cache',
} as const;

/**
 * In-flight request coalescing map.
 * Deduplicates concurrent identical requests by sharing a single promise.
 */
const inflight = new Map<string, Promise<string | null>>();

/**
 * Cached fetch with coalescing — prevents duplicate concurrent Redis reads.
 * If two requests for the same key arrive simultaneously, only one Redis call is made.
 */
export async function cachedFetch(key: string): Promise<string | null> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = getCache(key).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

/**
 * Cache-aside pattern: fetch from cache, or compute and store.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const cached = await cachedFetch(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const result = await compute();
  await setCache(key, JSON.stringify(result), ttlSeconds);
  return result;
}
