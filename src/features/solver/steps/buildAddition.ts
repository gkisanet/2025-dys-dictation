import type { BoardState, Cell, Highlight, Problem, Step } from './types';

const PLACE_NAMES = ['일', '십', '백', '천', '만'];
const placeName = (i: number) => PLACE_NAMES[i] ?? `10^${i}`;

/** Digits of n, ones-first: 18 -> [8, 1]. */
const onesFirst = (n: number) => String(n).split('').map(Number).reverse();

export function buildAddition(problem: Problem): Step[] {
  const [a, b] = problem.operands;
  const aD = onesFirst(a);
  const bD = onesFirst(b);
  const cols = Math.max(aD.length, bD.length);

  // Column arithmetic.
  const carryIn: number[] = [];
  const colSum: number[] = [];
  const resultDigit: number[] = [];
  const carryOut: number[] = [];
  let carry = 0;
  for (let i = 0; i < cols; i++) {
    carryIn[i] = carry;
    const s = (aD[i] ?? 0) + (bD[i] ?? 0) + carry;
    colSum[i] = s;
    resultDigit[i] = s % 10;
    carry = Math.floor(s / 10);
    carryOut[i] = carry;
  }
  const hasFinalCarry = carry > 0;
  const resultCols = hasFinalCarry ? cols + 1 : cols;
  if (hasFinalCarry) resultDigit[cols] = carry;

  const opPlace = cols; // operator sits one column left of the highest operand digit

  // Full cell layout (visibility toggled per step). Rows: 0 carry, 1 A, 2 B(+op), 3 result.
  const cells: Cell[] = [];
  aD.forEach((d, p) =>
    cells.push({ id: `a-${p}`, region: 'main', row: 1, place: p, value: String(d), role: 'operand', visible: false }),
  );
  bD.forEach((d, p) =>
    cells.push({ id: `b-${p}`, region: 'main', row: 2, place: p, value: String(d), role: 'operand', visible: false }),
  );
  cells.push({ id: 'op', region: 'main', row: 2, place: opPlace, value: '+', role: 'operator', visible: false });
  // Interior superscript carries (above operand columns 1..cols-1).
  for (let i = 1; i < cols; i++) {
    if ((carryIn[i] ?? 0) > 0) {
      cells.push({ id: `c-${i}`, region: 'main', row: 0, place: i, value: String(carryIn[i]), role: 'carry', superscript: true, visible: false });
    }
  }
  // Result digits.
  for (let i = 0; i < resultCols; i++) {
    cells.push({ id: `r-${i}`, region: 'main', row: 3, place: i, value: String(resultDigit[i]), role: 'result', visible: false });
  }
  const dividers = [{ region: 'main' as const, row: 2 }];

  const boardFrom = (shown: Set<string>, highlights: Record<string, NonNullable<Highlight>> = {}): BoardState => ({
    regions: ['main'],
    cells: cells.map((c) => ({ ...c, visible: shown.has(c.id), highlight: highlights[c.id] ?? null })),
    dividers,
  });

  const steps: Step[] = [];
  const shown = new Set<string>();

  // Setup.
  aD.forEach((_, p) => shown.add(`a-${p}`));
  bD.forEach((_, p) => shown.add(`b-${p}`));
  shown.add('op');
  steps.push({
    id: 'setup',
    kind: 'setup',
    narration: '두 수를 자리를 맞춰 세로로 써요. 일의 자리부터 차례로 더해요.',
    board: boardFrom(shown),
  });

  for (let i = 0; i < cols; i++) {
    const ad = aD[i] ?? 0;
    const bd = bD[i] ?? 0;
    const ci = carryIn[i] ?? 0;
    const expr = ci > 0 ? `${ad} + ${bd} + ${ci}` : `${ad} + ${bd}`;

    const askHi: Record<string, NonNullable<Highlight>> = { [`a-${i}`]: 'now', [`b-${i}`]: 'now' };
    if (ci > 0) askHi[`c-${i}`] = 'now';
    steps.push({
      id: `ask-${i}`,
      kind: 'digit-op',
      narration: `${placeName(i)}의 자리를 더해요: ${expr}.`,
      board: boardFrom(shown, askHi),
      quiz: {
        prompt: `${expr} = ?`,
        answer: colSum[i],
        hints: [
          ci > 0 ? `${placeName(i)}의 자리 숫자와 올림 ${ci}를 함께 더해요.` : `${placeName(i)}의 자리 숫자끼리 더해요.`,
          `${expr} 를 차근차근 더해보세요.`,
        ],
      },
    });

    // Write: reveal this column's result digit, and the carry it produces.
    shown.add(`r-${i}`);
    const co = carryOut[i] ?? 0;
    if (co > 0) {
      if (i + 1 < cols) shown.add(`c-${i + 1}`); // interior carry -> superscript above next column
      else shown.add(`r-${i + 1}`); // final carry -> new leading result digit
    }
    steps.push({
      id: `write-${i}`,
      kind: 'sum',
      narration:
        co > 0
          ? `${colSum[i]} 이니까 ${resultDigit[i]} 를 쓰고 ${co} 를 윗자리로 올려요.`
          : `${colSum[i]} 를 ${placeName(i)}의 자리에 써요.`,
      board: boardFrom(shown),
    });
  }

  // Result.
  steps.push({
    id: 'result',
    kind: 'result',
    narration: `다 더했어요! ${a} + ${b} = ${a + b}.`,
    board: boardFrom(shown),
  });

  return steps;
}
