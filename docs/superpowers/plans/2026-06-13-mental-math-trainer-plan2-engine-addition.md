# Mental Math Trainer — Solver Engine + Addition (Plan 2 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working animated addition solver at `/solve/add`: the worksheet draws itself step by step with Framer Motion, narration explains each column, and blocking short-answer quiz checkpoints require the correct sum (with staged hints + reveal) before the result digit is shown.

**Architecture:** A pure `buildAddition(problem)` compiles an addition into an ordered `Step[]` (each step is a cumulative `BoardState` + narration + optional quiz). A reducer-based `useSolveEngine` walks the steps, blocking on quiz steps. The `WorksheetRenderer` becomes a Framer Motion component that animates newly-visible cells in. Presentational `NarrationPanel` / `QuizPanel` / `Controls` plus a `SolveSession` orchestrator wire it together.

**Tech Stack:** React 19, TypeScript, Framer Motion, Tailwind v4, TanStack Router, Vitest + Testing Library + user-event.

**Spec:** `docs/superpowers/specs/2026-06-13-mental-math-trainer-design.md`
**Builds on:** Plan 1 (types in `src/features/solver/steps/types.ts`, static `WorksheetRenderer`, `/solve/$operation` route).

**Scope note:** Only **addition** at **`verbosity: 'full'`**. Subtraction/multiplication are Plan 3; verbosity variants + curriculum + persistence are Plans 4–5; mobile-compact polish is Plan 6. Do NOT build those here.

---

## File Structure (this plan)

```
src/features/solver/
  WorksheetRenderer.tsx         (modify: Framer Motion animation + correct divider/grid placement)
  useSolveEngine.ts             (create: reducer + hook)
  useSolveEngine.test.ts        (create)
  steps/
    buildAddition.ts            (create: pure step generator)
    buildAddition.test.ts       (create)
  ui/
    NarrationPanel.tsx          (create)
    QuizPanel.tsx               (create)
    Controls.tsx                (create)
    panels.test.tsx             (create)
  SolveSession.tsx              (create: orchestrator)
  SolveSession.test.tsx         (create: integration)
src/features/problems/
  generateAddition.ts           (create)
  generateAddition.test.ts      (create)
src/routes/Solve.tsx            (modify: render SolveSession for 'add')
```

---

## Task 1: Animate the WorksheetRenderer (Framer Motion) + fix divider placement

**Files:**
- Modify: `src/features/solver/WorksheetRenderer.tsx`
- Test: `src/features/solver/WorksheetRenderer.test.tsx` (extend)

The Plan 1 renderer placed dividers with `gridRow: d.row + 2`, which collides once a result row exists below the divider. Rework layout to assign grid rows by interleaving content rows and dividers, render each **visible** cell as a `motion.div` that animates in, and respect reduced motion.

- [ ] **Step 1: Add a failing test for divider-below-result layout + animation wrapper presence**

