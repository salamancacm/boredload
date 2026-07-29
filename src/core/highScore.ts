/**
 * Thin localStorage wrapper for a persisted best score. Every access is
 * wrapped in try/catch: private browsing, disabled storage, and SSR (no
 * `window`) can all make localStorage throw or be absent — in every case
 * we degrade to "no persisted score" rather than crash the game.
 */

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getHighScore(key: string): number {
  const storage = getStorage();
  if (!storage) return 0;
  try {
    const raw = storage.getItem(key);
    const parsed = raw !== null ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

/** Persists `score` under `key` only if it's a new high. Returns the resulting high score. */
export function setHighScore(key: string, score: number): number {
  const current = getHighScore(key);
  if (score <= current) return current;
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(key, String(score));
    } catch {
      // Storage full or blocked — the in-memory high score for this session still works.
    }
  }
  return score;
}
