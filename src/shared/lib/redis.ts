import { createClient, RedisClientType } from 'redis';

/**
 * Redis Client Manager (Requirement 11.5)
 * Handles connection pooling and provide shared instance for the application.
 */

let client: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;
const memoryStore = new Map<string, { value: string; expiresAt?: number }>();
const memorySets = new Map<string, Set<string>>();

function createMemoryRedisClient(): RedisClientType {
  const getEntry = (key: string) => {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry;
  };

  return {
    isOpen: true,
    get: async (key: string) => getEntry(key)?.value ?? null,
    set: async (key: string, value: string, options?: { EX?: number }) => {
      memoryStore.set(key, {
        value,
        expiresAt: options?.EX ? Date.now() + options.EX * 1000 : undefined,
      });
      return 'OK';
    },
    del: async (key: string) => (memoryStore.delete(key) ? 1 : 0),
    incr: async (key: string) => {
      const current = Number.parseInt(getEntry(key)?.value ?? '0', 10) || 0;
      const next = current + 1;
      memoryStore.set(key, { value: String(next), expiresAt: getEntry(key)?.expiresAt });
      return next;
    },
    expire: async (key: string, seconds: number) => {
      const entry = getEntry(key);
      if (!entry) return 0;
      memoryStore.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 });
      return 1;
    },
    sAdd: async (key: string, value: string) => {
      const set = memorySets.get(key) ?? new Set<string>();
      const sizeBefore = set.size;
      set.add(value);
      memorySets.set(key, set);
      return set.size - sizeBefore;
    },
    sMembers: async (key: string) => Array.from(memorySets.get(key) ?? []),
    sRem: async (key: string, value: string) => {
      const set = memorySets.get(key);
      if (!set) return 0;
      return set.delete(value) ? 1 : 0;
    },
    publish: async () => 0,
    quit: async () => 'OK',
    flushDb: async () => {
      memoryStore.clear();
      memorySets.clear();
      return 'OK';
    },
  } as unknown as RedisClientType;
}

/**
 * Initializes and returns the Redis client singleton.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (client?.isOpen) return client;

  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 500);
        },
      },
    });

    client.on('error', () => {
      // Local development and unit tests can run without Redis; callers receive
      // an in-memory fallback if the initial connection cannot be established.
    });

    try {
      await client.connect();
      connectionPromise = null;
      return client;
    } catch {
      connectionPromise = null;
      if (process.env.VITEST) {
        client = null;
        throw new Error('Redis unavailable in test environment');
      }
      client = createMemoryRedisClient();
      return client;
    }
  })();

  return connectionPromise;
}

/**
 * Sets a key in Redis with an optional TTL.
 */
export async function setCache(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  const redis = await getRedisClient();
  if (ttlSeconds !== undefined) {
    await redis.set(key, value, { EX: ttlSeconds });
  } else {
    await redis.set(key, value);
  }
}

/**
 * Retrieves a value from Redis.
 */
export async function getCache(key: string): Promise<string | null> {
  const redis = await getRedisClient();
  return redis.get(key);
}

/**
 * Deletes a key from Redis.
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.del(key);
}

/**
 * Flushes all keys from the current database (useful for testing).
 */
export async function flushCache(): Promise<void> {
  const redis = await getRedisClient();
  await redis.flushDb();
}
