import type { Attempt, ProgressStore } from './types';

export function createMemoryStore(): ProgressStore {
  const data: Attempt[] = [];
  let nextId = 1;

  return {
    recordAttempt(a: Attempt): Promise<void> {
      data.push({ ...a, id: nextId++ });
      return Promise.resolve();
    },
    getAllAttempts(): Promise<Attempt[]> {
      return Promise.resolve([...data]);
    },
  };
}
