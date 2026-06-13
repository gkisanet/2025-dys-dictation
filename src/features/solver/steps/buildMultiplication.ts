import type { BoardState, Cell, Highlight, Problem, Step } from './types';
import { onesFirst, multiplyByDigit } from './mathColumns';

/** Single-region place-zero animation for a × (multiple of 10), e.g. 18 × 20. */
function buildMultiplyByTen(problem: Problem): Step[] {
  const [a, b] = problem.operands;
  const tensB = b / 10; // b must be divisible by 10
  const aD = onesFirst(a);
  const bD = onesFirst(b); // e.g. [0, 2] for 20

  const p = multiplyByDigit(a, tensB); // a × tensB
  const final = a * b;

  // Result digits ones-first: ones digit is place-zero (0), followed by a×tensB digits
  const shiftedDigits = onesFirst(final); // e.g. [0, 6, 3] for 360

  const cells: Cell[] = [];

  // Row 0: carry row (no visible carries in this layout at setup)
  // Row 1: a operand
  aD.forEach((d, pl) =>
    cells.push({ id: `main-a-${pl}`, region: 'main', row: 1, place: pl, value: String(d), role: 'operand', visible: false })
  );
  // Row 2: × b (operator + b digits)
  bD.forEach((d, pl) =>
    cells.push({ id: `main-b-${pl}`, region: 'main', row: 2, place: pl, value: String(d), role: 'operand', visible: false })
  );
  cells.push({ id: 'main-op', region: 'main', row: 2, place: aD.length, value: '×', role: 'operator', visible: false });

  // Carry marks above each result column (skip col 0 — always no carry for the place-zero)
  for (let i = 1; i < aD.length + 1; i++) {
    const carryVal = p.carryInto[i - 1] ?? 0;
    if (carryVal > 0) {
      cells.push({ id: `main-c-${i}`, region: 'main', row: 0, place: i, value: String(carryVal), role: 'carry', superscript: true, visible: false });
    }
  }

  // Row 3 result: ones is the zero-placeholder, rest are shifted product digits
  cells.push({ id: 'main-r-0', region: 'main', row: 3, place: 0, value: '0', role: 'zero-placeholder', visible: false });
  shiftedDigits.slice(1).forEach((d, i) =>
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

  // 1. setup: reveal a and × b
  aD.forEach((_, pl) => shown.add(`main-a-${pl}`));
  bD.forEach((_, pl) => shown.add(`main-b-${pl}`));
  shown.add('main-op');
  steps.push({
    id: 'setup',
    kind: 'setup',
    narration: `${a} × ${b}를 세로로 써요.`,
    board: boardFrom(shown),
  });

  // 2. place-zero: reveal the ones result cell (zero placeholder)
  shown.add('main-r-0');
  steps.push({
    id: 'place-zero',
    kind: 'place-zero',
    narration: `${b}는 ×10이라 일의 자리에 0을 먼저 놓아요.`,
    board: boardFrom(shown, { 'main-r-0': 'zero' }),
  });

  // 3. ask: quiz a × tensB, highlight the b tens digit
  steps.push({
    id: 'ask',
    kind: 'digit-op',
    narration: `이제 ${a} × ${tensB} 를 구해 그 앞에 놓아요.`,
    board: boardFrom(shown, { 'main-r-0': 'zero', [`main-b-1`]: 'now' }),
    quiz: {
      prompt: `${a} × ${tensB} = ?`,
      answer: p.product,
      hints: [
        `${a}에 ${tensB}를 곱해요.`,
        `${a} × ${tensB} 를 계산해보세요.`,
      ],
    },
  });

  // 4. write: reveal shifted product digits + carry marks
  shiftedDigits.slice(1).forEach((_, i) => shown.add(`main-r-${i + 1}`));
  for (let i = 1; i < aD.length + 1; i++) {
    const carryVal = p.carryInto[i - 1] ?? 0;
    if (carryVal > 0) shown.add(`main-c-${i}`);
  }
  steps.push({
    id: 'write',
    kind: 'sum',
    narration: `${a}×${tensB}=${p.product}, 뒤에 0 붙여 ${final}.`,
    board: boardFrom(shown, { 'main-r-0': 'zero' }),
  });

  // 5. result
  steps.push({
    id: 'result',
    kind: 'result',
    narration: `다 곱했어요! ${a} × ${b} = ${final}.`,
    board: boardFrom(shown),
  });

  return steps;
}

export function buildMultiplication(problem: Problem): Step[] {
  const [a, b] = problem.operands;
  const bD = onesFirst(b);       // b digits ones-first
  const onesB = bD[0];           // ones digit of b
  const tensB = bD[1] ?? 0;      // tens digit of b

  if (onesB === 0) return buildMultiplyByTen(problem);
  const aD = onesFirst(a);

  // Partial products
  const p1 = multiplyByDigit(a, onesB); // a × onesB
  const p2 = multiplyByDigit(a, tensB); // a × tensB (×10 applied via place offset)
  const P1 = p1.product;                // e.g. 72
  const P2 = p2.product;                // e.g. 36 (×10 = 360 in merge)
  const final = a * b;

  // Digit sources for branch result and merge addend cells — MUST match exactly
  const p1Digits = onesFirst(P1);         // e.g. [2,7] — shared source for left result + merge addend-1
  const p2ShiftedDigits = onesFirst(P2 * 10); // e.g. [0,6,3] — shared source for right result + merge addend-2

  // Final addition: P1 + P2*10
  const mergeAD = p1Digits;              // same as onesFirst(P1)
  const mergeBD = p2ShiftedDigits;       // same as onesFirst(P2*10)
  // Compute carry for the merge addition
  const mergeCols = Math.max(mergeAD.length, mergeBD.length);
  const mergeCarryIn: number[] = [];
  const mergeColSum: number[] = [];
  const mergeResultDigit: number[] = [];
  const mergeCarryOut: number[] = [];
  let carry = 0;
  for (let i = 0; i < mergeCols; i++) {
    mergeCarryIn[i] = carry;
    const s = (mergeAD[i] ?? 0) + (mergeBD[i] ?? 0) + carry;
    mergeColSum[i] = s;
    mergeResultDigit[i] = s % 10;
    carry = Math.floor(s / 10);
    mergeCarryOut[i] = carry;
  }
  const mergeHasFinalCarry = carry > 0;
  const mergeResultCols = mergeHasFinalCarry ? mergeCols + 1 : mergeCols;
  if (mergeHasFinalCarry) mergeResultDigit[mergeCols] = carry;

  // ── Build all cells ──────────────────────────────────────────────────────

  const cells: Cell[] = [];

  // TOP region: a (rows 0), × b (row 1)
  aD.forEach((d, p) =>
    cells.push({ id: `top-a-${p}`, region: 'top', row: 0, place: p, value: String(d), role: 'operand', visible: false })
  );
  bD.forEach((d, p) =>
    cells.push({ id: `top-b-${p}`, region: 'top', row: 1, place: p, value: String(d), role: 'operand', visible: false })
  );
  cells.push({ id: 'top-op', region: 'top', row: 1, place: aD.length, value: '×', role: 'operator', visible: false });

  // LEFT region: a × onesB  (row 0 carry, row 1 a, row 2 × onesB, div@2, row 3 P1 digits)
  aD.forEach((d, p) =>
    cells.push({ id: `left-a-${p}`, region: 'left', row: 1, place: p, value: String(d), role: 'operand', visible: false })
  );
  cells.push({ id: 'left-op', region: 'left', row: 2, place: aD.length, value: '×', role: 'operator', visible: false });
  cells.push({ id: `left-b`, region: 'left', row: 2, place: 0, value: String(onesB), role: 'operand', visible: false });
  // carry marks above each left column (skip col 0 which always has carry 0)
  for (let i = 0; i < aD.length; i++) {
    if (p1.carryInto[i] > 0) {
      cells.push({ id: `left-c-${i}`, region: 'left', row: 0, place: i, value: String(p1.carryInto[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  // P1 result digits with layoutIds for gather — use p1Digits so layoutIds match merge addend-1
  p1Digits.forEach((d, p) =>
    cells.push({ id: `left-r-${p}`, region: 'left', row: 3, place: p, value: String(d), role: 'result', visible: false, layoutId: `p1-${p}` })
  );

  // RIGHT region: a × tensB  (row 0 carry, row 1 a, row 2 × tensB, div@2, row 3 P2 digits + place-zero)
  aD.forEach((d, p) =>
    cells.push({ id: `right-a-${p}`, region: 'right', row: 1, place: p + 1, value: String(d), role: 'operand', visible: false })
  );
  cells.push({ id: 'right-op', region: 'right', row: 2, place: aD.length + 1, value: '×', role: 'operator', visible: false });
  cells.push({ id: `right-b`, region: 'right', row: 2, place: 1, value: String(tensB), role: 'operand', visible: false });
  // carry marks for right columns (shifted by 1 for the ×10 place offset)
  for (let i = 0; i < aD.length; i++) {
    if (p2.carryInto[i] > 0) {
      cells.push({ id: `right-c-${i}`, region: 'right', row: 0, place: i + 1, value: String(p2.carryInto[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  // P2 result digits: ones place is always 0 (zero-placeholder), higher digits from p2ShiftedDigits
  // Use p2ShiftedDigits so layoutIds exactly match merge addend-2
  cells.push({ id: `right-r-0`, region: 'right', row: 3, place: 0, value: '0', role: 'zero-placeholder', visible: false, layoutId: 'p2-0' });
  p2ShiftedDigits.slice(1).forEach((d, i) =>
    cells.push({ id: `right-r-${i + 1}`, region: 'right', row: 3, place: i + 1, value: String(d), role: 'result', visible: false, layoutId: `p2-${i + 1}` })
  );

  // MERGE region: row 0 carry, row 1 P1 addend, row 2 + P2 addend, div@2, row 3 final result
  mergeAD.forEach((d, p) =>
    cells.push({ id: `merge-a-${p}`, region: 'merge', row: 1, place: p, value: String(d), role: 'partial', visible: false, layoutId: `p1-${p}` })
  );
  mergeBD.forEach((d, p) =>
    cells.push({ id: `merge-b-${p}`, region: 'merge', row: 2, place: p, value: String(d), role: 'partial', visible: false, layoutId: `p2-${p}` })
  );
  cells.push({ id: 'merge-op', region: 'merge', row: 2, place: mergeBD.length, value: '+', role: 'operator', visible: false });
  // Carry marks for merge addition
  for (let i = 1; i < mergeCols; i++) {
    if ((mergeCarryIn[i] ?? 0) > 0) {
      cells.push({ id: `merge-c-${i}`, region: 'merge', row: 0, place: i, value: String(mergeCarryIn[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  // Final result digits
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

  // ── Build steps ─────────────────────────────────────────────────────────

  const steps: Step[] = [];
  const shown = new Set<string>();

  // 1. setup: show top region
  aD.forEach((_, p) => shown.add(`top-a-${p}`));
  bD.forEach((_, p) => shown.add(`top-b-${p}`));
  shown.add('top-op');
  steps.push({
    id: 'setup', kind: 'setup',
    narration: `${a} × ${b}를 세로로 써요.`,
    board: boardFrom(shown),
  });

  // 2. decompose: highlight b digits, quiz onesB
  steps.push({
    id: 'decompose', kind: 'decompose',
    narration: `${b}는 ${tensB * 10}과 ${onesB}가 합쳐진 수. ${a}×${onesB} 와 ${a}×${tensB * 10} 으로 나눠 곱한 뒤 더해요.`,
    board: boardFrom(shown, { 'top-b-0': 'now', 'top-b-1': 'now' }),
    quiz: { prompt: `${b} = ${tensB * 10} + ?`, answer: onesB, hints: [`${b}의 일의 자리를 생각해보세요.`, `${b} - ${tensB * 10} = ?`] },
  });

  // 3. left-ask: reveal left a and × onesB, quiz P1
  aD.forEach((_, p) => shown.add(`left-a-${p}`));
  shown.add('left-op');
  shown.add('left-b');
  steps.push({
    id: 'left-ask', kind: 'partial',
    narration: `왼쪽: ${a} × ${onesB}를 계산해요.`,
    board: boardFrom(shown),
    quiz: { prompt: `${a} × ${onesB} = ?`, answer: P1, hints: [`${a}에 ${onesB}를 곱해요.`, `${a} × ${onesB} 를 계산해보세요.`] },
  });

  // 4. left-write: reveal left divider + P1 digits + carries
  p1Digits.forEach((_, p) => shown.add(`left-r-${p}`));
  for (let i = 0; i < aD.length; i++) {
    if (p1.carryInto[i] > 0) shown.add(`left-c-${i}`);
  }
  const leftNarr = aD.map((d, i) => {
    const carry = p1.carryInto[i];
    const s = d * onesB + carry;
    return carry > 0
      ? `${d}×${onesB}+${carry}=${s} → ${s % 10}${Math.floor(s / 10) > 0 ? ', 올림' + Math.floor(s / 10) : ''}`
      : `${d}×${onesB}=${s}`;
  }).join('; ');
  steps.push({
    id: 'left-write', kind: 'sum',
    narration: `${leftNarr} → ${P1}.`,
    board: boardFrom(shown),
  });

  // 5. right-zero: reveal right a, × tensB, divider, and the place-zero cell
  aD.forEach((_, p) => shown.add(`right-a-${p}`));
  shown.add('right-op');
  shown.add('right-b');
  shown.add(`right-r-0`);
  steps.push({
    id: 'right-zero', kind: 'place-zero',
    narration: `오른쪽: ${a} × ${tensB * 10}. ${tensB * 10}은 ×10이라 일의 자리에 0을 먼저 놓아요.`,
    board: boardFrom(shown, { 'right-r-0': 'zero' }),
  });

  // 6. right-ask: quiz a × tensB
  steps.push({
    id: 'right-ask', kind: 'partial',
    narration: `그 다음 ${a} × ${tensB}를 계산해요.`,
    board: boardFrom(shown, { 'right-r-0': 'zero' }),
    quiz: { prompt: `${a} × ${tensB} = ?`, answer: P2, hints: [`${a}에 ${tensB}를 곱해요.`, `${a} × ${tensB} 를 계산해보세요.`] },
  });

  // 7. right-write: reveal remaining P2 digits + carries (skip index 0 which is the zero-placeholder)
  p2ShiftedDigits.slice(1).forEach((_, i) => shown.add(`right-r-${i + 1}`));
  for (let i = 0; i < aD.length; i++) {
    if (p2.carryInto[i] > 0) shown.add(`right-c-${i}`);
  }
  steps.push({
    id: 'right-write', kind: 'sum',
    narration: `${a}×${tensB}=${P2}, 뒤에 0 붙여 ${P2 * 10}.`,
    board: boardFrom(shown, { 'right-r-0': 'zero' }),
  });

  // 8. gather: make left/right result cells invisible, reveal merge addends
  // Build the shown set without left/right result cells
  const shownGather = new Set(shown);
  // Remove left result cells (same set as was added in left-write)
  p1Digits.forEach((_, p) => shownGather.delete(`left-r-${p}`));
  // Remove right result cells (including zero-placeholder)
  shownGather.delete(`right-r-0`);
  p2ShiftedDigits.slice(1).forEach((_, i) => shownGather.delete(`right-r-${i + 1}`));
  // Add merge addend cells
  mergeAD.forEach((_, p) => shownGather.add(`merge-a-${p}`));
  mergeBD.forEach((_, p) => shownGather.add(`merge-b-${p}`));
  shownGather.add('merge-op');
  steps.push({
    id: 'gather', kind: 'gather',
    narration: `이제 두 결과를 가운데로 모아 더해요. ${P1} + ${P2 * 10}.`,
    board: boardFrom(shownGather),
  });

  // 9. sum-ask: quiz P1 + P2*10
  steps.push({
    id: 'sum-ask', kind: 'digit-op',
    narration: `${P1} + ${P2 * 10} = ?`,
    board: boardFrom(shownGather),
    quiz: { prompt: `${P1} + ${P2 * 10} = ?`, answer: final, hints: [`${P1}과 ${P2 * 10}을 더해요.`, `${P1} + ${P2 * 10} 를 계산해보세요.`] },
  });

  // 10. result: reveal merge final digits + carries
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
