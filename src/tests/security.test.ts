import { describe, it, expect } from 'vitest';
import {
  createAnonymousSession,
  serializeSession,
  validateSessionToken,
  detectPII,
  sanitizePII,
  SECURITY_HEADERS,
} from '../lib/security';
import {
  RATE_LIMIT_TIERS,
  classifyEndpoint,
  rateLimitHeaders,
} from '../lib/rate-limiter';

/**
 * Security Property Tests (Requirements 9.1, 9.2, 9.5)
 */
describe('Security: No PII Storage (Property 33)', () => {
  it('anonymous sessions contain no PII', () => {
    const session = createAnonymousSession();

    // Session must contain only: sessionId (UUID), timestamps, signature
    expect(session.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(typeof session.issuedAt).toBe('number');
    expect(typeof session.expiresAt).toBe('number');
    expect(typeof session.signature).toBe('string');

    // No name, email, phone, or any PII field
    const sessionStr = JSON.stringify(session);
    expect(detectPII(sessionStr)).toEqual([]);
  });

  it('session tokens have 4-hour expiry', () => {
    const session = createAnonymousSession();
    const ttlMs = session.expiresAt - session.issuedAt;
    const ttlHours = ttlMs / (1000 * 60 * 60);
    expect(ttlHours).toBe(4);
  });

  it('serialized tokens can be validated', () => {
    const session = createAnonymousSession();
    const token = serializeSession(session);
    const validated = validateSessionToken(token);

    expect(validated).not.toBeNull();
    expect(validated!.sessionId).toBe(session.sessionId);
  });

  it('tampered tokens are rejected', () => {
    const session = createAnonymousSession();
    session.signature = 'tampered_signature';
    const token = serializeSession(session);
    const validated = validateSessionToken(token);

    expect(validated).toBeNull();
  });

  it('expired tokens are rejected', () => {
    const session = createAnonymousSession();
    session.expiresAt = Date.now() - 1000; // Already expired
    const token = serializeSession(session);
    const validated = validateSessionToken(token);

    expect(validated).toBeNull();
  });
});

describe('Security: PII Detection (Requirement 9.1)', () => {
  it('detects email addresses', () => {
    expect(detectPII('contact user@example.com')).toContain('email');
  });

  it('detects phone numbers', () => {
    expect(detectPII('call 123-456-7890')).toContain('phone');
  });

  it('detects SSN patterns', () => {
    expect(detectPII('ssn: 123-45-6789')).toContain('ssn');
  });

  it('returns empty for clean text', () => {
    expect(detectPII('What zone is closest to the food court?')).toEqual([]);
  });

  it('sanitizes PII from text', () => {
    const dirty = 'Email me at user@example.com and call 123-456-7890';
    const clean = sanitizePII(dirty);
    expect(clean).not.toContain('user@example.com');
    expect(clean).not.toContain('123-456-7890');
    expect(clean).toContain('[REDACTED]');
  });
});

describe('Security: HTTPS & Headers (Property 35)', () => {
  it('security headers include HSTS with max-age', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('includeSubDomains');
  });

  it('security headers include X-Content-Type-Options', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
  });

  it('security headers include X-Frame-Options', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('security headers include CSP', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("default-src 'self'");
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  });

  it('all required security headers are present', () => {
    const required = [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Content-Security-Policy',
      'Permissions-Policy',
    ];
    for (const header of required) {
      expect(SECURITY_HEADERS).toHaveProperty(header);
    }
  });
});

describe('Rate Limiting Configuration', () => {
  it('defines all required endpoint tiers', () => {
    expect(RATE_LIMIT_TIERS).toHaveProperty('attendee');
    expect(RATE_LIMIT_TIERS).toHaveProperty('iot');
    expect(RATE_LIMIT_TIERS).toHaveProperty('ai');
    expect(RATE_LIMIT_TIERS).toHaveProperty('operations');
  });

  it('attendee tier allows 100 req/min', () => {
    expect(RATE_LIMIT_TIERS.attendee.maxRequests).toBe(100);
    expect(RATE_LIMIT_TIERS.attendee.windowSeconds).toBe(60);
  });

  it('IoT tier allows 1000 req/min', () => {
    expect(RATE_LIMIT_TIERS.iot.maxRequests).toBe(1000);
  });

  it('AI tier allows 10 req/min', () => {
    expect(RATE_LIMIT_TIERS.ai.maxRequests).toBe(10);
  });

  it('classifies endpoints to correct tiers', () => {
    expect(classifyEndpoint('/api/iot/ingest')).toBe('iot');
    expect(classifyEndpoint('/api/assistant/chat')).toBe('ai');
    expect(classifyEndpoint('/api/alerts/create')).toBe('operations');
    expect(classifyEndpoint('/api/crowd/density')).toBe('attendee');
    expect(classifyEndpoint('/api/wayfinding/route')).toBe('attendee');
  });

  it('rate limit headers include all required fields', () => {
    const headers = rateLimitHeaders({
      allowed: true,
      limit: 100,
      remaining: 50,
      resetAt: 1700000000,
    });
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('50');
    expect(headers['X-RateLimit-Reset']).toBe('1700000000');
  });

  it('rate limit headers include Retry-After when exceeded', () => {
    const headers = rateLimitHeaders({
      allowed: false,
      limit: 100,
      remaining: 0,
      resetAt: 1700000000,
      retryAfter: 60,
    });
    expect(headers['Retry-After']).toBe('60');
  });
});
