import { describe, it, expect } from 'vitest';
import { foldStage, foldAll } from './progressLogic';
import type { Attempt } from './types';

const makeAttempt = (stageId: string, quizCorrect: number, quizTotal: number): Attempt => ({
  stageId,
  operation: 'add',
  operandA: 18,
  operandB: 24,
  quizCorrect,
  quizTotal,
  createdAt: Date.now(),
});

describe('foldStage', () => {
  it('empty attempts → zeros and not mastered', () => {
    const result = foldStage('add-1', []);
    expect(result).toEqual({ stageId: 'add-1', attempts: 0, bestScore: 0, lastScore: 0, mastered: false });
  });

  it('one perfect attempt (quizCorrect === quizTotal > 0) → mastered', () => {
    const attempts = [makeAttempt('add-1', 3, 3)];
    const result = foldStage('add-1', attempts);
    expect(result.mastered).toBe(true);
    expect(result.bestScore).toBe(1);
    expect(result.lastScore).toBe(1);
    expect(result.attempts).toBe(1);
  });

  it('two attempts with best ratio >= 0.8 → mastered', () => {
    const attempts = [makeAttempt('add-1', 4, 5), makeAttempt('add-1', 4, 5)];
    const result = foldStage('add-1', attempts);
    expect(result.mastered).toBe(true);
    expect(result.bestScore).toBeCloseTo(0.8);
    expect(result.attempts).toBe(2);
  });

  it('one attempt with ratio 0.8 → NOT mastered (needs >= 2 attempts)', () => {
    const attempts = [makeAttempt('add-1', 4, 5)];
    const result = foldStage('add-1', attempts);
    expect(result.mastered).toBe(false);
    expect(result.bestScore).toBeCloseTo(0.8);
  });

  it('bestScore is the maximum across attempts', () => {
    const attempts = [makeAttempt('add-1', 2, 5), makeAttempt('add-1', 4, 5), makeAttempt('add-1', 1, 5)];
    const result = foldStage('add-1', attempts);
    expect(result.bestScore).toBeCloseTo(0.8);
    expect(result.lastScore).toBeCloseTo(0.2);
    expect(result.attempts).toBe(3);
  });

  it('lastScore is the ratio of the last attempt', () => {
    const attempts = [makeAttempt('add-1', 5, 5), makeAttempt('add-1', 1, 5)];
    const result = foldStage('add-1', attempts);
    expect(result.lastScore).toBeCloseTo(0.2);
    expect(result.bestScore).toBe(1);
  });

  it('filters by stageId (other stage attempts ignored)', () => {
    const attempts = [makeAttempt('add-2', 5, 5), makeAttempt('add-1', 2, 5)];
    const result = foldStage('add-1', attempts);
    expect(result.attempts).toBe(1);
    expect(result.bestScore).toBeCloseTo(0.4);
  });

  it('quizTotal = 0 gives ratio 0 and not mastered', () => {
    const attempts = [makeAttempt('add-1', 0, 0)];
    const result = foldStage('add-1', attempts);
    expect(result.bestScore).toBe(0);
    expect(result.mastered).toBe(false);
  });
});

describe('foldAll', () => {
  it('returns a record keyed by all stage ids', () => {
    const stageIds = ['add-1', 'add-2', 'sub-1'];
    const result = foldAll(stageIds, []);
    expect(Object.keys(result)).toEqual(stageIds);
  });

  it('returns zero progress for stages with no attempts', () => {
    const result = foldAll(['add-1'], []);
    expect(result['add-1'].attempts).toBe(0);
    expect(result['add-1'].mastered).toBe(false);
  });

  it('aggregates attempts per stage correctly', () => {
    const attempts = [makeAttempt('add-1', 3, 3), makeAttempt('add-2', 2, 5)];
    const result = foldAll(['add-1', 'add-2'], attempts);
    expect(result['add-1'].mastered).toBe(true);
    expect(result['add-2'].mastered).toBe(false);
  });
});
