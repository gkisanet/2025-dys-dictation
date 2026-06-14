import { describe, it, expect } from 'vitest';
import { buildMultiplication } from './buildMultiplication';

// ── Mode 1: 2-digit × 1-digit ────────────────────────────────────────────────

describe('buildMultiplication(47 × 3) — 2x1 digit-by-digit', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [47, 3] });

  it('step ids are exactly correct', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'ones-ask', 'ones-write', 'tens-ask', 'tens-write', 'result',
    ]);
  });

  it('ones-ask: prompt "7 × 3 = ?" answer 21', () => {
    const s = steps.find(s => s.id === 'ones-ask')!;
    expect(s.quiz?.prompt).toBe('7 × 3 = ?');
    expect(s.quiz?.answer).toBe(21);
  });

  it('ones-ask does NOT reveal the ones result cell', () => {
    const s = steps.find(s => s.id === 'ones-ask')!;
    const resultCell = s.board.cells.find(c => c.role === 'result' && c.place === 0);
    expect(resultCell?.visible).toBe(false);
  });

  it('ones-write reveals ones digit "1" at place 0', () => {
    const s = steps.find(s => s.id === 'ones-write')!;
    const cell = s.board.cells.find(c => c.id === 'main-r-0' && c.visible);
    expect(cell).toBeDefined();
    expect(cell!.value).toBe('1');
  });

  it('ones-write reveals carry "2" above tens column', () => {
    const s = steps.find(s => s.id === 'ones-write')!;
    const carry = s.board.cells.find(c => c.role === 'carry' && c.visible);
    expect(carry).toBeDefined();
    expect(carry!.value).toBe('2');
  });

  it('tens-ask: prompt "4 × 3 + 2 = ?" answer 14', () => {
    const s = steps.find(s => s.id === 'tens-ask')!;
    expect(s.quiz?.prompt).toBe('4 × 3 + 2 = ?');
    expect(s.quiz?.answer).toBe(14);
  });

  it('tens-ask does NOT reveal the tens result cell', () => {
    const s = steps.find(s => s.id === 'tens-ask')!;
    const cell = s.board.cells.find(c => c.id === 'main-r-1');
    expect(cell?.visible).toBe(false);
  });

  it('result reveals digits that concatenate to "141"', () => {
    const s = steps.find(s => s.id === 'result')!;
    const digits = s.board.cells
      .filter(c => (c.role === 'result') && c.visible)
      .sort((a, b) => b.place - a.place)
      .map(c => c.value)
      .join('');
    expect(digits).toBe('141');
  });

  it('uses only main region', () => {
    const s = steps[steps.length - 1];
    const regions = new Set(s.board.cells.map(c => c.region));
    expect([...regions]).toEqual(['main']);
  });
});

// ── Mode 2: mul-byten (2-digit × multiple of 10) ─────────────────────────────

describe('buildMultiplication(47 × 30) — byten digit-by-digit', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [47, 30] });

  it('step ids are exactly correct', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'place-zero', 'ones-ask', 'ones-write', 'tens-ask', 'tens-write', 'result',
    ]);
  });

  it('place-zero reveals the zero-placeholder with highlight "zero"', () => {
    const s = steps.find(s => s.id === 'place-zero')!;
    const zc = s.board.cells.find(c => c.role === 'zero-placeholder' && c.visible);
    expect(zc).toBeDefined();
    expect(zc!.value).toBe('0');
    expect(zc!.highlight).toBe('zero');
  });

  it('ones-ask: prompt "7 × 3 = ?" answer 21', () => {
    const s = steps.find(s => s.id === 'ones-ask')!;
    expect(s.quiz?.prompt).toBe('7 × 3 = ?');
    expect(s.quiz?.answer).toBe(21);
  });

  it('ones-ask does NOT reveal the result digit at place 1', () => {
    const s = steps.find(s => s.id === 'ones-ask')!;
    const cell = s.board.cells.find(c => c.id === 'main-r-1');
    expect(cell?.visible).toBe(false);
  });

  it('tens-ask: prompt "4 × 3 + 2 = ?" answer 14', () => {
    const s = steps.find(s => s.id === 'tens-ask')!;
    expect(s.quiz?.prompt).toBe('4 × 3 + 2 = ?');
    expect(s.quiz?.answer).toBe(14);
  });

  it('result digits (incl zero-placeholder) concatenate to "1410"', () => {
    const s = steps.find(s => s.id === 'result')!;
    const digits = s.board.cells
      .filter(c => (c.role === 'result' || c.role === 'zero-placeholder') && c.visible)
      .sort((a, b) => b.place - a.place)
      .map(c => c.value)
      .join('');
    expect(digits).toBe('1410');
  });

  it('uses only main region', () => {
    const s = steps[steps.length - 1];
    const regions = new Set(s.board.cells.map(c => c.region));
    expect([...regions]).toEqual(['main']);
  });

  it('there is exactly one zero-placeholder cell', () => {
    const s = steps[steps.length - 1];
    expect(s.board.cells.filter(c => c.role === 'zero-placeholder')).toHaveLength(1);
  });
});

