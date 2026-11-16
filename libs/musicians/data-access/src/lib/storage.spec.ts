import {
  browserStorageOrMemory,
  createMemoryStorage,
  readJson,
  writeJson,
} from './storage';

describe('storage', () => {
  it('round-trips JSON', () => {
    const storage = createMemoryStorage();
    writeJson(storage, 'k', { a: [1, 2] });
    expect(readJson(storage, 'k', null)).toEqual({ a: [1, 2] });
  });

  it('returns the fallback for a missing key', () => {
    expect(readJson(createMemoryStorage(), 'missing', 'fallback')).toBe(
      'fallback',
    );
  });

  it('returns the fallback for corrupted JSON instead of throwing', () => {
    const storage = createMemoryStorage({ k: '{not json' });
    expect(readJson(storage, 'k', [])).toEqual([]);
  });

  it('falls back to memory when localStorage throws', () => {
    const storage = browserStorageOrMemory(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });

  it('uses the browser storage when it works', () => {
    expect(browserStorageOrMemory()).toBe(globalThis.localStorage);
  });
});
