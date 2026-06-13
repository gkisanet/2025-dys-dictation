import { describe, it, expect } from 'vitest';
import { buildSubtraction } from './buildSubtraction';

describe('buildSubtraction(52 - 28) — with borrow in ones', () => {
  const steps = buildSubtraction({ operation: 'sub', operands: [52, 28] });

  it('step ids are correct', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'borrow-0', 'ask-0', 'write-0', 'ask-1', 'write-1', 'result',
    ]);
  });

  it('ask-0 quiz: 12 - 8 = 4', () => {
    const ask0 = steps.find(s => s.id === 'ask-0')!;
    expect(ask0.quiz?.prompt).toBe('12 - 8 = ?');
    expect(ask0.quiz?.answer).toBe(4);
  });

  it('borrow mark bk-1 value is "4" (5 becomes 4 after lending)', () => {
    const borrow0 = steps.find(s => s.id === 'borrow-0')!;
    const bk1 = borrow0.board.cells.find(c => c.id === 'bk-1');
    expect(bk1).toBeDefined();
    expect(bk1!.value).toBe('4');
    expect(bk1!.visible).toBe(true);
  });

  it('ask-1 quiz: 4 - 2 = 2', () => {
    const ask1 = steps.find(s => s.id === 'ask-1')!;
    expect(ask1.quiz?.prompt).toBe('4 - 2 = ?');
    expect(ask1.quiz?.answer).toBe(2);
  });

  it('result narration contains "24"', () => {
    const result = steps.find(s => s.id === 'result')!;
    expect(result.narration).toContain('24');
  });
});

describe('buildSubtraction(20 - 19) — leading zero trimmed', () => {
  const steps = buildSubtraction({ operation: 'sub', operands: [20, 19] });

  it('result step shows only "1" (no r-1 cell visible)', () => {
    const result = steps.find(s => s.id === 'result')!;
    const r1 = result.board.cells.find(c => c.id === 'r-1');
    // Either r-1 does not exist or it is not visible
    expect(!r1 || !r1.visible).toBe(true);
  });

  it('r-0 is visible with value "1"', () => {
    const result = steps.find(s => s.id === 'result')!;
    const r0 = result.board.cells.find(c => c.id === 'r-0' && c.visible);
    expect(r0).toBeDefined();
    expect(r0!.value).toBe('1');
  });
});

describe('buildSubtraction(52 - 28) — result digits both shown (no trim of 2)', () => {
  it('result step shows both "4" at place 0 and "2" at place 1', () => {
    const steps = buildSubtraction({ operation: 'sub', operands: [52, 28] });
    const result = steps.find(s => s.id === 'result')!;
    const visibleResults = result.board.cells.filter(c => c.role === 'result' && c.visible);
    const values = visibleResults.map(c => c.value).sort();
    expect(values).toContain('4');
    expect(values).toContain('2');
  });
});

describe('buildSubtraction(48 - 13) — no borrow', () => {
  const steps = buildSubtraction({ operation: 'sub', operands: [48, 13] });

  it('no borrow steps', () => {
    expect(steps.map(s => s.id)).not.toContain('borrow-0');
    expect(steps.map(s => s.id)).not.toContain('borrow-1');
  });

  it('step ids: setup, ask-0, write-0, ask-1, write-1, result', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'ask-0', 'write-0', 'ask-1', 'write-1', 'result',
    ]);
  });

  it('ask-0 quiz: 8 - 3 = 5', () => {
    const ask0 = steps.find(s => s.id === 'ask-0')!;
    expect(ask0.quiz?.prompt).toBe('8 - 3 = ?');
    expect(ask0.quiz?.answer).toBe(5);
  });
});