Append to `src/features/solver/WorksheetRenderer.test.tsx`:
```tsx
import type { BoardState } from './steps/types';

const boardWithResult: BoardState = {
  regions: ['main'],
  cells: [
    { id: 'a-1', region: 'main', row: 1, place: 1, value: '1', role: 'operand', visible: true },
    { id: 'a-0', region: 'main', row: 1, place: 0, value: '8', role: 'operand', visible: true },
    { id: 'op',  region: 'main', row: 2, place: 2, value: '+', role: 'operator', visible: true },
    { id: 'b-1', region: 'main', row: 2, place: 1, value: '2', role: 'operand', visible: true },
    { id: 'b-0', region: 'main', row: 2, place: 0, value: '4', role: 'operand', visible: true },
    { id: 'r-1', region: 'main', row: 3, place: 1, value: '4', role: 'result', visible: true },
    { id: 'r-0', region: 'main', row: 3, place: 0, value: '2', role: 'result', visible: false },
    { id: 'c-1', region: 'main', row: 0, place: 1, value: '1', role: 'carry', superscript: true, visible: true },
  ],
  dividers: [{ region: 'main', row: 2 }],
};

describe('WorksheetRenderer layout', () => {
  it('renders the carry superscript and result row, hides invisible result cell', () => {
    render(<WorksheetRenderer board={boardWithResult} />);
    expect(screen.getByText('4', { selector: '[data-role="result"]' })).toBeInTheDocument();
    // hidden r-0 ('2') not rendered; the '2' of operand 24 is visible (1 occurrence)
    expect(screen.getAllByText('2')).toHaveLength(1);
    // carry superscript present and marked
    expect(screen.getByText('1', { selector: '[data-superscript="true"]' })).toBeInTheDocument();
  });

  it('places the divider on its own grid row below the second operand', () => {
    const { container } = render(<WorksheetRenderer board={boardWithResult} />);
    const divider = container.querySelector('[data-divider="true"]') as HTMLElement;
    const opCell = container.querySelector('[data-cell-id="op"]') as HTMLElement;
    const resultCell = container.querySelector('[data-cell-id="r-1"]') as HTMLElement;
    const gr = (el: HTMLElement) => Number(el.style.gridRowStart);
    expect(gr(divider)).toBeGreaterThan(gr(opCell));       // divider below operand B row
    expect(gr(resultCell)).toBeGreaterThan(gr(divider));   // result below divider
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- src/features/solver/WorksheetRenderer.test.tsx`
Expected: FAIL — no `data-divider`/`data-cell-id`/`data-role` attributes yet; divider placement assertions fail.

- [ ] **Step 3: Rewrite `src/features/solver/WorksheetRenderer.tsx`**

