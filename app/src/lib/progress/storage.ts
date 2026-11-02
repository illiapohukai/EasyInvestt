/**
 * Thin, failure-tolerant wrapper around window.localStorage.
 * localStorage can be missing (SSR/prerender), disabled by the user, full,
 * or throw a SecurityError in some privacy modes – none of this may crash the app.
 */

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Returns the parsed JSON value, or null if missing, unreadable or malformed. */
export function readJson(key: string): unknown {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Like readJson, but distinguishes missing values from unreadable ones. */
export function readJsonDetailed(key: string): {
  found: boolean;
  value: unknown;
  invalid: boolean;
} {
  const storage = getStorage();
  if (!storage) return { found: false, value: null, invalid: false };
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { found: false, value: null, invalid: false };
  }
  if (raw === null) return { found: false, value: null, invalid: false };
  try {
    return { found: true, value: JSON.parse(raw) as unknown, invalid: false };
  } catch {
    return { found: true, value: null, invalid: true };
  }
}

/** Returns true when the value was stored successfully. */
export function writeJson(key: string, value: unknown): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Checks whether values can actually be written (not just whether the API exists). */
export function isStorageWritable(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const probe = "__geldstart_probe__";
  try {
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
