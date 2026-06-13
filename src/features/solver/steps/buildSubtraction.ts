import type { BoardState, Cell, Highlight, Problem, Step } from './types';
import { onesFirst, placeName } from './mathColumns';

export function buildSubtraction(problem: Problem): Step[] {
  const [a, b] = problem.operands;          // a >= b
  const aD = onesFirst(a);
  const bD = onesFirst(b);
  const cols = aD.length;                   // a has >= digits than b

  // Column subtraction with borrow.
  const topUsed: number[] = [];   // effective top digit used (after lending to lower col & receiving +10)
  const borrowFlag: boolean[] = []; // did column i need to borrow?
  const reduced: number[] = [];   // value the next column's top digit becomes after lending (for borrow mark)
  const diff: number[] = [];
  let borrow = 0;
  for (let i = 0; i < cols; i++) {
    let top = aD[i] - borrow;
    const need = top < (bD[i] ?? 0);
    borrowFlag[i] = need;
    if (need) { top += 10; borrow = 1; } else { borrow = 0; }
    topUsed[i] = top;
    diff[i] = top - (bD[i] ?? 0);
  }
  // reduced[j] = the borrow mark shown above column j (aD[j] - borrowTakenFromJ)
  // borrow taken from column j happens when column j-1 borrowed.
  for (let j = 1; j < cols; j++) reduced[j] = aD[j] - (borrowFlag[j - 1] ? 1 : 0);

  const cells: Cell[] = [];
  aD.forEach((d, p) => cells.push({ id: `a-${p}`, region: 'main', row: 1, place: p, value: String(d), role: 'operand', visible: false }));
  bD.forEach((d, p) => cells.push({ id: `b-${p}`, region: 'main', row: 2, place: p, value: String(d), role: 'operand', visible: false }));
  cells.push({ id: 'op', region: 'main', row: 2, place: cols, value: '−', role: 'operator', visible: false });
  // borrow marks: when column i-1 borrows, show reduced value above column i (superscript, role 'borrow')
  for (let j = 1; j < cols; j++) {
    if (borrowFlag[j - 1]) cells.push({ id: `bk-${j}`, region: 'main', row: 0, place: j, value: String(reduced[j]), role: 'borrow', superscript: true, visible: false });
  }
  for (let i = 0; i < cols; i++) cells.push({ id: `r-${i}`, region: 'main', row: 3, place: i, value: String(diff[i]), role: 'result', visible: false });
  const dividers = [{ region: 'main' as const, row: 2 }];

  const boardFrom = (shown: Set<string>, hi: Record<string, NonNullable<Highlight>> = {}): BoardState => ({
    regions: ['main'], cells: cells.map(c => ({ ...c, visible: shown.has(c.id), highlight: hi[c.id] ?? null })), dividers,
  });

  const steps: Step[] = [];
  const shown = new Set<string>();
  aD.forEach((_, p) => shown.add(`a-${p}`));
  bD.forEach((_, p) => shown.add(`b-${p}`));
  shown.add('op');
  steps.push({ id: 'setup', kind: 'setup', narration: '세로로 맞춰 쓰고, 일의 자리부터 빼요.', board: boardFrom(shown) });

  for (let i = 0; i < cols; i++) {
    const need = borrowFlag[i];
    // borrow step (only when needed): reveal the borrow mark above the next column
    if (need) {
      if (cells.some(c => c.id === `bk-${i + 1}`)) shown.add(`bk-${i + 1}`);
      steps.push({
        id: `borrow-${i}`, kind: 'borrow',
        narration: `${placeName(i)}의 자리: ${aD[i]} 에서 ${bD[i] ?? 0} 를 뺄 수 없어요. 윗자리에서 10을 빌려와 ${topUsed[i]} 로 만들어요.`,
        board: boardFrom(shown, { [`a-${i}`]: 'now', ...(cells.some(c => c.id === `bk-${i + 1}`) ? { [`bk-${i + 1}`]: 'now' as const } : {}) }),
      });
    }
    const expr = `${topUsed[i]} - ${bD[i] ?? 0}`;
    steps.push({
      id: `ask-${i}`, kind: 'digit-op',
      narration: `${placeName(i)}의 자리를 빼요: ${expr}.`,
      board: boardFrom(shown, { [`a-${i}`]: 'now', [`b-${i}`]: 'now' }),
      quiz: { prompt: `${expr} = ?`, answer: diff[i], hints: [`${placeName(i)}의 자리끼리 빼요${need ? ' (빌려온 10 포함)' : ''}.`, `${expr} 를 계산해보세요.`] },
    });
    shown.add(`r-${i}`);
    steps.push({ id: `write-${i}`, kind: 'sum', narration: `${diff[i]} 를 ${placeName(i)}의 자리에 써요.`, board: boardFrom(shown) });
  }
  steps.push({ id: 'result', kind: 'result', narration: `다 뺐어요! ${a} - ${b} = ${a - b}.`, board: boardFrom(shown) });
  return steps;
}