```tsx
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { BoardState, Cell, Highlight, Region } from './steps/types';

const HL_CLASS: Record<NonNullable<Highlight>, string> = {
  now: 'bg-amber-200 text-amber-800 rounded-md',
  pair: 'bg-blue-100 text-blue-700 rounded-md',
  zero: 'bg-orange-200 text-orange-800 rounded-md',
};

function cellClass(cell: Cell): string {
  const base = cell.superscript
    ? 'flex items-start justify-center text-sm text-red-600 h-4'
    : 'flex items-end justify-center text-3xl font-bold h-12';
  const hl = cell.highlight ? HL_CLASS[cell.highlight] : '';
  const role = cell.role === 'operator' ? 'text-muted-foreground' : '';
  return `${base} ${hl} ${role}`.trim();
}

/**
 * Assigns 1-indexed CSS grid rows by interleaving content rows and dividers:
 * each content row gets a track; a divider declared for row N gets the track
 * immediately after row N's content. This keeps dividers between operands and
 * results instead of colliding with them.
 */
function buildRowMap(rows: number[], dividerRows: number[]) {
  const contentRow = new Map<number, number>();
  const dividerRow = new Map<number, number>();
  let grid = 1;
  for (const r of rows) {
    contentRow.set(r, grid++);
    if (dividerRows.includes(r)) dividerRow.set(r, grid++);
  }
  return { contentRow, dividerRow };
}

function RegionGrid({
  board,
  region,
  reduced,
}: {
  board: BoardState;
  region: Region;
  reduced: boolean;
}) {
  const all = board.cells.filter((c) => c.region === region);
  if (all.length === 0) return null;
  const visible = all.filter((c) => c.visible);
  const maxPlace = Math.max(...all.map((c) => c.place));
  const rows = [...new Set(all.map((c) => c.row))].sort((a, b) => a - b);
  const dividerRows = board.dividers.filter((d) => d.region === region).map((d) => d.row);
  const { contentRow, dividerRow } = buildRowMap(rows, dividerRows);

  const enter = reduced
    ? { initial: false as const, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: -18, scale: 0.7 }, animate: { opacity: 1, y: 0, scale: 1 } };

  return (
    <div
      className="grid gap-x-1.5 gap-y-0.5 font-mono"
      style={{ gridTemplateColumns: `repeat(${maxPlace + 1}, 2.5rem)` }}
    >
      <AnimatePresence>
        {visible.map((cell) => (
          <motion.div
            key={cell.id}
            layout={!reduced}
            {...enter}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
            data-cell-id={cell.id}
            data-role={cell.role}
            data-superscript={cell.superscript ? 'true' : undefined}
            className={cellClass(cell)}
            style={{
              gridColumnStart: maxPlace - cell.place + 1,
              gridRowStart: contentRow.get(cell.row),
            }}
          >
            {cell.value}
          </motion.div>
        ))}
      </AnimatePresence>
      {board.dividers
        .filter((d) => d.region === region && dividerRow.has(d.row))
        .map((d) => (
          <motion.div
            key={`div-${region}-${d.row}`}
            data-divider="true"
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="h-0.5 origin-right rounded-full bg-foreground"
            style={{ gridColumn: '1 / -1', gridRowStart: dividerRow.get(d.row) }}
          />
        ))}
    </div>
  );
}

export function WorksheetRenderer({ board }: { board: BoardState }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <div className="flex flex-col items-center gap-2" data-testid="worksheet">
      {board.regions.map((region) => (
        <RegionGrid key={region} board={board} region={region} reduced={reduced} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the renderer tests**

Run: `npm test -- src/features/solver/WorksheetRenderer.test.tsx`
Expected: PASS (Plan 1 cases + the two new layout cases).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: animate WorksheetRenderer with Framer Motion, fix divider rows\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 2: `buildAddition` step generator (pure)

**Files:**
- Create: `src/features/solver/steps/buildAddition.ts`
- Test: `src/features/solver/steps/buildAddition.test.ts`

Compiles an addition `Problem` into ordered steps: `setup`, then per column an **ask** step (quiz, no result shown yet) and a **write** step (reveals the digit + any carry), then a final `result` step. Each step's board contains the full cell layout with `visible` toggled cumulatively.

- [ ] **Step 1: Write the failing test**

Create `src/features/solver/steps/buildAddition.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- src/features/solver/steps/buildAddition.test.ts`
Expected: FAIL — cannot find module `./buildAddition`.

- [ ] **Step 3: Implement `src/features/solver/steps/buildAddition.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- src/features/solver/steps/buildAddition.test.ts`
Expected: PASS (all cases for 18+24 and 7+5).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: buildAddition step generator (full verbosity)\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 3: `useSolveEngine` (reducer + hook)

**Files:**
- Create: `src/features/solver/useSolveEngine.ts`
- Test: `src/features/solver/useSolveEngine.test.ts`

Walks steps. Quiz steps block advancing until the answer is correct or revealed after `MAX_ATTEMPTS` wrong tries; tracks staged hints and score.

- [ ] **Step 1: Write the failing test (reducer logic via the hook with `act`)**

Create `src/features/solver/useSolveEngine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSolveEngine } from './useSolveEngine';
import type { Step } from './steps/types';

const board = { regions: ['main' as const], cells: [], dividers: [] };
const steps: Step[] = [
  { id: 'setup', kind: 'setup', narration: 's', board },
  { id: 'ask-0', kind: 'digit-op', narration: 'a', board, quiz: { prompt: '8 + 4 = ?', answer: 12, hints: ['h1', 'h2'] } },
  { id: 'write-0', kind: 'sum', narration: 'w', board },
];

