import type { BoardState, Cell, Highlight, Problem, Step } from './types';
import { onesFirst, multiplyByDigit } from './mathColumns';

// ── Mode 1: 2-digit × 1-digit ────────────────────────────────────────────────

function buildMul2x1(problem: Problem): Step[] {
  const [a, b] = problem.operands;
  const aD = onesFirst(a);
  const p = multiplyByDigit(a, b);
  const final = a * b;

  const cells: Cell[] = [];

  // Row 1: a operand
  aD.forEach((d, pl) =>
    cells.push({ id: `main-a-${pl}`, region: 'main', row: 1, place: pl, value: String(d), role: 'operand', visible: false })
  );
  // Row 2: × b (operator + b digit)
  cells.push({ id: 'main-op', region: 'main', row: 2, place: aD.length, value: '×', role: 'operator', visible: false });
  cells.push({ id: 'main-b', region: 'main', row: 2, place: 0, value: String(b), role: 'operand', visible: false });

  // Row 0: carry marks (skip col 0 — always 0)
  for (let i = 1; i < aD.length; i++) {
    if (p.carryInto[i] > 0) {
      cells.push({ id: `main-c-${i}`, region: 'main', row: 0, place: i, value: String(p.carryInto[i]), role: 'carry', superscript: true, visible: false });
    }
  }

  // Row 3: result digits (ones-first). If leading carry, add one extra digit.
  const resultDigits = p.resultDigit; // ones-first
  resultDigits.forEach((d, pl) =>
    cells.push({ id: `main-r-${pl}`, region: 'main', row: 3, place: pl, value: String(d), role: 'result', visible: false })
  );

  const dividers = [{ region: 'main' as const, row: 2 }];

  const boardFrom = (shown: Set<string>, hi: Record<string, NonNullable<Highlight>> = {}): BoardState => ({
    regions: ['main'],
    cells: cells.map((c) => ({ ...c, visible: shown.has(c.id), highlight: hi[c.id] ?? null })),
    dividers,
  });

  const steps: Step[] = [];
  const shown = new Set<string>();

  // 1. setup: reveal a and × b
  aD.forEach((_, pl) => shown.add(`main-a-${pl}`));
  shown.add('main-op');
  shown.add('main-b');
  steps.push({
    id: 'setup',
    kind: 'setup',
    narration: `${a} × ${b}를 세로로 써요.`,
    board: boardFrom(shown),
  });

  // 2–5. digit-by-digit ones then tens (inline loop)
  for (let i = 0; i < aD.length; i++) {
    const carryInto = p.carryInto[i] ?? 0;
    const colValue = aD[i] * b + carryInto;
    const resultDigit = colValue % 10;
    const carryOut = Math.floor(colValue / 10);

    const carryPromptPart = carryInto > 0 ? ` + ${carryInto}` : '';
    const prompt = `${aD[i]} × ${b}${carryPromptPart} = ?`;
    const aId = `main-a-${i}`;
    const bId = `main-b`;
    const askHi: Record<string, NonNullable<Highlight>> = { [aId]: 'now', [bId]: 'now' };
    if (carryInto > 0 && cells.some(c => c.id === `main-c-${i}`)) {
      askHi[`main-c-${i}`] = 'now';
    }

    steps.push({
      id: `${i === 0 ? 'ones' : 'tens'}-ask`,
      kind: 'digit-op',
      narration: `${aD[i]}의 자리: ${aD[i]} × ${b}${carryPromptPart} = ${colValue}.`,
      board: boardFrom(shown, askHi),
      quiz: {
        prompt,
        answer: colValue,
        hints: [
          `${aD[i]}에 ${b}를 곱해요${carryInto > 0 ? `, 올림 ${carryInto}도 더해요` : ''}.`,
          `${aD[i]} × ${b}${carryPromptPart} 를 계산해보세요.`,
        ],
      },
    });

    shown.add(`main-r-${i}`);
    if (carryOut > 0) {
      if (i + 1 < aD.length) {
        const nextCId = `main-c-${i + 1}`;
        if (cells.some(c => c.id === nextCId)) shown.add(nextCId);
      } else {
        shown.add(`main-r-${aD.length}`);
      }
    }

    steps.push({
      id: `${i === 0 ? 'ones' : 'tens'}-write`,
      kind: 'sum',
      narration: carryOut > 0 ? `${colValue} → ${resultDigit} 쓰고 ${carryOut} 올림.` : `${colValue} 를 씁니다.`,
      board: boardFrom(shown),
    });
  }

  // 6. result
  steps.push({
    id: 'result',
    kind: 'result',
    narration: `다 곱했어요! ${a} × ${b} = ${final}.`,
    board: boardFrom(shown),
  });

  return steps;
}

