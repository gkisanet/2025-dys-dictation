import type { ProgressStore } from './types';
import { createMemoryStore } from './memoryStore';
import { createSqliteStore } from './sqliteStore';

function isBrowserWithOPFS(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'storage' in navigator
  );
}

let _store: ProgressStore | null = null;

export function getProgressStore(): ProgressStore {
  if (!_store) {
    if (isBrowserWithOPFS()) {
      // Lazy import via a function call — the module is imported at build time
      // but createSqliteStore() is only invoked here, never at module-eval time.
      // Vitest runs in jsdom where isBrowserWithOPFS() returns false,
      // so this branch (and sqlocal) is never executed in tests.
      _store = getSqliteStoreFactory()();
    } else {
      _store = createMemoryStore();
    }
  }
  return _store;
}

/** Reset the singleton — used in tests to get a fresh store. */
export function _resetProgressStore(): void {
  _store = null;
}

function getSqliteStoreFactory(): () => ProgressStore {
  return createSqliteStore;
}