describe('useSolveEngine', () => {
  it('starts at the first step; non-quiz steps can advance immediately', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    expect(result.current.current.id).toBe('setup');
    expect(result.current.canAdvance).toBe(true);
    act(() => result.current.next());
    expect(result.current.current.id).toBe('ask-0');
  });

  it('blocks advancing on a quiz step until answered correctly', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    act(() => result.current.next()); // -> ask-0
    expect(result.current.canAdvance).toBe(false);
    act(() => result.current.next()); // ignored while unresolved
    expect(result.current.current.id).toBe('ask-0');
    act(() => result.current.submit(12));
    expect(result.current.feedback).toBe('correct');
    expect(result.current.canAdvance).toBe(true);
    expect(result.current.score).toEqual({ correct: 1, total: 1 });
  });

  it('shows staged hints on wrong answers and reveals after 3 tries', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    act(() => result.current.next());
    act(() => result.current.submit(11));
    expect(result.current.feedback).toBe('wrong');
    expect(result.current.hint).toBe('h1');
    act(() => result.current.submit(13));
    expect(result.current.hint).toBe('h2');
    act(() => result.current.submit(99));
    expect(result.current.revealedAnswer).toBe(12);
    expect(result.current.canAdvance).toBe(true);
    expect(result.current.score).toEqual({ correct: 0, total: 1 }); // revealed != correct
  });

  it('reports done on the last step and reset returns to start', () => {
    const { result } = renderHook(() => useSolveEngine(steps));
    act(() => result.current.next());
    act(() => result.current.submit(12));
    act(() => result.current.next()); // -> write-0 (last)
    expect(result.current.isDone).toBe(true);
    act(() => result.current.reset());
    expect(result.current.current.id).toBe('setup');
    expect(result.current.score).toEqual({ correct: 0, total: 0 });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- src/features/solver/useSolveEngine.test.ts`
Expected: FAIL — cannot find module `./useSolveEngine`.

- [ ] **Step 3: Implement `src/features/solver/useSolveEngine.ts`**

```ts
import { useCallback, useMemo, useReducer } from 'react';
import type { Step } from './steps/types';

const MAX_ATTEMPTS = 3;

export interface EngineState {
  steps: Step[];
  index: number;
  attempts: number;
  hintIndex: number; // -1 = none shown
  revealed: boolean;
  resolved: boolean; // current step ready to advance
  feedback: 'none' | 'correct' | 'wrong';
  score: { correct: number; total: number };
}

type Action =
  | { type: 'SUBMIT'; value: number }
  | { type: 'NEXT' }
  | { type: 'RESET' };

function init(steps: Step[]): EngineState {
  return {
    steps,
    index: 0,
    attempts: 0,
    hintIndex: -1,
    revealed: false,
    resolved: !steps[0]?.quiz,
    feedback: 'none',
    score: { correct: 0, total: steps[0]?.quiz ? 1 : 0 },
  };
}

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'SUBMIT': {
      const step = state.steps[state.index];
      if (!step.quiz || state.resolved) return state;
      if (action.value === step.quiz.answer) {
        return {
          ...state,
          resolved: true,
          feedback: 'correct',
          score: { ...state.score, correct: state.score.correct + (state.revealed ? 0 : 1) },
        };
      }
      const attempts = state.attempts + 1;
      const revealed = attempts >= MAX_ATTEMPTS;
      return {
        ...state,
        attempts,
        revealed,
        resolved: revealed,
        feedback: 'wrong',
        hintIndex: Math.min(state.hintIndex + 1, step.quiz.hints.length - 1),
      };
    }
    case 'NEXT': {
      if (!state.resolved) return state;
      const index = Math.min(state.index + 1, state.steps.length - 1);
      if (index === state.index) return state;
      const next = state.steps[index];
      const hasQuiz = !!next.quiz;
      return {
        ...state,
        index,
        attempts: 0,
        hintIndex: -1,
        revealed: false,
        resolved: !hasQuiz,
        feedback: 'none',
        score: hasQuiz ? { ...state.score, total: state.score.total + 1 } : state.score,
      };
    }
    case 'RESET':
      return init(state.steps);
    default:
      return state;
  }
}

