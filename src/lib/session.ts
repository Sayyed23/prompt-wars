/**
 * Client-Side Session Storage Utilities (Requirement 4.5, 9.4)
 * Manages transient data like chat history and user preferences with custom TTL.
 */

interface SessionItem<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour (Requirement 9.4)

/**
 * Stores data in sessionStorage with a TTL.
 */
export function setSessionData<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  if (typeof window === 'undefined') return;

  const item: SessionItem<T> = {
    data,
    timestamp: Date.now() + ttlMs,
  };

  sessionStorage.setItem(key, JSON.stringify(item));
}

/**
 * Retrieves data from sessionStorage, checking for expiration.
 */
export function getSessionData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    const item: SessionItem<T> = JSON.parse(raw);

    // Check if the item has expired
    if (Date.now() > item.timestamp) {
      sessionStorage.removeItem(key);
      return null;
    }

    return item.data;
  } catch (err) {
    console.error(`Error parsing session data for key ${key}`, err);
    sessionStorage.removeItem(key);
    return null;
  }
}

/**
 * Removes data from sessionStorage.
 */
export function clearSessionData(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(key);
}

/**
 * Utility to clear all expired session items.
 */
export function cleanupExpiredSessions(): void {
  if (typeof window === 'undefined') return;
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key) {
      getSessionData(key); // This will trigger cleanup if expired
    }
  }
}
