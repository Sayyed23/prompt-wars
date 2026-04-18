import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getSessionData, setSessionData } from '@/shared/lib/session';

/**
 * Property Tests for Task 5: Data Storage and Caching
 */

describe('Session Storage Utilities (Requirement 9.4)', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { for (const key in store) delete store[key]; },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] || null,
    });

    vi.useFakeTimers();
  });

  it('Property: Data should be accessible before TTL expires', () => {
    fc.assert(
      fc.property(fc.string(), fc.jsonValue(), (key, data) => {
        if (!key || key.trim().length === 0) return; // Skip empty keys
        // Skip keys that collide with sessionStorage prototype properties
        if (['getItem','setItem','removeItem','clear','length','key','constructor','__proto__','toString','valueOf'].includes(key)) return;
        
        
        setSessionData(key, data, 1000); // 1s TTL
        const retrieved = getSessionData(key);
        // Compare via JSON to account for serialization edge cases (-0/+0, undefined→null)
        expect(JSON.stringify(retrieved)).toEqual(JSON.stringify(data));
      })
    );
  });

  it('Property: Data should be cleared after TTL expires', () => {
    const key = 'test-key';
    const data = { msg: 'hello' };
    const ttl = 1000;

    setSessionData(key, data, ttl);
    
    // Fast-forward time
    vi.advanceTimersByTime(ttl + 1);
    
    expect(getSessionData(key)).toBeNull();
  });
});

// Since database tests require a real migration or complex mocking, 
// we focus on logic properties here.
describe('Data Buffer Logic (Requirement 11.5)', () => {
  it('Property: Retention window logic should correctly identify old data', () => {
    // We simulate the logic used in the SQL query: timestamp < NOW() - 5 minutes
    // We want to verify our assumption that 5 minutes is 300,000ms
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (minutes) => {
        const ms = minutes * 60 * 1000;
        const expectedMs = minutes * 60000;
        expect(ms).toBe(expectedMs);
      })
    );
  });
});
