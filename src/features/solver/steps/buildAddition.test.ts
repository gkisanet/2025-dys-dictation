import { describe, it, expect } from 'vitest';
import { buildAddition } from './buildAddition';
import type { Step } from './types';

const visibleIds = (s: Step) => s.board.cells.filter((c) => c.visible).map((c) => c.id).sort();

describe('buildAddition(18 + 24)', () => {
  const steps = buildAddition({ operation: 'add', operands: [18, 24] });

  it('produces setup, ask/write per column, and a result step', () => {
    expect(steps.map((s) => s.id)).toEqual([
      'setup', 'ask-0', 'write-0', 'ask-1', 'write-1', 'result',
    ]);
    expect(steps.map((s) => s.kind)).toEqual([
      'setup', 'digit-op', 'sum', 'digit-op', 'sum', 'result',
    ]);
  });

  it('setup shows both operands and operator, no result/carry yet', () => {
    expect(visibleIds(steps[0])).toEqual(['a-0', 'a-1', 'b-0', 'b-1', 'op']);
  });

  it('ones ask quizzes 8 + 4 = 12 and does NOT yet show the result digit', () => {
    expect(steps[1].quiz).toEqual({
      prompt: '8 + 4 = ?',
      answer: 12,
      hints: expect.arrayContaining([expect.any(String)]),
    });
    expect(visibleIds(steps[1])).toEqual(['a-0', 'a-1', 'b-0', 'b-1', 'op']);
    expect(steps[1].board.cells.find((c) => c.id === 'a-0')?.highlight).toBe('now');
  });

  it('ones write reveals result 2 and carry 1', () => {
    expect(visibleIds(steps[2])).toEqual(['a-0', 'a-1', 'b-0', 'b-1', 'c-1', 'op', 'r-0']);
    expect(steps[2].board.cells.find((c) => c.id === 'c-1')).toMatchObject({
      value: '1', superscript: true,
    });
    expect(steps[2].board.cells.find((c) => c.id === 'r-0')?.value).toBe('2');
  });

  it('tens ask quizzes 1 + 2 + 1 = 4 (includes the carry)', () => {
    expect(steps[3].quiz).toMatchObject({ prompt: '1 + 2 + 1 = ?', answer: 4 });
  });

  it('result step shows the full sum 42', () => {
    expect(steps[5].narration).toContain('42');
    expect(visibleIds(steps[5])).toEqual(
      ['a-0', 'a-1', 'b-0', 'b-1', 'c-1', 'op', 'r-0', 'r-1'],
    );
  });
});

describe('buildAddition(7 + 5) — final carry becomes a new leading digit', () => {
  const steps = buildAddition({ operation: 'add', operands: [7, 5] });

  it('quizzes 7 + 5 = 12 and the write step reveals digit 2 and leading 1', () => {
    expect(steps[1].quiz).toMatchObject({ prompt: '7 + 5 = ?', answer: 12 });
    expect(visibleIds(steps[2])).toEqual(['a-0', 'b-0', 'op', 'r-0', 'r-1']);
    expect(steps[2].board.cells.find((c) => c.id === 'r-1')?.value).toBe('1');
    expect(steps[2].board.cells.find((c) => c.id === 'r-1')?.role).toBe('result');
  });
});
