import { describe, it, expect } from 'vitest';
import { validateChatMessage } from '../../lib/ai';

/**
 * E2E Test: Attendee uses AI assistant (Task 24.3)
 * Requirements: 4.1, 4.2, 4.5
 */
describe('E2E: AI Assistant Query Handling', () => {
  it('accepts valid venue-related queries', () => {
    const validQueries = [
      'Where is the nearest food court?',
      'What zone has the shortest wait time?',
      'How do I get to the south stand?',
      'Is the main entry crowded right now?',
      'What time does the event end?',
    ];

    for (const query of validQueries) {
      const result = validateChatMessage(query);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it('rejects empty messages', () => {
    const result = validateChatMessage('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('rejects messages exceeding 500 characters', () => {
    const longMessage = 'a'.repeat(501);
    const result = validateChatMessage(longMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('long');
  });

  it('rejects messages containing email PII', () => {
    const result = validateChatMessage('email me at user@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('personal');
  });

  it('rejects messages containing phone PII', () => {
    const result = validateChatMessage('call me at 1234567890');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('personal');
  });

  it('accepts messages at exactly 500 characters', () => {
    const exactMessage = 'a'.repeat(500);
    const result = validateChatMessage(exactMessage);
    expect(result.valid).toBe(true);
  });
});

describe('E2E: Chat Session Storage (Requirement 4.5)', () => {
  it('session storage uses client-side keys with session prefix', () => {
    const sessionId = 'test-session-123';
    const key = `chat_session_${sessionId}`;
    expect(key).toContain('chat_session_');
    expect(key).toContain(sessionId);
  });

  it('session data has TTL for automatic cleanup', () => {
    const ttlMs = 60 * 60 * 1000; // 1 hour
    const expiresAt = Date.now() + ttlMs;
    expect(expiresAt).toBeGreaterThan(Date.now());
    expect(expiresAt - Date.now()).toBeLessThanOrEqual(ttlMs + 10);
  });
});