// ── Mode 3: 2-digit × 2-digit ────────────────────────────────────────────────

describe('buildMultiplication(92 × 16) — 2x2 digit-by-digit', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [92, 16] });

  it('step ids are exactly correct', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup',
      'decompose',
      'branches',
      'left-ones-ask', 'left-ones-write',
      'left-tens-ask', 'left-tens-write',
      'right-zero',
      'right-ones-ask', 'right-ones-write',
      'right-tens-ask', 'right-tens-write',
      'gather',
      'sum-ask',
      'result',
    ]);
  });

  it('decompose quiz: 16 = 10 + ?  answer 6', () => {
    const s = steps.find(s => s.id === 'decompose')!;
    expect(s.quiz?.prompt).toBe('16 = 10 + ?');
    expect(s.quiz?.answer).toBe(6);
  });

  it('branches: both left-a-0 and right-a-0 are visible simultaneously', () => {
    const s = steps.find(s => s.id === 'branches')!;
    const { cells } = s.board;
    expect(cells.find(c => c.id === 'left-a-0')?.visible).toBe(true);
    expect(cells.find(c => c.id === 'right-a-0')?.visible).toBe(true);
    expect(cells.find(c => c.id === 'left-op')?.visible).toBe(true);
    expect(cells.find(c => c.id === 'left-b')?.visible).toBe(true);
    expect(cells.find(c => c.id === 'right-op')?.visible).toBe(true);
    expect(cells.find(c => c.id === 'right-b')?.visible).toBe(true);
    expect(cells.find(c => c.id === 'right-b-zero')?.visible).toBe(true);
  });

  it('branches: right-r-0 (zero-placeholder) is NOT yet visible', () => {
    const s = steps.find(s => s.id === 'branches')!;
    expect(s.board.cells.find(c => c.id === 'right-r-0')?.visible).toBe(false);
  });

  it('left-ones-ask: "2 × 6 = ?" → 12', () => {
    const s = steps.find(s => s.id === 'left-ones-ask')!;
    expect(s.quiz?.prompt).toBe('2 × 6 = ?');
    expect(s.quiz?.answer).toBe(12);
  });

  it('left-ones-ask does NOT reveal left-r-0', () => {
    const s = steps.find(s => s.id === 'left-ones-ask')!;
    expect(s.board.cells.find(c => c.id === 'left-r-0')?.visible).toBe(false);
  });

  it('left-ones-write reveals "2" at place 0 and carry "1"', () => {
    const s = steps.find(s => s.id === 'left-ones-write')!;
    const r0 = s.board.cells.find(c => c.id === 'left-r-0');
    expect(r0?.visible).toBe(true);
    expect(r0?.value).toBe('2');
    const carry = s.board.cells.find(c => c.region === 'left' && c.role === 'carry' && c.visible);
    expect(carry?.value).toBe('1');
  });

  it('left-tens-ask: "9 × 6 + 1 = ?" → 55', () => {
    const s = steps.find(s => s.id === 'left-tens-ask')!;
    expect(s.quiz?.prompt).toBe('9 × 6 + 1 = ?');
    expect(s.quiz?.answer).toBe(55);
  });

  it('left-tens-ask does NOT reveal left-r-1', () => {
    const s = steps.find(s => s.id === 'left-tens-ask')!;
    expect(s.board.cells.find(c => c.id === 'left-r-1')?.visible).toBe(false);
  });

  it('right-zero: zero-placeholder visible with highlight "zero"', () => {
    const s = steps.find(s => s.id === 'right-zero')!;
    const zc = s.board.cells.find(c => c.role === 'zero-placeholder' && c.visible);
    expect(zc).toBeDefined();
    expect(zc!.value).toBe('0');
    expect(zc!.highlight).toBe('zero');
  });

  it('right-ones-ask: "2 × 1 = ?" → 2', () => {
    const s = steps.find(s => s.id === 'right-ones-ask')!;
    expect(s.quiz?.prompt).toBe('2 × 1 = ?');
    expect(s.quiz?.answer).toBe(2);
  });

  it('right-ones-ask does NOT reveal right-r-1', () => {
    const s = steps.find(s => s.id === 'right-ones-ask')!;
    expect(s.board.cells.find(c => c.id === 'right-r-1')?.visible).toBe(false);
  });

  it('right-tens-ask: "9 × 1 = ?" → 9', () => {
    const s = steps.find(s => s.id === 'right-tens-ask')!;
    expect(s.quiz?.prompt).toBe('9 × 1 = ?');
    expect(s.quiz?.answer).toBe(9);
  });

  it('sum-ask: "552 + 920 = ?" → 1472', () => {
    const s = steps.find(s => s.id === 'sum-ask')!;
    expect(s.quiz?.prompt).toBe('552 + 920 = ?');
    expect(s.quiz?.answer).toBe(1472);
  });

  it('at gather: left/right result cells STAY visible and merge addend cells are also visible', () => {
    const s = steps.find(s => s.id === 'gather')!;
    const { cells } = s.board;
    const branchResults = cells.filter(c =>
      (c.region === 'left' || c.region === 'right') && (c.role === 'result' || c.role === 'zero-placeholder')
    );
    expect(branchResults.every(c => c.visible)).toBe(true);
    const mergeAddends = cells.filter(c => c.region === 'merge' && c.role === 'partial' && c.visible);
    expect(mergeAddends.length).toBeGreaterThan(0);
  });

  it('branch result cells have NO layoutId; merge addend-1 cells have enterFrom left, addend-2 have enterFrom right', () => {
    const s = steps.find(s => s.id === 'result')!;
    const { cells } = s.board;
    const branchResults = cells.filter(c => (c.region === 'left' || c.region === 'right') && (c.role === 'result' || c.role === 'zero-placeholder'));
    expect(branchResults.every(c => !c.layoutId)).toBe(true);
    const mergeA = cells.filter(c => c.region === 'merge' && c.role === 'partial' && c.id.startsWith('merge-a-'));
    expect(mergeA.every(c => c.enterFrom === 'left')).toBe(true);
    const mergeB = cells.filter(c => c.region === 'merge' && c.role === 'partial' && c.id.startsWith('merge-b-'));
    expect(mergeB.every(c => c.enterFrom === 'right')).toBe(true);
  });

  it('carry anchors: both left and right regions always include row 0 in their cell set', () => {
    const s = steps.find(s => s.id === 'setup')!;
    const { cells } = s.board;
    const leftRow0 = cells.filter(c => c.region === 'left' && c.row === 0);
    const rightRow0 = cells.filter(c => c.region === 'right' && c.row === 0);
    expect(leftRow0.length).toBeGreaterThan(0);
    expect(rightRow0.length).toBeGreaterThan(0);
  });

  it('right operator row shows × tensB and 0 digit (× 16 right branch shows × 10)', () => {
    const s = steps.find(s => s.id === 'right-zero')!;
    const { cells } = s.board;
    const rightOpRow = cells.filter(c => c.region === 'right' && c.row === 2 && c.visible);
    const values = rightOpRow.map(c => c.value);
    expect(values).toContain('×');
    expect(values).toContain('1');  // tensB digit
    expect(values).toContain('0');  // the appended zero
  });

  it('result reveals merge final digits that concatenate to "1472"', () => {
    const s = steps.find(s => s.id === 'result')!;
    const digits = s.board.cells
      .filter(c => c.region === 'merge' && c.role === 'result' && c.visible)
      .sort((a, b) => b.place - a.place)
      .map(c => c.value)
      .join('');
    expect(digits).toBe('1472');
  });
});

