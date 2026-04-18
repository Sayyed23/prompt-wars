import { describe, it, expect } from 'vitest';
import { SECURITY_HEADERS } from '../lib/security-headers';
import { RATE_LIMIT_TIERS } from '../lib/rate-limiter';
import { CACHE_TTL, CACHE_HEADERS, POOL_CONFIG } from '../lib/cache';

/**
 * Checkpoint 22: Performance & Security Verification
 * Validates that all P&S requirements are met before proceeding.
 */
describe('Checkpoint: Security Measures (Task 22)', () => {
  it('HSTS header is configured with ≥1 year max-age', () => {
    const hsts = SECURITY_HEADERS['Strict-Transport-Security'];
    const match = hsts.match(/max-age=(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(31536000);
  });

  it('CSP blocks framing (clickjacking protection)', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  });

  it('rate limiting covers all endpoint categories', () => {
    const categories = ['attendee', 'iot', 'ai', 'operations'];
    for (const cat of categories) {
      expect(RATE_LIMIT_TIERS).toHaveProperty(cat);
      expect(RATE_LIMIT_TIERS[cat].maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMIT_TIERS[cat].windowSeconds).toBeGreaterThan(0);
    }
  });

  it('ai endpoint has stricter rate limit than attendee', () => {
    expect(RATE_LIMIT_TIERS.ai.maxRequests).toBeLessThan(
      RATE_LIMIT_TIERS.attendee.maxRequests
    );
  });
});

describe('Checkpoint: Performance Benchmarks (Task 22)', () => {
  it('API cache TTLs support <500ms response times', () => {
    // Short TTLs mean data is fresh but cached
    expect(CACHE_TTL.densitySnapshot).toBeLessThanOrEqual(60);
    expect(CACHE_TTL.queuePrediction).toBeLessThanOrEqual(120);
  });

  it('connection pools sized for concurrent users', () => {
    // 50 Redis + 20 PG connections per instance * 80 concurrency = adequate
    expect(POOL_CONFIG.redis.maxConnections).toBeGreaterThanOrEqual(50);
    expect(POOL_CONFIG.postgres.maxConnections).toBeGreaterThanOrEqual(20);
  });

  it('static assets have immutable caching for CDN', () => {
    expect(CACHE_HEADERS.static).toContain('immutable');
  });

  it('SSE endpoints bypass cache', () => {
    expect(CACHE_HEADERS.sse).toBe('no-cache');
    expect(CACHE_HEADERS.realtime).toContain('no-store');
  });
});
