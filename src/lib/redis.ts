import { createClient, RedisClientType } from 'redis';

/**
 * Redis Client Manager (Requirement 11.5)
 * Handles connection pooling and provide shared instance for the application.
 */

let client: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;

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
          if (retries > 10) {
            console.error('Redis max retries reached. Stopping reconnection.');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err: Error) => console.error('Redis Client Error', err));

    await client.connect();
    connectionPromise = null;
    return client;
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
