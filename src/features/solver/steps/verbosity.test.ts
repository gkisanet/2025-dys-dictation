import { describe, it, expect } from 'vitest';
import { applyVerbosityFor } from './verbosity';
import { buildAddition } from './buildAddition';
import { buildSubtraction } from './buildSubtraction';
import { buildMultiplication } from './buildMultiplication';
import type { Problem } from './types';

const addProblem: Problem = { operation: 'add', operands: [18, 24] };
const mulProblem: Problem = { operation: 'mul', operands: [18, 24] };

describe('applyVerbosityFor — full', () => {
  it('returns the same array reference for full verbosity', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'full', addProblem);
    expect(result).toBe(full);
  });
});

describe('applyVerbosityFor — partial', () => {
  it('keeps exactly one quiz (the first one that had a quiz)', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'partial', addProblem);
    const quizSteps = result.filter((s) => s.quiz !== undefined);
    expect(quizSteps.length).toBe(1);
  });

  it('the kept quiz is the first quiz from the full set', () => {
    const full = buildAddition(addProblem);
    const firstQuizInFull = full.find((s) => s.quiz !== undefined)!;
    const result = applyVerbosityFor(full, 'partial', addProblem);
    const keptQuiz = result.find((s) => s.quiz !== undefined)!;
    expect(keptQuiz.id).toBe(firstQuizInFull.id);
    expect(keptQuiz.quiz).toEqual(firstQuizInFull.quiz);
  });

  it('step count stays the same as full (steps still present, just quiz removed)', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'partial', addProblem);
    expect(result.length).toBe(full.length);
  });

  it('works for multiplication: partial keeps exactly one quiz', () => {
    const full = buildMultiplication(mulProblem);
    const result = applyVerbosityFor(full, 'partial', mulProblem);
    const quizSteps = result.filter((s) => s.quiz !== undefined);
    expect(quizSteps.length).toBe(1);
  });
});

describe('applyVerbosityFor — answer', () => {
  it('produces exactly 3 steps', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'answer', addProblem);
    expect(result.length).toBe(3);
  });

  it('first step has id "setup" and no quiz', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'answer', addProblem);
    expect(result[0].id).toBe('setup');
    expect(result[0].quiz).toBeUndefined();
  });

  it('second step has id "final-ask" and the correct quiz', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'answer', addProblem);
    expect(result[1].id).toBe('final-ask');
    expect(result[1].quiz).toBeDefined();
    expect(result[1].quiz!.prompt).toBe('18 + 24 = ?');
    expect(result[1].quiz!.answer).toBe(42);
  });

  it('third step is the original result step', () => {
    const full = buildAddition(addProblem);
    const result = applyVerbosityFor(full, 'answer', addProblem);
    const lastFull = full[full.length - 1];
    expect(result[2].id).toBe(lastFull.id);
  });

  it('answer mode for subtraction: prompt uses − sign, correct answer', () => {
    const subProblem: Problem = { operation: 'sub', operands: [42, 18] };
    const full = buildSubtraction(subProblem);
    const result = applyVerbosityFor(full, 'answer', subProblem);
    expect(result[1].quiz!.prompt).toBe('42 − 18 = ?');
    expect(result[1].quiz!.answer).toBe(24);
  });

  it('answer mode for multiplication: prompt uses × sign, correct answer', () => {
    const full = buildMultiplication(mulProblem);
    const result = applyVerbosityFor(full, 'answer', mulProblem);
    expect(result[1].quiz!.prompt).toBe('18 × 24 = ?');
    expect(result[1].quiz!.answer).toBe(432);
  });
});