// ── Mode 2: 2-digit × multiple-of-10 ────────────────────────────────────────

function buildMultiplyByTen(problem: Problem): Step[] {
  const [a, b] = problem.operands;
  const tensB = b / 10;
  const aD = onesFirst(a);
  const bD = onesFirst(b); // e.g. [0, 2] for 20
  const p = multiplyByDigit(a, tensB);
  const final = a * b;

  const cells: Cell[] = [];

  // Row 1: a operand (place 0..aD.length-1)
  aD.forEach((d, pl) =>
    cells.push({ id: `main-a-${pl}`, region: 'main', row: 1, place: pl, value: String(d), role: 'operand', visible: false })
  );
  // Row 2: × b (operator + b digits)
  bD.forEach((d, pl) =>
    cells.push({ id: `main-b-${pl}`, region: 'main', row: 2, place: pl, value: String(d), role: 'operand', visible: false })
  );
  cells.push({ id: 'main-op', region: 'main', row: 2, place: aD.length, value: '×', role: 'operator', visible: false });

  // Row 0: carry marks above shifted columns (index 1..aD.length)
  // The digit-by-digit loop uses aD indices (0=ones col of a, 1=tens col of a),
  // but in the shifted layout the actual place is index+shift (shift=1).
  // We store carry cells keyed by the a-digit index (not the shifted place),
  // using id `main-c-${i}` for the cell above a-digit col i, placed at `place i+1`.
  for (let i = 1; i < aD.length; i++) {
    if (p.carryInto[i] > 0) {
      cells.push({ id: `main-c-${i}`, region: 'main', row: 0, place: i + 1, value: String(p.carryInto[i]), role: 'carry', superscript: true, visible: false });
    }
  }

  // Row 3: result digits (shifted by 1). Place 0 = zero-placeholder.
  cells.push({ id: 'main-r-0', region: 'main', row: 3, place: 0, value: '0', role: 'zero-placeholder', visible: false });
  // The a × tensB product digits occupy places 1..N
  const prodDigits = p.resultDigit; // ones-first
  prodDigits.forEach((d, i) =>
    cells.push({ id: `main-r-${i + 1}`, region: 'main', row: 3, place: i + 1, value: String(d), role: 'result', visible: false })
  );

  const dividers = [{ region: 'main' as const, row: 2 }];

  const boardFrom = (shown: Set<string>, hi: Record<string, NonNullable<Highlight>> = {}): BoardState => ({
    regions: ['main'],
    cells: cells.map((c) => ({ ...c, visible: shown.has(c.id), highlight: hi[c.id] ?? null })),
    dividers,
  });

  const steps: Step[] = [];
  const shown = new Set<string>();

  // 1. setup
  aD.forEach((_, pl) => shown.add(`main-a-${pl}`));
  bD.forEach((_, pl) => shown.add(`main-b-${pl}`));
  shown.add('main-op');
  steps.push({
    id: 'setup',
    kind: 'setup',
    narration: `${a} × ${b}를 세로로 써요.`,
    board: boardFrom(shown),
  });

  // 2. place-zero
  shown.add('main-r-0');
  steps.push({
    id: 'place-zero',
    kind: 'place-zero',
    narration: `${b}는 ×10이라 일의 자리에 0을 먼저 놓아요.`,
    board: boardFrom(shown, { 'main-r-0': 'zero' }),
  });

  // 3–6. digit-by-digit for a × tensB, SHIFTED by 1
  // We need a custom prefix helper here: the b-digit to highlight is `main-b-1` (tens digit of b),
  // and we use `main-b` convention... but in byten layout `main-b-1` is the tens digit of b.
  // appendDigitByDigitSteps uses `${prefix}-b` for the multiplier highlight.
  // In byten, there's no single `main-b` cell — instead the tens digit is `main-b-1`.
  // We handle this inline for byten since the convention differs.

  for (let i = 0; i < aD.length; i++) {
    const carryInto = p.carryInto[i] ?? 0;
    const colValue = aD[i] * tensB + carryInto;
    const resultDigit = colValue % 10;
    const carryOut = Math.floor(colValue / 10);
    const place = i + 1; // shifted

    const carryPromptPart = carryInto > 0 ? ` + ${carryInto}` : '';
    const prompt = `${aD[i]} × ${tensB}${carryPromptPart} = ?`;

    const aId = `main-a-${i}`;
    const bId = `main-b-1`; // tens digit of b in byten layout
    const askHi: Record<string, NonNullable<Highlight>> = { [aId]: 'now', [bId]: 'now' };
    if (carryInto > 0 && cells.some(c => c.id === `main-c-${i}`)) {
      askHi[`main-c-${i}`] = 'now';
    }

    steps.push({
      id: `${i === 0 ? 'ones' : 'tens'}-ask`,
      kind: 'digit-op',
      narration: `${aD[i]}의 자리: ${aD[i]} × ${tensB}${carryPromptPart} = ${colValue}.`,
      board: boardFrom(shown, askHi),
      quiz: {
        prompt,
        answer: colValue,
        hints: [
          `${aD[i]}에 ${tensB}를 곱해요${carryInto > 0 ? `, 올림 ${carryInto}도 더해요` : ''}.`,
          `${aD[i]} × ${tensB}${carryPromptPart} 를 계산해보세요.`,
        ],
      },
    });

    // write: reveal result digit at shifted place
    shown.add(`main-r-${place}`);
    if (carryOut > 0) {
      if (i + 1 < aD.length) {
        const nextCarryId = `main-c-${i + 1}`;
        if (cells.some(c => c.id === nextCarryId)) shown.add(nextCarryId);
      } else {
        // leading digit sits at place = aD.length + 1
        shown.add(`main-r-${aD.length + 1}`);
      }
    }

    const writeNarr =
      carryOut > 0
        ? `${colValue} → ${resultDigit} 쓰고 ${carryOut} 올림.`
        : `${colValue} 를 씁니다.`;

    steps.push({
      id: `${i === 0 ? 'ones' : 'tens'}-write`,
      kind: 'sum',
      narration: writeNarr,
      board: boardFrom(shown, { 'main-r-0': 'zero' }),
    });
  }

  // result
  steps.push({
    id: 'result',
    kind: 'result',
    narration: `다 곱했어요! ${a} × ${b} = ${final}.`,
    board: boardFrom(shown),
  });

  return steps;
}

