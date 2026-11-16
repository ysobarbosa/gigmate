import { InjectionToken } from '@angular/core';

/** The subset of the Web Storage API the local adapters use. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Where the local adapters persist data. Defaults to `localStorage`, falling
 * back to memory when it is unavailable (blocked cookies, some private modes),
 * so the app still works, just without persistence. Tests provide memory storage.
 */
export const KEY_VALUE_STORAGE = new InjectionToken<KeyValueStorage>(
  'KEY_VALUE_STORAGE',
  { providedIn: 'root', factory: () => browserStorageOrMemory() },
);

export function createMemoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

export function browserStorageOrMemory(
  getStorage: () => Storage = () => globalThis.localStorage,
): KeyValueStorage {
  try {
    const storage = getStorage();
    // Accessing or writing can throw even when the object exists.
    const probe = '__gigmate_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return createMemoryStorage();
  }
}

/** Reads JSON, returning `fallback` when the key is missing or corrupted. */
export function readJson<T>(
  storage: KeyValueStorage,
  key: string,
  fallback: T,
): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(
  storage: KeyValueStorage,
  key: string,
  value: unknown,
): void {
  storage.setItem(key, JSON.stringify(value));
}
