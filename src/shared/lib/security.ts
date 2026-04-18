import crypto from 'crypto';

/**
 * Security Utilities (Requirements 9.1, 9.2, 9.5)
 * Anonymous session management, PII detection, and security headers.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_HOURS = 4;

/**
 * PII detection patterns for auditing stored data (Requirement 9.1).
 */
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\b(\+?\d{1,3}[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:\d{4}[-\s]){3}\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

import { SECURITY_HEADERS } from './security-headers';

export { SECURITY_HEADERS };

export interface AnonymousSession {
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

/**
 * Generates an anonymous session token with no PII (Requirement 9.1).
 * Uses HMAC-SHA256 for integrity — no external JWT library needed.
 */
export function createAnonymousSession(): AnonymousSession {
  const sessionId = crypto.randomUUID();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_HOURS * 60 * 60 * 1000;

  const payload = `${sessionId}:${issuedAt}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');

  return { sessionId, issuedAt, expiresAt, signature };
}

/**
 * Serializes a session to a token string for transport.
 */
export function serializeSession(session: AnonymousSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return payload;
}

/**
 * Deserializes and validates a session token.
 * Returns null if token is invalid, expired, or tampered.
 */
export function validateSessionToken(token: string): AnonymousSession | null {
  try {
    const session: AnonymousSession = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf-8')
    );

    if (Date.now() > session.expiresAt) return null;

    const payload = `${session.sessionId}:${session.issuedAt}:${session.expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('hex');

    if (session.signature !== expectedSignature) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Scans text for PII patterns (Requirement 9.1).
 * Returns detected PII types or empty array if clean.
 */
export function detectPII(text: string): string[] {
  const detected: string[] = [];
  for (const [type, regex] of Object.entries(PII_PATTERNS)) {
    if (regex.test(text)) {
      detected.push(type);
    }
    regex.lastIndex = 0; // Reset global regex state
  }
  return detected;
}

/**
 * Sanitizes text by removing detected PII (Requirement 9.2).
 */
export function sanitizePII(text: string): string {
  let sanitized = text;
  for (const [, regex] of Object.entries(PII_PATTERNS)) {
    sanitized = sanitized.replace(regex, '[REDACTED]');
    regex.lastIndex = 0;
  }
  return sanitized;
}

/**
 * Validates an IoT API key (Requirement 10.1).
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  const validKey = process.env.IOT_API_KEY;
  if (!validKey) return true; // Allow if not configured (dev mode)
  return crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(validKey)
  );
}