export function useSolveEngine(steps: Step[]) {
  const [state, dispatch] = useReducer(reducer, steps, init);

  const submit = useCallback((value: number) => dispatch({ type: 'SUBMIT', value }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const current = state.steps[state.index];
  const isLast = state.index === state.steps.length - 1;

  return useMemo(
    () => ({
      current,
      index: state.index,
      total: state.steps.length,
      feedback: state.feedback,
      score: state.score,
      hint: state.hintIndex >= 0 ? (current.quiz?.hints[state.hintIndex] ?? null) : null,
      revealedAnswer: state.revealed ? (current.quiz?.answer ?? null) : null,
      canAdvance: state.resolved && !isLast,
      isDone: isLast && state.resolved,
      submit,
      next,
      reset,
    }),
    [current, state, isLast, submit, next, reset],
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- src/features/solver/useSolveEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: useSolveEngine state machine with quiz blocking and scoring\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 4: Presentational panels (Narration / Quiz / Controls)

**Files:**
- Create: `src/features/solver/ui/NarrationPanel.tsx`, `src/features/solver/ui/QuizPanel.tsx`, `src/features/solver/ui/Controls.tsx`
- Test: `src/features/solver/ui/panels.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/solver/ui/panels.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrationPanel } from './NarrationPanel';
import { QuizPanel } from './QuizPanel';
import { Controls } from './Controls';
import type { Quiz } from '../steps/types';

const quiz: Quiz = { prompt: '8 + 4 = ?', answer: 12, hints: ['h1', 'h2'] };

describe('NarrationPanel', () => {
  it('renders the narration text', () => {
    render(<NarrationPanel text="일의 자리를 더해요" />);
    expect(screen.getByText('일의 자리를 더해요')).toBeInTheDocument();
  });
});

describe('QuizPanel', () => {
  it('submits the typed number', async () => {
    const onSubmit = vi.fn();
    render(<QuizPanel quiz={quiz} feedback="none" hint={null} revealedAnswer={null} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('spinbutton'), '12');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onSubmit).toHaveBeenCalledWith(12);
  });

  it('shows hint on wrong and the revealed answer when given', () => {
    const { rerender } = render(
      <QuizPanel quiz={quiz} feedback="wrong" hint="h1" revealedAnswer={null} onSubmit={() => {}} />,
    );
    expect(screen.getByText('h1')).toBeInTheDocument();
    rerender(<QuizPanel quiz={quiz} feedback="wrong" hint="h2" revealedAnswer={12} onSubmit={() => {}} />);
    expect(screen.getByText(/정답: 12/)).toBeInTheDocument();
  });
});

describe('Controls', () => {
  it('disables Next when cannot advance, calls onNext when enabled', async () => {
    const onNext = vi.fn();
    const { rerender } = render(<Controls canAdvance={false} isDone={false} onNext={onNext} onReset={() => {}} />);
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    rerender(<Controls canAdvance={true} isDone={false} onNext={onNext} onReset={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onNext).toHaveBeenCalled();
  });

  it('shows a restart button when done', () => {
    render(<Controls canAdvance={false} isDone={true} onNext={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('button', { name: '다시 풀기' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- src/features/solver/ui/panels.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/features/solver/ui/NarrationPanel.tsx`**

```tsx
export function NarrationPanel({ text }: { text: string }) {
  return (
    <div className="rounded-r-xl border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950">
      {text}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/features/solver/ui/QuizPanel.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Quiz } from '../steps/types';
import { Button } from '@/components/ui/button';

interface QuizPanelProps {
  quiz: Quiz;
  feedback: 'none' | 'correct' | 'wrong';
  hint: string | null;
  revealedAnswer: number | null;
  onSubmit: (value: number) => void;
}

export function QuizPanel({ quiz, feedback, hint, revealedAnswer, onSubmit }: QuizPanelProps) {
  const [value, setValue] = useState('');

  // Clear the input when the prompt changes (new checkpoint).
  useEffect(() => setValue(''), [quiz.prompt]);

  const submit = () => {
    if (value.trim() === '') return;
    onSubmit(Number(value));
  };

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3">
      <p className="mb-2 font-bold text-amber-900">🧮 {quiz.prompt}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          aria-label="답"
          className="w-24 rounded-lg border-2 border-amber-300 px-2 py-1.5 text-center text-xl"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={revealedAnswer !== null || feedback === 'correct'}
        />
        <Button size="sm" onClick={submit}>확인</Button>
      </div>
      {feedback === 'correct' && <p className="mt-2 text-sm font-semibold text-green-700">정답이에요! ✓</p>}
      {feedback === 'wrong' && hint && <p className="mt-2 text-sm text-amber-800">힌트: {hint}</p>}
      {revealedAnswer !== null && <p className="mt-2 text-sm font-semibold text-red-600">정답: {revealedAnswer}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/features/solver/ui/Controls.tsx`**

```tsx
import { Button } from '@/components/ui/button';

interface ControlsProps {
  canAdvance: boolean;
  isDone: boolean;
  onNext: () => void;
  onReset: () => void;
}

export function Controls({ canAdvance, isDone, onNext, onReset }: ControlsProps) {
  return (
    <div className="flex justify-center gap-2">
      {isDone ? (
        <Button variant="ghost" onClick={onReset}>다시 풀기</Button>
      ) : (
        <Button onClick={onNext} disabled={!canAdvance}>다음</Button>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `npm test -- src/features/solver/ui/panels.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: narration, quiz, and controls panels\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 5: `generateAddition`, `SolveSession`, and wire `/solve/add`

**Files:**
- Create: `src/features/problems/generateAddition.ts`, `src/features/problems/generateAddition.test.ts`
- Create: `src/features/solver/SolveSession.tsx`, `src/features/solver/SolveSession.test.tsx`
- Modify: `src/routes/Solve.tsx`

- [ ] **Step 1: Write the failing test for `generateAddition`**

Create `src/features/problems/generateAddition.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateAddition } from './generateAddition';

describe('generateAddition', () => {
  it('returns an add problem with two 2-digit operands', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateAddition();
      expect(p.operation).toBe('add');
      expect(p.operands).toHaveLength(2);
      for (const n of p.operands) {
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(99);
      }
    }
  });
});
```

- [ ] **Step 2: Implement `src/features/problems/generateAddition.ts`**

```ts
import type { Problem } from '@/features/solver/steps/types';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** A 2-digit + 2-digit addition that requires a carry in the ones column (more instructive). */
export function generateAddition(): Problem {
  const a = randInt(10, 99);
  const onesA = a % 10;
  const onesB = randInt(10 - onesA === 10 ? 0 : 10 - onesA, 9); // force ones sum >= 10
  const b = randInt(1, 9) * 10 + onesB;
  return { operation: 'add', operands: [a, Math.min(b, 99)] };
}
```

- [ ] **Step 3: Run the generator test**

Run: `npm test -- src/features/problems/generateAddition.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing integration test for `SolveSession`**

Create `src/features/solver/SolveSession.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolveSession } from './SolveSession';

describe('SolveSession (18 + 24)', () => {
  it('walks setup -> ones quiz (blocks) -> correct -> reveals result', async () => {
    render(<SolveSession problem={{ operation: 'add', operands: [18, 24] }} />);

    // Setup step: narration shown, no quiz, can advance.
    expect(screen.getByText(/세로로 써요/)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // Ones ask: quiz appears, Next disabled until answered.
    expect(screen.getByText('8 + 4 = ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    await userEvent.type(screen.getByRole('spinbutton'), '7');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/힌트:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    await userEvent.clear(screen.getByRole('spinbutton'));
    await userEvent.type(screen.getByRole('spinbutton'), '12');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText(/정답이에요/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '다음' }));
    // Write step reveals the result digit 2 (data-role result).
    expect(screen.getByText('2', { selector: '[data-role="result"]' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run it to confirm it fails**

Run: `npm test -- src/features/solver/SolveSession.test.tsx`
Expected: FAIL — cannot find module `./SolveSession`.

- [ ] **Step 6: Implement `src/features/solver/SolveSession.tsx`**

```tsx
import { useMemo } from 'react';
import type { Problem } from './steps/types';
import { buildAddition } from './steps/buildAddition';
import { useSolveEngine } from './useSolveEngine';
import { WorksheetRenderer } from './WorksheetRenderer';
import { NarrationPanel } from './ui/NarrationPanel';
import { QuizPanel } from './ui/QuizPanel';
import { Controls } from './ui/Controls';

export function SolveSession({ problem }: { problem: Problem }) {
  const steps = useMemo(() => buildAddition(problem), [problem]);
  const engine = useSolveEngine(steps);
  const { current } = engine;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-xs text-muted-foreground">
        단계 {engine.index + 1} / {engine.total} · 점수 {engine.score.correct}/{engine.score.total}
      </div>

      <div className="min-h-[12rem] py-2">
        <WorksheetRenderer board={current.board} />
      </div>

      <NarrationPanel text={current.narration} />

      {current.quiz && (
        <QuizPanel
          quiz={current.quiz}
          feedback={engine.feedback}
          hint={engine.hint}
          revealedAnswer={engine.revealedAnswer}
          onSubmit={engine.submit}
        />
      )}

      <Controls
        canAdvance={engine.canAdvance}
        isDone={engine.isDone}
        onNext={engine.next}
        onReset={engine.reset}
      />
    </div>
  );
}
```

- [ ] **Step 7: Run the integration test**

Run: `npm test -- src/features/solver/SolveSession.test.tsx`
Expected: PASS.

- [ ] **Step 8: Wire `SolveSession` into `src/routes/Solve.tsx`**

Replace the file with:
```tsx
import { useParams } from '@tanstack/react-router';
import { SolveSession } from '@/features/solver/SolveSession';
import { generateAddition } from '@/features/problems/generateAddition';

const TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-xl font-bold">{TITLES[operation] ?? operation}</h1>
      {operation === 'add' ? (
        <SolveSession problem={generateAddition()} />
      ) : (
        <p className="text-muted-foreground">곧 추가됩니다 (Plan 3).</p>
      )}
    </main>
  );
}
```

> Note: the Plan 1 router test asserts the 덧셈 heading at `/solve/add`. The page now also renders a `SolveSession`; the heading assertion still holds. If the existing router test queries for anything that changed, update it minimally to keep it green.

- [ ] **Step 9: Run the full suite and build**

Run: `npm test`
Expected: PASS (all suites: cn, router, types, renderer, buildAddition, useSolveEngine, panels, generateAddition, SolveSession).

Run: `npm run build`
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: animated addition solve session wired into /solve/add\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Manual verification (end of Plan 2)

- [ ] `npm run dev`, open `/solve/add`.
- [ ] Setup worksheet shows `?? + ??` aligned with a divider; narration explains starting from the ones place; **다음** enabled.
- [ ] Click 다음 → ones quiz appears; **다음** is disabled; typing a wrong sum shows a hint and keeps it disabled; correct sum shows "정답이에요!" and enables 다음.
- [ ] Click 다음 → the ones result digit (and carry superscript, if any) animate in.
- [ ] Continue to the end → result narration shows the full sum; **다시 풀기** restarts at the setup step.
- [ ] `npm test` and `npm run build` are green.

---

## Self-Review (against the spec)

- **§4 engine** — `buildSteps` (as `buildAddition`) ✓ (T2); `WorksheetRenderer` animates the diff ✓ (T1); `useSolveEngine` state machine with quiz blocking ✓ (T3). Animation primitives: reveal (cell enter) + highlight ✓; carry persists as superscript ✓. `carryFly`/`gatherGlide`/`decomposeSplit`/`placeZero` are multiplication-only → Plan 3.
- **§5 addition** — column-by-column, carry as persistent superscript, per-place narration ✓ (T2).
- **§7 quiz** — blocking, staged hint → retry → reveal after 3, score ✓ (T3, T4).
- **§8 UI** — narration panel + quiz panel + controls + session on `/solve/add` ✓ (T4–T5). Mobile-compact layout is Plan 6.
- **§10 problem generation** — minimal `generateAddition` ✓ (T5); full pattern/verbosity matrix is Plan 4.
- **§13 testing** — exact step-sequence test for `buildAddition` ✓; engine blocking/hint/reveal/score tests ✓; renderer layout tests ✓; panel + integration tests ✓; reduced-motion path covered by renderer code (not separately tested — acceptable for this plan).
- **Placeholder scan** — every code step has complete code; no TBD/uncoded steps.
- **Type consistency** — `Cell`/`BoardState`/`Step`/`Quiz`/`Problem`/`Highlight` used as defined in Plan 1 `types.ts`; engine API (`current`, `submit`, `next`, `reset`, `canAdvance`, `isDone`, `feedback`, `hint`, `revealedAnswer`, `score`) matches across T3–T5; `WorksheetRenderer({ board })` unchanged signature.

Scope note: only addition / full verbosity ships here. Subtraction + multiplication (with the distributive tree, place-zero emphasis, and gather/merge animations) are Plan 3.
