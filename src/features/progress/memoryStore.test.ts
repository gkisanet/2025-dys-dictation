import { describe, it, expect } from 'vitest';
import { createMemoryStore } from './memoryStore';
import type { Attempt } from './types';

const makeAttempt = (stageId: string, quizCorrect = 3, quizTotal = 3): Attempt => ({
  stageId,
  operation: 'add',
  operandA: 18,
  operandB: 24,
  quizCorrect,
  quizTotal,
  createdAt: 1000,
});

describe('createMemoryStore', () => {
  it('returns empty array initially', async () => {
    const store = createMemoryStore();
    expect(await store.getAllAttempts()).toEqual([]);
  });

  it('records two attempts and returns both in order with assigned ids', async () => {
    const store = createMemoryStore();
    const a1 = makeAttempt('add-1', 2, 3);
    const a2 = makeAttempt('add-2', 3, 3);
    await store.recordAttempt(a1);
    await store.recordAttempt(a2);

    const all = await store.getAllAttempts();
    expect(all).toHaveLength(2);
    expect(all[0].stageId).toBe('add-1');
    expect(all[0].id).toBeDefined();
    expect(all[1].stageId).toBe('add-2');
    expect(all[1].id).toBeDefined();
    expect(all[0].id).not.toEqual(all[1].id);
  });

  it('returns a copy — mutations to the result do not affect the store', async () => {
    const store = createMemoryStore();
    await store.recordAttempt(makeAttempt('add-1'));
    const first = await store.getAllAttempts();
    first.push(makeAttempt('add-2'));
    const second = await store.getAllAttempts();
    expect(second).toHaveLength(1);
  });

  it('instances are isolated from each other', async () => {
    const storeA = createMemoryStore();
    const storeB = createMemoryStore();
    await storeA.recordAttempt(makeAttempt('add-1'));
    expect(await storeB.getAllAttempts()).toHaveLength(0);
  });
});
