import { describe, it, expect } from 'vitest';
import { buildMultiplication } from './buildMultiplication';

describe('buildMultiplication(18 × 24)', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [18, 24] });

  it('step ids are exactly correct', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'decompose', 'left-ask', 'left-write',
      'right-zero', 'right-ask', 'right-write',
      'gather', 'sum-ask', 'result',
    ]);
  });

  it('decompose quiz: 24 = 20 + 4', () => {
    const decompose = steps.find(s => s.id === 'decompose')!;
    expect(decompose.quiz?.prompt).toBe('24 = 20 + ?');
    expect(decompose.quiz?.answer).toBe(4);
  });

  it('left-ask quiz answer = 72', () => {
    const leftAsk = steps.find(s => s.id === 'left-ask')!;
    expect(leftAsk.quiz?.answer).toBe(72);
  });

  it('right-ask quiz answer = 36', () => {
    const rightAsk = steps.find(s => s.id === 'right-ask')!;
    expect(rightAsk.quiz?.answer).toBe(36);
  });

  it('sum-ask quiz answer = 432', () => {
    const sumAsk = steps.find(s => s.id === 'sum-ask')!;
    expect(sumAsk.quiz?.answer).toBe(432);
  });

  it('after left-write: left region shows P1 result digits 7 and 2 (ones-first: place 0=2, place 1=7)', () => {
    const leftWrite = steps.find(s => s.id === 'left-write')!;
    const resultCells = leftWrite.board.cells.filter(c => c.region === 'left' && c.role === 'result');
    const values = resultCells.filter(c => c.visible).map(c => c.value).sort();
    expect(values).toEqual(['2', '7']);
  });

  it('after left-write: left region has a carry cell with value "3"', () => {
    const leftWrite = steps.find(s => s.id === 'left-write')!;
    const carry = leftWrite.board.cells.find(c => c.region === 'left' && c.role === 'carry' && c.visible);
    expect(carry).toBeDefined();
    expect(carry!.value).toBe('3');
  });

  it('right-zero makes the zero-placeholder ones cell visible with highlight "zero" and value "0"', () => {
    const rightZero = steps.find(s => s.id === 'right-zero')!;
    const zeroCell = rightZero.board.cells.find(c => c.role === 'zero-placeholder' && c.visible);
    expect(zeroCell).toBeDefined();
    expect(zeroCell!.value).toBe('0');
    expect(zeroCell!.highlight).toBe('zero');
  });

  it('at gather: left/right result cells are NOT visible and merge addend cells ARE visible with correct layoutIds', () => {
    const gather = steps.find(s => s.id === 'gather')!;
    const { cells } = gather.board;

    // Branch result cells must be invisible
    const branchResults = cells.filter(c =>
      (c.region === 'left' || c.region === 'right') && c.role === 'result'
    );
    expect(branchResults.every(c => !c.visible)).toBe(true);

    // Merge addend cells must be visible
    const mergeAddends = cells.filter(c => c.region === 'merge' && c.role === 'partial' && c.visible);
    expect(mergeAddends.length).toBeGreaterThan(0);

    // layoutIds: p1-0, p1-1 for P1 addends; p2-0, p2-1, p2-2 for P2 addends
    const mergeLayoutIds = mergeAddends.map(c => c.layoutId).filter(Boolean);
    expect(mergeLayoutIds).toContain('p1-0');
    expect(mergeLayoutIds).toContain('p1-1');
    expect(mergeLayoutIds).toContain('p2-0');
    expect(mergeLayoutIds).toContain('p2-1');
    expect(mergeLayoutIds).toContain('p2-2');
  });

  it('result reveals merge final digits that concatenate to 432', () => {
    const result = steps.find(s => s.id === 'result')!;
    const finalDigits = result.board.cells
      .filter(c => c.region === 'merge' && c.role === 'result' && c.visible)
      .sort((a, b) => b.place - a.place) // highest place first
      .map(c => c.value)
      .join('');
    expect(finalDigits).toBe('432');
  });
});

describe('buildMultiplication — branch/merge layoutId invariant', () => {
  it.each([[18, 24], [13, 12], [25, 40]] as const)('branch and merge layoutIds match for %i x %i', (a, b) => {
    const steps = buildMultiplication({ operation: 'mul', operands: [a, b] });
    const last = steps[steps.length - 1];
    const ids = (pred: (r: string) => boolean) => new Set(last.board.cells.filter(c => c.layoutId && pred(c.region)).map(c => c.layoutId));
    const branch = ids(r => r === 'left' || r === 'right');
    const merge = ids(r => r === 'merge');
    expect([...branch].sort()).toEqual([...merge].sort());
  });
});

describe('buildMultiplication(13 × 12) — lighter correctness check', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [13, 12] });

  it('sum-ask answer = 156', () => {
    const sumAsk = steps.find(s => s.id === 'sum-ask')!;
    expect(sumAsk.quiz?.answer).toBe(156);
  });

  it('left-ask answer = P1 = 26 (13 × 2)', () => {
    const leftAsk = steps.find(s => s.id === 'left-ask')!;
    expect(leftAsk.quiz?.answer).toBe(26);
  });

  it('right-ask answer = P2 tens part = 13 (13 × 1)', () => {
    const rightAsk = steps.find(s => s.id === 'right-ask')!;
    expect(rightAsk.quiz?.answer).toBe(13);
  });
});

describe('buildMultiplication(18 × 20) — single-branch place-zero path', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [18, 20] });

  it('step ids are exactly the single-branch set', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'place-zero', 'ask', 'write', 'result',
    ]);
  });

  it('ask quiz answer = 36 (18 × 2)', () => {
    const ask = steps.find(s => s.id === 'ask')!;
    expect(ask.quiz?.answer).toBe(36);
  });

  it('result digits concatenate to 360', () => {
    const result = steps.find(s => s.id === 'result')!;
    const digits = result.board.cells
      .filter(c => c.visible && (c.role === 'result' || c.role === 'zero-placeholder'))
      .sort((a, b) => b.place - a.place)
      .map(c => c.value)
      .join('');
    expect(digits).toBe('360');
  });

  it('the ones result cell has role "zero-placeholder" and highlight "zero" in place-zero step', () => {
    const placeZeroStep = steps.find(s => s.id === 'place-zero')!;
    const zeroCell = placeZeroStep.board.cells.find(c => c.role === 'zero-placeholder' && c.visible);
    expect(zeroCell).toBeDefined();
    expect(zeroCell!.value).toBe('0');
    expect(zeroCell!.highlight).toBe('zero');
  });

  it('there is exactly one zero-placeholder cell in the entire board', () => {
    const result = steps.find(s => s.id === 'result')!;
    const zeroPlaceholders = result.board.cells.filter(c => c.role === 'zero-placeholder');
    expect(zeroPlaceholders.length).toBe(1);
  });

  it('uses only main region (single-branch)', () => {
    const result = steps.find(s => s.id === 'result')!;
    const regions = new Set(result.board.cells.map(c => c.region));
    expect([...regions]).toEqual(['main']);
  });
});

describe('buildMultiplication — existing 18×24 tests still reach two-branch path', () => {
  it('18×24 still has the two-branch ids (onesB !== 0)', () => {
    const steps = buildMultiplication({ operation: 'mul', operands: [18, 24] });
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'decompose', 'left-ask', 'left-write',
      'right-zero', 'right-ask', 'right-write',
      'gather', 'sum-ask', 'result',
    ]);
  });
});