// ── Mode 3: 78 × 24 (carries in both branches) ───────────────────────────────

describe('buildMultiplication(78 × 24) — 2x2 with carries', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [78, 24] });

  it('step ids are exactly correct', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup',
      'decompose',
      'branches',
      'left-ones-ask', 'left-ones-write',
      'left-tens-ask', 'left-tens-write',
      'right-zero',
      'right-ones-ask', 'right-ones-write',
      'right-tens-ask', 'right-tens-write',
      'gather',
      'sum-ask',
      'result',
    ]);
  });

  it('left-ones-ask: "8 × 4 = ?" → 32', () => {
    const s = steps.find(s => s.id === 'left-ones-ask')!;
    expect(s.quiz?.prompt).toBe('8 × 4 = ?');
    expect(s.quiz?.answer).toBe(32);
  });

  it('left-tens-ask: "7 × 4 + 3 = ?" → 31', () => {
    const s = steps.find(s => s.id === 'left-tens-ask')!;
    expect(s.quiz?.prompt).toBe('7 × 4 + 3 = ?');
    expect(s.quiz?.answer).toBe(31);
  });

  it('right-ones-ask: "8 × 2 = ?" → 16', () => {
    const s = steps.find(s => s.id === 'right-ones-ask')!;
    expect(s.quiz?.prompt).toBe('8 × 2 = ?');
    expect(s.quiz?.answer).toBe(16);
  });

  it('right-tens-ask: "7 × 2 + 1 = ?" → 15', () => {
    const s = steps.find(s => s.id === 'right-tens-ask')!;
    expect(s.quiz?.prompt).toBe('7 × 2 + 1 = ?');
    expect(s.quiz?.answer).toBe(15);
  });

  it('sum-ask: "312 + 1560 = ?" → 1872', () => {
    const s = steps.find(s => s.id === 'sum-ask')!;
    expect(s.quiz?.prompt).toBe('312 + 1560 = ?');
    expect(s.quiz?.answer).toBe(1872);
  });

  it('result reveals merge final digits that concatenate to "1872"', () => {
    const s = steps.find(s => s.id === 'result')!;
    const digits = s.board.cells
      .filter(c => c.region === 'merge' && c.role === 'result' && c.visible)
      .sort((a, b) => b.place - a.place)
      .map(c => c.value)
      .join('');
    expect(digits).toBe('1872');
  });
});

