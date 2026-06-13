import type { ProgressStore } from './types';
import { createMemoryStore } from './memoryStore';

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
      // Dynamic import so Vitest (jsdom) never evaluates sqlocal at module load
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSqliteStore } = require('./sqliteStore') as { createSqliteStore: () => ProgressStore };
      _store = createSqliteStore();
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
