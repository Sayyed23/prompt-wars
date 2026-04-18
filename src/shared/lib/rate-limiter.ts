import { getRedisClient } from './redis';

/**
 * Rate Limiter (Requirement 5.2)
 * Redis-backed sliding window rate limiting with per-endpoint tiers.
 */

export interface RateLimitTier {
  maxRequests: number;
  windowSeconds: number;
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  attendee: { maxRequests: 100, windowSeconds: 60 },
  iot: { maxRequests: 1000, windowSeconds: 60 },
  ai: { maxRequests: 10, windowSeconds: 60 },
  operations: { maxRequests: 500, windowSeconds: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until next allowed request
}

/**
 * Classifies an API path into a rate limit tier.
 */
export function classifyEndpoint(pathname: string): string {
  if (pathname.startsWith('/api/iot')) return 'iot';
  if (pathname.startsWith('/api/assistant')) return 'ai';
  if (pathname.startsWith('/api/alerts')) return 'operations';
  return 'attendee';
}

/**
 * Checks and increments rate limit for a given identifier and tier.
 * Uses Redis INCR with TTL for sliding window.
 */
export async function checkRateLimit(
  identifier: string,
  tierName: string
): Promise<RateLimitResult> {
  const tier = RATE_LIMIT_TIERS[tierName] || RATE_LIMIT_TIERS.attendee;
  const windowKey = Math.floor(Date.now() / 1000 / tier.windowSeconds);
  const redisKey = `ratelimit:${tierName}:${identifier}:${windowKey}`;
  const resetAt = (windowKey + 1) * tier.windowSeconds;

  try {
    const redis = await getRedisClient();
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, tier.windowSeconds);
    }

    const remaining = Math.max(0, tier.maxRequests - count);
    const allowed = count <= tier.maxRequests;

    return {
      allowed,
      limit: tier.maxRequests,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : tier.windowSeconds,
    };
  } catch {
    // If Redis is unavailable, allow the request (fail-open)
    return {
      allowed: true,
      limit: tier.maxRequests,
      remaining: tier.maxRequests,
      resetAt,
    };
  }
}

/**
 * Generates standard rate limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}