// ── Mode 3: 2-digit × 2-digit (distributive tree) ───────────────────────────

export function buildMultiplication(problem: Problem): Step[] {
  const [a, b] = problem.operands;
  const bD = onesFirst(b);
  const onesB = bD[0];
  const tensB = bD[1] ?? 0;

  // Dispatch on b
  if (onesB === 0) return buildMultiplyByTen(problem);
  if (bD.length === 1 || tensB === 0) return buildMul2x1(problem);

  // --- Mode 3: 2-digit × 2-digit ---
  const aD = onesFirst(a);
  const p1 = multiplyByDigit(a, onesB);
  const p2 = multiplyByDigit(a, tensB);
  const P1 = p1.product;
  const P2 = p2.product;
  const final = a * b;

  const p1Digits = onesFirst(P1);
  const p2ShiftedDigits = onesFirst(P2 * 10);

  // Merge addition arithmetic
  const mergeAD = p1Digits;
  const mergeBD = p2ShiftedDigits;
  const mergeCols = Math.max(mergeAD.length, mergeBD.length);
  const mergeCarryIn: number[] = [];
  const mergeResultDigit: number[] = [];
  const mergeCarryOut: number[] = [];
  let carry = 0;
  for (let i = 0; i < mergeCols; i++) {
    mergeCarryIn[i] = carry;
    const s = (mergeAD[i] ?? 0) + (mergeBD[i] ?? 0) + carry;
    mergeResultDigit[i] = s % 10;
    carry = Math.floor(s / 10);
    mergeCarryOut[i] = carry;
  }
  const mergeHasFinalCarry = carry > 0;
  const mergeResultCols = mergeHasFinalCarry ? mergeCols + 1 : mergeCols;
  if (mergeHasFinalCarry) mergeResultDigit[mergeCols] = carry;

  // ── Build all cells ──────────────────────────────────────────────────────

  const cells: Cell[] = [];

  // TOP region
  aD.forEach((d, p) =>
    cells.push({ id: `top-a-${p}`, region: 'top', row: 0, place: p, value: String(d), role: 'operand', visible: false })
  );
  bD.forEach((d, p) =>
    cells.push({ id: `top-b-${p}`, region: 'top', row: 1, place: p, value: String(d), role: 'operand', visible: false })
  );
  cells.push({ id: 'top-op', region: 'top', row: 1, place: aD.length, value: '×', role: 'operator', visible: false });

  // LEFT region: a × onesB (shift=0)
  // Row 1: a
  aD.forEach((d, pl) =>
    cells.push({ id: `left-a-${pl}`, region: 'left', row: 1, place: pl, value: String(d), role: 'operand', visible: false })
  );
  // Row 2: × onesB
  cells.push({ id: 'left-op', region: 'left', row: 2, place: aD.length, value: '×', role: 'operator', visible: false });
  cells.push({ id: 'left-b', region: 'left', row: 2, place: 0, value: String(onesB), role: 'operand', visible: false });
  // Row 0: carries for left (skip i=0)
  for (let i = 1; i < aD.length; i++) {
    if (p1.carryInto[i] > 0) {
      cells.push({ id: `left-c-${i}`, region: 'left', row: 0, place: i, value: String(p1.carryInto[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  // Carry anchor: if no real carry cells exist for left row 0, add invisible anchor so row 0 is always reserved
  if (!cells.some(c => c.region === 'left' && c.row === 0)) {
    cells.push({ id: 'left-carryanchor', region: 'left', row: 0, place: 0, value: '', role: 'carry', superscript: true, visible: false });
  }
  // Row 3: P1 result digits (no layoutId — gather is copy-to-center, not move)
  p1Digits.forEach((d, pl) =>
    cells.push({ id: `left-r-${pl}`, region: 'left', row: 3, place: pl, value: String(d), role: 'result', visible: false })
  );

  // RIGHT region: a × tensB (shift=1, place-zero at place 0)
  // Row 1: a (NOT shifted — operand aligns with its digits, only result is shifted)
  aD.forEach((d, pl) =>
    cells.push({ id: `right-a-${pl}`, region: 'right', row: 1, place: pl, value: String(d), role: 'operand', visible: false })
  );
  // Row 2: × tensB (showing full ×N0 with the trailing zero; NOT shifted)
  cells.push({ id: 'right-op', region: 'right', row: 2, place: aD.length, value: '×', role: 'operator', visible: false });
  cells.push({ id: 'right-b', region: 'right', row: 2, place: 1, value: String(tensB), role: 'operand', visible: false });
  cells.push({ id: 'right-b-zero', region: 'right', row: 2, place: 0, value: '0', role: 'operand', visible: false });
  // Row 0: carries for right (skip i=0); placed at i (not shifted, matching operand column)
  for (let i = 1; i < aD.length; i++) {
    if (p2.carryInto[i] > 0) {
      cells.push({ id: `right-c-${i}`, region: 'right', row: 0, place: i, value: String(p2.carryInto[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  // Carry anchor: if no real carry cells exist for right row 0, add invisible anchor so row 0 is always reserved
  if (!cells.some(c => c.region === 'right' && c.row === 0)) {
    cells.push({ id: 'right-carryanchor', region: 'right', row: 0, place: 0, value: '', role: 'carry', superscript: true, visible: false });
  }
  // Row 3: P2 result — place 0 is zero-placeholder; digits from p2ShiftedDigits at places 1..N (no layoutId)
  cells.push({ id: 'right-r-0', region: 'right', row: 3, place: 0, value: '0', role: 'zero-placeholder', visible: false });
  p2ShiftedDigits.slice(1).forEach((d, i) =>
    cells.push({ id: `right-r-${i + 1}`, region: 'right', row: 3, place: i + 1, value: String(d), role: 'result', visible: false })
  );

  // MERGE region: addends slide in from their branch side (no layoutId — they're copies, not moved cells)
  mergeAD.forEach((d, pl) =>
    cells.push({ id: `merge-a-${pl}`, region: 'merge', row: 1, place: pl, value: String(d), role: 'partial', visible: false, enterFrom: 'left' as const })
  );
  mergeBD.forEach((d, pl) =>
    cells.push({ id: `merge-b-${pl}`, region: 'merge', row: 2, place: pl, value: String(d), role: 'partial', visible: false, enterFrom: 'right' as const })
  );
  cells.push({ id: 'merge-op', region: 'merge', row: 2, place: mergeBD.length, value: '+', role: 'operator', visible: false });
  for (let i = 1; i < mergeCols; i++) {
    if ((mergeCarryIn[i] ?? 0) > 0) {
      cells.push({ id: `merge-c-${i}`, region: 'merge', row: 0, place: i, value: String(mergeCarryIn[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  for (let i = 0; i < mergeResultCols; i++) {
    cells.push({ id: `merge-r-${i}`, region: 'merge', row: 3, place: i, value: String(mergeResultDigit[i]), role: 'result', visible: false });
  }

  const allRegions = ['top', 'left', 'right', 'merge'] as const;
  const dividers = [
    { region: 'left' as const, row: 2 },
    { region: 'right' as const, row: 2 },
    { region: 'merge' as const, row: 2 },
  ];

  const boardFrom = (shown: Set<string>, hi: Record<string, NonNullable<Highlight>> = {}): BoardState => ({
    regions: [...allRegions],
    cells: cells.map(c => ({ ...c, visible: shown.has(c.id), highlight: hi[c.id] ?? null })),
    dividers,
  });

  // ── Build steps ──────────────────────────────────────────────────────────

  const steps: Step[] = [];
  const shown = new Set<string>();

  // 1. setup
  aD.forEach((_, pl) => shown.add(`top-a-${pl}`));
  bD.forEach((_, pl) => shown.add(`top-b-${pl}`));
  shown.add('top-op');
  steps.push({
    id: 'setup', kind: 'setup',
    narration: `${a} × ${b}를 세로로 써요.`,
    board: boardFrom(shown),
  });

  // 2. decompose
  steps.push({
    id: 'decompose', kind: 'decompose',
    narration: `${b}는 ${tensB * 10}과 ${onesB}가 합쳐진 수. ${a}×${onesB} 와 ${a}×${tensB * 10} 으로 나눠 곱한 뒤 더해요.`,
    board: boardFrom(shown, { 'top-b-0': 'now', 'top-b-1': 'now' }),
    quiz: { prompt: `${b} = ${tensB * 10} + ?`, answer: onesB, hints: [`${b}의 일의 자리를 생각해보세요.`, `${b} - ${tensB * 10} = ?`] },
  });

  // 3. branches: reveal BOTH branch operand frames together
  aD.forEach((_, pl) => shown.add(`left-a-${pl}`));
  shown.add('left-op');
  shown.add('left-b');
  aD.forEach((_, pl) => shown.add(`right-a-${pl}`));
  shown.add('right-op');
  shown.add('right-b');
  shown.add('right-b-zero');
  steps.push({
    id: 'branches', kind: 'decompose',
    narration: `왼쪽은 ${a} × ${onesB}, 오른쪽은 ${a} × ${tensB * 10}. 두 곱을 각각 구해서 더할 거예요.`,
    board: boardFrom(shown),
  });

  // 4–7. LEFT digit-by-digit steps: left-ones-ask, left-ones-write, left-tens-ask, left-tens-write
  // We build these manually (like appendDigitByDigitSteps) but inline for left, using prefix='left', idPrefix='left-'
  for (let i = 0; i < aD.length; i++) {
    const carryInto = p1.carryInto[i] ?? 0;
    const colValue = aD[i] * onesB + carryInto;
    const resultDigit = colValue % 10;
    const carryOut = Math.floor(colValue / 10);

    const carryPromptPart = carryInto > 0 ? ` + ${carryInto}` : '';
    const prompt = `${aD[i]} × ${onesB}${carryPromptPart} = ?`;
    const aId = `left-a-${i}`;
    const bId = `left-b`;
    const askHi: Record<string, NonNullable<Highlight>> = { [aId]: 'now', [bId]: 'now' };
    if (carryInto > 0 && cells.some(c => c.id === `left-c-${i}`)) {
      askHi[`left-c-${i}`] = 'now';
    }

    steps.push({
      id: `left-${i === 0 ? 'ones' : 'tens'}-ask`,
      kind: 'digit-op',
      narration: `왼쪽 ${i === 0 ? '일' : '십'}의 자리: ${aD[i]} × ${onesB}${carryPromptPart} = ${colValue}.`,
      board: boardFrom(shown, askHi),
      quiz: {
        prompt,
        answer: colValue,
        hints: [
          `${aD[i]}에 ${onesB}를 곱해요${carryInto > 0 ? `, 올림 ${carryInto}도 더해요` : ''}.`,
          `${aD[i]} × ${onesB}${carryPromptPart} 를 계산해보세요.`,
        ],
      },
    });

    // write: reveal left-r-${i} (place = i, shift=0)
    shown.add(`left-r-${i}`);
    if (carryOut > 0) {
      if (i + 1 < aD.length) {
        const nextCId = `left-c-${i + 1}`;
        if (cells.some(c => c.id === nextCId)) shown.add(nextCId);
      } else {
        // leading digit
        shown.add(`left-r-${aD.length}`);
      }
    }

    steps.push({
      id: `left-${i === 0 ? 'ones' : 'tens'}-write`,
      kind: 'sum',
      narration: carryOut > 0 ? `${colValue} → ${resultDigit} 쓰고 ${carryOut} 올림.` : `${colValue} 를 씁니다.`,
      board: boardFrom(shown),
    });
  }

  // right-zero: right operands already revealed by 'branches'; only reveal the zero-placeholder result cell
  shown.add('right-r-0');
  steps.push({
    id: 'right-zero', kind: 'place-zero',
    narration: `오른쪽: ${a} × ${tensB * 10}. ${tensB * 10}은 ×10이라 일의 자리에 0을 먼저 놓아요.`,
    board: boardFrom(shown, { 'right-r-0': 'zero' }),
  });

  // RIGHT digit-by-digit steps: right-ones-ask, right-ones-write, right-tens-ask, right-tens-write
  for (let i = 0; i < aD.length; i++) {
    const carryInto = p2.carryInto[i] ?? 0;
    const colValue = aD[i] * tensB + carryInto;
    const resultDigit = colValue % 10;
    const carryOut = Math.floor(colValue / 10);
    const place = i + 1; // shifted by 1

    const carryPromptPart = carryInto > 0 ? ` + ${carryInto}` : '';
    const prompt = `${aD[i]} × ${tensB}${carryPromptPart} = ?`;
    const aId = `right-a-${i}`;
    const bId = `right-b`;
    const askHi: Record<string, NonNullable<Highlight>> = { [aId]: 'now', [bId]: 'now', 'right-b-zero': 'zero', 'right-r-0': 'zero' };
    if (carryInto > 0 && cells.some(c => c.id === `right-c-${i}`)) {
      askHi[`right-c-${i}`] = 'now';
    }

    steps.push({
      id: `right-${i === 0 ? 'ones' : 'tens'}-ask`,
      kind: 'digit-op',
      narration: `오른쪽 ${i === 0 ? '일' : '십'}의 자리: ${aD[i]} × ${tensB}${carryPromptPart} = ${colValue}.`,
      board: boardFrom(shown, askHi),
      quiz: {
        prompt,
        answer: colValue,
        hints: [
          `${aD[i]}에 ${tensB}를 곱해요${carryInto > 0 ? `, 올림 ${carryInto}도 더해요` : ''}.`,
          `${aD[i]} × ${tensB}${carryPromptPart} 를 계산해보세요.`,
        ],
      },
    });

    // write: reveal right-r-${place}
    shown.add(`right-r-${place}`);
    if (carryOut > 0) {
      if (i + 1 < aD.length) {
        const nextCId = `right-c-${i + 1}`;
        if (cells.some(c => c.id === nextCId)) shown.add(nextCId);
      } else {
        // leading digit at place = aD.length + 1
        shown.add(`right-r-${aD.length + 1}`);
      }
    }

    steps.push({
      id: `right-${i === 0 ? 'ones' : 'tens'}-write`,
      kind: 'sum',
      narration: carryOut > 0 ? `${colValue} → ${resultDigit} 쓰고 ${carryOut} 올림.` : `${colValue} 를 씁니다.`,
      board: boardFrom(shown, { 'right-r-0': 'zero' }),
    });
  }

  // gather: branch results STAY visible (copy-to-center model), merge addends slide in
  const shownGather = new Set(shown);
  // Add merge addend cells (branch results remain in shown — they stay visible)
  mergeAD.forEach((_, pl) => shownGather.add(`merge-a-${pl}`));
  mergeBD.forEach((_, pl) => shownGather.add(`merge-b-${pl}`));
  shownGather.add('merge-op');
  steps.push({
    id: 'gather', kind: 'gather',
    narration: `이제 두 결과를 가운데로 모아 더해요. ${P1} + ${P2 * 10}.`,
    board: boardFrom(shownGather),
  });

  // sum-ask
  steps.push({
    id: 'sum-ask', kind: 'digit-op',
    narration: `${P1} + ${P2 * 10} = ?`,
    board: boardFrom(shownGather),
    quiz: { prompt: `${P1} + ${P2 * 10} = ?`, answer: final, hints: [`${P1}과 ${P2 * 10}을 더해요.`, `${P1} + ${P2 * 10} 를 계산해보세요.`] },
  });

  // result
  const shownResult = new Set(shownGather);
  for (let i = 0; i < mergeResultCols; i++) shownResult.add(`merge-r-${i}`);
  for (let i = 1; i < mergeCols; i++) {
    if ((mergeCarryIn[i] ?? 0) > 0) shownResult.add(`merge-c-${i}`);
  }
  steps.push({
    id: 'result', kind: 'result',
    narration: `다 곱했어요! ${a} × ${b} = ${final}.`,
    board: boardFrom(shownResult),
  });

  return steps;
}
