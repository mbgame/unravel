/**
 * Type-safe localStorage helpers with JSON serialization.
 * All methods are safe to call in SSR (Next.js) environments.
 */

/**
 * Retrieves and deserializes a value from localStorage.
 *
 * @param key - Storage key
 * @returns Parsed value, or `null` if key doesn't exist or parsing fails
 */
export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Serializes and stores a value in localStorage.
 *
 * @param key - Storage key
 * @param value - Value to store (must be JSON-serializable)
 * @returns `true` if stored successfully, `false` otherwise
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a key from localStorage.
 *
 * @param key - Storage key to remove
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Silently fail — storage unavailable
  }
}

/**
 * Clears all keys from localStorage.
 * Use with caution in production.
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.clear();
  } catch {
    // Silently fail — storage unavailable
  }
}

// ── Offline score queue ────────────────────────────────────────────────────

/** Shape of a queued offline score submission. */
export interface OfflineScore {
  levelId: string;
  timeMs: number;
  moves: number;
  hintsUsed: number;
  /** Unix timestamp when the score was queued. */
  queuedAt: number;
}

/** localStorage key for the offline score queue. */
const OFFLINE_SCORE_QUEUE_KEY = 'unravel-offline-scores';

/**
 * Adds a score to the offline submission queue.
 * Scores are flushed once the device comes back online via `flushOfflineScores`.
 *
 * @param score - Score data to queue
 */
export function queueOfflineScore(score: Omit<OfflineScore, 'queuedAt'>): void {
  const existing = getStorageItem<OfflineScore[]>(OFFLINE_SCORE_QUEUE_KEY) ?? [];
  existing.push({ ...score, queuedAt: Date.now() });
  setStorageItem(OFFLINE_SCORE_QUEUE_KEY, existing);
}

/**
 * Retrieves and clears all queued offline scores, then submits them.
 * Intended to be called when `navigator.onLine` transitions to `true`.
 *
 * @param submitFn - Async function that submits a single score record
 */
export async function flushOfflineScores(
  submitFn: (score: OfflineScore) => Promise<void>,
): Promise<void> {
  if (typeof window === 'undefined') return;

  const queue = getStorageItem<OfflineScore[]>(OFFLINE_SCORE_QUEUE_KEY);
  if (!queue?.length) return;

  // Clear the queue before submitting to prevent double-submission
  setStorageItem<OfflineScore[]>(OFFLINE_SCORE_QUEUE_KEY, []);

  const results = await Promise.allSettled(queue.map((s) => submitFn(s)));

  // Re-queue any that failed
  const failed = queue.filter((_, i) => results[i].status === 'rejected');
  if (failed.length > 0) {
    setStorageItem(OFFLINE_SCORE_QUEUE_KEY, failed);
  }
}

/**
 * Checks whether localStorage is available in the current environment.
 *
 * @returns `true` if localStorage can be read/written
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