// ── enterFrom invariant across cases ─────────────────────────────────────────

describe('buildMultiplication — enterFrom and carry-anchor invariants', () => {
  it.each([[18, 24], [13, 12], [92, 16], [78, 24]] as const)('merge addends have correct enterFrom for %i × %i', (a, b) => {
    const steps = buildMultiplication({ operation: 'mul', operands: [a, b] });
    const last = steps[steps.length - 1];
    const mergeA = last.board.cells.filter(c => c.region === 'merge' && c.id.startsWith('merge-a-') && c.role === 'partial');
    const mergeB = last.board.cells.filter(c => c.region === 'merge' && c.id.startsWith('merge-b-') && c.role === 'partial');
    expect(mergeA.every(c => c.enterFrom === 'left')).toBe(true);
    expect(mergeB.every(c => c.enterFrom === 'right')).toBe(true);
  });

  it.each([[18, 24], [13, 12], [92, 16], [78, 24]] as const)('left and right both have row 0 in cell set for %i × %i', (a, b) => {
    const steps = buildMultiplication({ operation: 'mul', operands: [a, b] });
    const setup = steps[0];
    const leftRow0 = setup.board.cells.filter(c => c.region === 'left' && c.row === 0);
    const rightRow0 = setup.board.cells.filter(c => c.region === 'right' && c.row === 0);
    expect(leftRow0.length).toBeGreaterThan(0);
    expect(rightRow0.length).toBeGreaterThan(0);
  });
});

// ── Keep byten path working ───────────────────────────────────────────────────

describe('buildMultiplication(18 × 20) — single-branch place-zero path', () => {
  const steps = buildMultiplication({ operation: 'mul', operands: [18, 20] });

  it('step ids are the byten set', () => {
    expect(steps.map(s => s.id)).toEqual([
      'setup', 'place-zero', 'ones-ask', 'ones-write', 'tens-ask', 'tens-write', 'result',
    ]);
  });

  it('ones-ask: "8 × 2 = ?" → 16', () => {
    const s = steps.find(s => s.id === 'ones-ask')!;
    expect(s.quiz?.prompt).toBe('8 × 2 = ?');
    expect(s.quiz?.answer).toBe(16);
  });

  it('tens-ask: "1 × 2 + 1 = ?" → 3', () => {
    const s = steps.find(s => s.id === 'tens-ask')!;
    expect(s.quiz?.prompt).toBe('1 × 2 + 1 = ?');
    expect(s.quiz?.answer).toBe(3);
  });

  it('result digits (incl zero-placeholder) concatenate to "360"', () => {
    const s = steps.find(s => s.id === 'result')!;
    const digits = s.board.cells
      .filter(c => (c.role === 'result' || c.role === 'zero-placeholder') && c.visible)
      .sort((a, b) => b.place - a.place)
      .map(c => c.value)
      .join('');
    expect(digits).toBe('360');
  });

  it('the ones result cell has role "zero-placeholder" with highlight "zero" in place-zero step', () => {
    const s = steps.find(s => s.id === 'place-zero')!;
    const zc = s.board.cells.find(c => c.role === 'zero-placeholder' && c.visible);
    expect(zc).toBeDefined();
    expect(zc!.value).toBe('0');
    expect(zc!.highlight).toBe('zero');
  });

  it('there is exactly one zero-placeholder cell', () => {
    const last = steps[steps.length - 1];
    expect(last.board.cells.filter(c => c.role === 'zero-placeholder')).toHaveLength(1);
  });

  it('uses only main region', () => {
    const last = steps[steps.length - 1];
    const regions = new Set(last.board.cells.map(c => c.region));
    expect([...regions]).toEqual(['main']);
  });
});
