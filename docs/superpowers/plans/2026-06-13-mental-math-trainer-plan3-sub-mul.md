# Mental Math Trainer — Subtraction + Multiplication Tree (Plan 3 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. TDD: failing test → implement → green → commit per task.

**Goal:** Working animated **subtraction** (with borrow) and **multiplication** (distributive tree: decompose → two branches → place-value-0 emphasis → gather/merge) at `/solve/sub` and `/solve/mul`, reusing the Plan 2 engine, quiz, narration, and controls.

**Builds on:** Plan 2 — `buildAddition`, `useSolveEngine`, `WorksheetRenderer` (single-region animated), panels, `SolveSession`. Types in `src/features/solver/steps/types.ts`.

**Scope:** subtraction + multiplication, full-ish (branch-level quizzes). NOT: verbosity variants, curriculum, persistence, mobile polish (Plans 4–6). Keep YAGNI.

---

## Architecture notes

- **Multi-region layout.** Multiplication uses regions `top`, `left`, `right`, `merge`. The renderer must place: `top` centered on top, `left`/`right` side-by-side in the middle, `merge` centered below, `main` centered (used by +/−). Each region remains a place-value grid (as today).
- **Gather animation via `layoutId`.** Add an optional `layoutId?: string` to `Cell`. When a partial-result cell in `left`/`right` becomes invisible at the gather step and a `merge` addend cell with the SAME `layoutId` becomes visible, Framer Motion animates the shared element across regions. Wrap the worksheet in `<LayoutGroup>`.
- **`SolveSession` becomes operation-aware:** pick the generator by `problem.operation` (`add → buildAddition`, `sub → buildSubtraction`, `mul → buildMultiplication`). Everything else (engine, panels) is unchanged.

---

## File Structure (this plan)

```
src/features/solver/steps/types.ts            (modify: add Cell.layoutId)
src/features/solver/steps/buildSubtraction.ts (create) + .test.ts
src/features/solver/steps/buildMultiplication.ts (create) + .test.ts
src/features/solver/steps/mathColumns.ts      (create: shared column helpers) + .test.ts
src/features/solver/WorksheetRenderer.tsx     (modify: regions layout + layoutId + borrow/zero styling)
src/features/solver/SolveSession.tsx          (modify: pick generator by operation)
src/features/problems/generateSubtraction.ts  (create) + .test.ts
src/features/problems/generateMultiplication.ts (create) + .test.ts
src/routes/Solve.tsx                          (modify: wire sub + mul)
```

---

## Task 1: Types + multi-region renderer + layoutId

**Files:** modify `steps/types.ts`, `WorksheetRenderer.tsx`; extend `WorksheetRenderer.test.tsx`.

- [ ] **Step 1 — types:** add `layoutId?: string;` to the `Cell` interface in `src/features/solver/steps/types.ts`. (No other type changes.)

- [ ] **Step 2 — failing renderer test:** add a test asserting (a) regions `left` and `right` render side-by-side (their container has `display:flex` / are in a row wrapper marked `data-region-row`), and (b) a cell with `layoutId` passes it through (rendered element has the layout id available — assert the cell still renders its value; layoutId is an animation detail). Use a small board with `regions: ['top','left','right','merge']` and one visible cell per region.

- [ ] **Step 3 — implement renderer changes** in `src/features/solver/WorksheetRenderer.tsx`:
  - Wrap output in `<LayoutGroup>` (from `framer-motion`).
  - Layout by region name:
    ```tsx
    // pseudostructure
    <LayoutGroup>
      <div className="flex flex-col items-center gap-3" data-testid="worksheet">
        {has('top')   && <RegionGrid region="top" .../>}
        {has('main')  && <RegionGrid region="main" .../>}
        {(has('left')||has('right')) && (
          <div className="flex items-start justify-center gap-8" data-region-row>
            {has('left')  && <RegionGrid region="left" .../>}
            {has('right') && <RegionGrid region="right" .../>}
          </div>
        )}
        {has('merge') && <RegionGrid region="merge" .../>}
      </div>
    </LayoutGroup>
    ```
    where `has(r) = board.regions.includes(r)`.
  - In `RegionGrid`, pass `layoutId={cell.layoutId}` to the `motion.div` (only when defined).
  - Styling additions in `cellClass`: role `borrow` → small blue superscript style (`text-sm text-blue-600 h-4 line-through?` no — borrow mark is the reduced value; render small blue, not struck). role styling: keep `carry` red superscript; add `borrow` → `flex items-start justify-center text-sm text-blue-600 h-4`. Highlight `zero` already maps to orange.
  - Keep `data-cell-id`/`data-role`/`data-superscript`/`data-divider` attributes. Add `data-region` on each RegionGrid wrapper.

- [ ] **Step 4:** run renderer tests green. **Step 5:** commit `feat: multi-region worksheet layout + layoutId gather support`.

---

## Task 2: Shared column helpers (`mathColumns.ts`)

Small pure helpers reused by subtraction and multiplication. **Files:** create `steps/mathColumns.ts` + `.test.ts`.

- [ ] **Implement** `src/features/solver/steps/mathColumns.ts`:
```ts
/** Digits of n, ones-first: 360 -> [0, 6, 3]. */
export const onesFirst = (n: number): number[] => String(n).split('').map(Number).reverse();

export const PLACE_NAMES = ['일', '십', '백', '천', '만'];
export const placeName = (i: number): string => PLACE_NAMES[i] ?? `10^${i}`;

/** Multiply a multi-digit number by a single digit, column by column.
 *  Returns ones-first result digits and the carry written above each column. */
export function multiplyByDigit(a: number, d: number) {
  const aD = onesFirst(a);
  const resultDigit: number[] = [];
  const carryInto: number[] = []; // carry written above column i (carryInto[0] always 0)
  let carry = 0;
  for (let i = 0; i < aD.length; i++) {
    carryInto[i] = carry;
    const s = aD[i] * d + carry;
    resultDigit[i] = s % 10;
    carry = Math.floor(s / 10);
  }
  if (carry > 0) resultDigit[aD.length] = carry; // leading digit
  return { resultDigit, carryInto, product: a * d };
}
```

- [ ] **Test** `mathColumns.test.ts`: `onesFirst(360)` → `[0,6,3]`; `multiplyByDigit(18,4)` → `resultDigit:[2,7], carryInto:[0,3], product:72`; `multiplyByDigit(18,2)` → `resultDigit:[6,3], carryInto:[0,1], product:36`. Commit `feat: shared column math helpers`.

---

## Task 3: `buildSubtraction` (with borrow)

**Files:** create `steps/buildSubtraction.ts` + `.test.ts`. Region `main`. Layout rows: 0 borrow-marks, 1 minuend (a), 2 subtrahend (−b), divider after 2, 3 result. Assume `a >= b` (generator guarantees).

Algorithm per column i (ones up), with `borrow` carried into the next column:
```ts
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
  aD.forEach((d, p) => cells.push({ id:`a-${p}`, region:'main', row:1, place:p, value:String(d), role:'operand', visible:false }));
  bD.forEach((d, p) => cells.push({ id:`b-${p}`, region:'main', row:2, place:p, value:String(d), role:'operand', visible:false }));
  cells.push({ id:'op', region:'main', row:2, place:cols, value:'−', role:'operator', visible:false });
  // borrow marks: when column i-1 borrows, show reduced value above column i (superscript, role 'borrow')
  for (let j = 1; j < cols; j++) {
    if (borrowFlag[j - 1]) cells.push({ id:`bk-${j}`, region:'main', row:0, place:j, value:String(reduced[j]), role:'borrow', superscript:true, visible:false });
  }
  for (let i = 0; i < cols; i++) cells.push({ id:`r-${i}`, region:'main', row:3, place:i, value:String(diff[i]), role:'result', visible:false });
  const dividers = [{ region:'main' as const, row:2 }];

  const boardFrom = (shown: Set<string>, hi: Record<string, NonNullable<Highlight>> = {}): BoardState => ({
    regions: ['main'], cells: cells.map(c => ({ ...c, visible: shown.has(c.id), highlight: hi[c.id] ?? null })), dividers,
  });

  const steps: Step[] = [];
  const shown = new Set<string>();
  aD.forEach((_, p) => shown.add(`a-${p}`));
  bD.forEach((_, p) => shown.add(`b-${p}`));
  shown.add('op');
  steps.push({ id:'setup', kind:'setup', narration:'세로로 맞춰 쓰고, 일의 자리부터 빼요.', board: boardFrom(shown) });

  for (let i = 0; i < cols; i++) {
    const need = borrowFlag[i];
    // borrow step (only when needed): reveal the borrow mark above the next column
    if (need) {
      if (cells.some(c => c.id === `bk-${i + 1}`)) shown.add(`bk-${i + 1}`);
      steps.push({
        id:`borrow-${i}`, kind:'borrow',
        narration:`${placeName(i)}의 자리: ${aD[i]} 에서 ${bD[i] ?? 0} 를 뺄 수 없어요. 윗자리에서 10을 빌려와 ${topUsed[i]} 로 만들어요.`,
        board: boardFrom(shown, { [`a-${i}`]:'now', ...(cells.some(c=>c.id===`bk-${i+1}`)?{[`bk-${i+1}`]:'now' as const}:{}) }),
      });
    }
    const expr = `${topUsed[i]} - ${bD[i] ?? 0}`;
    steps.push({
      id:`ask-${i}`, kind:'digit-op',
      narration:`${placeName(i)}의 자리를 빼요: ${expr}.`,
      board: boardFrom(shown, { [`a-${i}`]:'now', [`b-${i}`]:'now' }),
      quiz: { prompt:`${expr} = ?`, answer: diff[i], hints:[ `${placeName(i)}의 자리끼리 빼요${need?' (빌려온 10 포함)':''}.`, `${expr} 를 계산해보세요.` ] },
    });
    shown.add(`r-${i}`);
    steps.push({ id:`write-${i}`, kind:'sum', narration:`${diff[i]} 를 ${placeName(i)}의 자리에 써요.`, board: boardFrom(shown) });
  }
  steps.push({ id:'result', kind:'result', narration:`다 뺐어요! ${a} - ${b} = ${a - b}.`, board: boardFrom(shown) });
  return steps;
}
```

- [ ] **Tests** `buildSubtraction.test.ts`: for `52 - 28` (ones borrow: 2<8): ids `['setup','borrow-0','ask-0','write-0','ask-1','write-1','result']`; `ask-0` quiz `{prompt:'12 - 8 = ?', answer:4}`; borrow mark `bk-1` value `'4'` (5→4) visible from `borrow-0`; `ask-1` quiz `{prompt:'4 - 2 = ?', answer:2}`; result narration contains `24`. For `48 - 13` (no borrow): no `borrow-*` steps; `ask-0` `{prompt:'8 - 3 = ?', answer:5}`. Commit.

---

## Task 4: `buildMultiplication` (distributive tree)

**Files:** create `steps/buildMultiplication.ts` + `.test.ts`. For 2-digit `a` × 2-digit `b` (b = tensB·10 + onesB). Regions `top`,`left`,`right`,`merge`. Branch results displayed with carries; quizzes at decompose / each partial / final sum. Use `multiplyByDigit`.

Region row models (each its own place-value grid):
- **top:** row0 `a`(2 digits) ; row1 `× b`(operator + 2 digits).
- **left (a × onesB):** row0 carry superscripts; row1 `a`; row2 `× onesB`(op+digit); divider; row3 result P1 digits. `layoutId` on each P1 result digit = `p1-${place}`.
- **right (a × tensB0):** row0 carry; row1 `a`; row2 `× tensB`(op+digit) — narrate the ×10/append-0; divider; row3 result P2 digits, the ones digit is the place-zero (`role:'zero-placeholder'`, highlight `zero`). `layoutId` on each P2 result digit = `p2-${place}`.
- **merge:** row0 carry; row1 addend1 = P1 (each digit `layoutId p1-${place}`); row2 `+` addend2 = P2 (each digit `layoutId p2-${place}`); divider; row3 final result.

Steps (full):
1. `setup` (top: a × b).
2. `decompose` — narration "24는 20과 4가 합쳐진 수. 18×4 와 18×20 으로 나눠 곱한 뒤 더해요." highlight top b digits. quiz `{prompt:'24 = 20 + ?', answer: onesB}`. (Skip the decompose quiz if onesB makes it trivial? keep it.)
3. `left-ask` — narration "왼쪽: a × onesB." reveal left `a` and `× onesB`. quiz `{prompt:'18 × 4 = ?', answer: a*onesB}`.
4. `left-write` — reveal left divider + P1 digits + carries. narration explaining digit products+carry (e.g., "8×4=32 → 2, 올림 3; 1×4+3=7 → 72").
5. `right-zero` — narration "오른쪽: a × 20. 20은 ×10이라 일의 자리에 0을 먼저 놓아요." reveal right `a`, `× tensB`, divider, and the place-zero result-ones cell (role zero-placeholder, highlight zero).
6. `right-ask` — quiz `{prompt:'18 × 2 = ?', answer: a*tensB}`.
7. `right-write` — reveal remaining P2 digits + carries. narration "18×2=36, 뒤에 0 붙여 360."
8. `gather` — narration "이제 두 결과를 가운데로 모아 더해요." Make left/right P1,P2 result cells invisible and merge addend cells (same layoutIds) visible → they glide. reveal merge addends + operator + divider.
9. `sum-ask` — quiz `{prompt:'72 + 360 = ?', answer: a*b}`.
10. `result` — reveal merge final digits + carry. narration `18 × 24 = 432`.

Implementation must compute P1=a*onesB, P2=a*tensB*10, final=a*b, and lay out all region cells with correct places, then toggle visibility per step (cumulative within regions; at `gather` toggle branch results off and merge addends on). Provide a thorough test.

- [ ] **Tests** `buildMultiplication.test.ts` for `18 × 24`:
  - step ids exactly `['setup','decompose','left-ask','left-write','right-zero','right-ask','right-write','gather','sum-ask','result']`.
  - `decompose.quiz` = `{prompt:'24 = 20 + ?', answer:4}` (hints any).
  - `left-ask.quiz.answer` = 72; `right-ask.quiz.answer` = 36; `sum-ask.quiz.answer` = 432.
  - after `left-write`, left region shows P1 digits `7,2` (find cells `region==='left' && role==='result'` → values `['7','2']` ones-first or by place) and a carry cell value `3`.
  - `right-zero` makes the right result ones cell visible with `role==='zero-placeholder'` and `highlight==='zero'`, value `'0'`.
  - at `gather`, left/right result cells are NOT visible and merge addend cells ARE visible with matching `layoutId` (`p1-0`,`p1-1`,`p2-0`,`p2-1`,`p2-2`).
  - `result` reveals merge final digits whose concatenation = `432`.
  - Add a lighter check for `13 × 12` (final correctness: sum-ask.answer = 156, P1=26, P2=130).
  - Commit `feat: buildMultiplication distributive tree`.

> The implementer may adjust exact narration wording, but step **ids**, **quiz answers**, **roles/highlights**, and **layoutIds** above are contractual (the tests assert them).

---

## Task 5: Generators + wire SolveSession & routes

**Files:** create `generateSubtraction.ts`(+test), `generateMultiplication.ts`(+test); modify `SolveSession.tsx`, `Solve.tsx`.

- [ ] **`generateSubtraction`**: two 2-digit operands with `a >= b`, biased to require a borrow (ensure `a%10 < b%10` sometimes / at least valid). Test: returns `op 'sub'`, both in [10,99], `operands[0] >= operands[1]`.
- [ ] **`generateMultiplication`**: two 2-digit operands (10–99). Test: `op 'mul'`, both in [10,99].
- [ ] **`SolveSession`**: replace the hardcoded `buildAddition` with a dispatch:
  ```ts
  const steps = useMemo(() => {
    switch (problem.operation) {
      case 'add': return buildAddition(problem);
      case 'sub': return buildSubtraction(problem);
      case 'mul': return buildMultiplication(problem);
    }
  }, [problem]);
  ```
  Keep everything else identical. Existing `SolveSession.test.tsx` (addition) must still pass.
- [ ] **`Solve.tsx`**: generate the right problem per operation (stable `useState`), render `SolveSession` for `add`/`sub`/`mul`:
  ```tsx
  const [problem] = useState(() => {
    switch (operation) {
      case 'sub': return generateSubtraction();
      case 'mul': return generateMultiplication();
      default: return generateAddition();
    }
  });
  return <SolveSession problem={problem} />; // for all three
  ```
- [ ] **Integration test** `SolveSession` for `mul` `18×24`: walk to `left-ask`, submit wrong → hint, submit 72 → correct; continue to `sum-ask`, submit 432 → correct; `result` shows 432; assert `다시 풀기` at the end.
- [ ] Run full `npm test` + `npm run build` green. Commit `feat: subtraction + multiplication wired into solve routes`.

---

## Manual verification
- `/solve/sub`: borrow shown as a small blue mark above the next column; quizzes block; result correct.
- `/solve/mul`: 18×24 splits into 18×4 / 18×20 side-by-side, place-zero emphasized, partials gather into the merge and add to 432, all quiz-gated.
- `npm test` + `npm run build` green.

## Self-review
- §5 subtraction (borrow) ✓, §5 multiplication distributive tree + place-zero + gather ✓ (Tasks 3–4).
- Engine/quiz reused unchanged ✓. Renderer multi-region + layoutId ✓ (Task 1).
- Out of scope (verbosity/curriculum/persistence/mobile) NOT added.
- Type consistency: `Cell.layoutId` added; generators return `Step[]` per `types.ts`; `SolveSession` dispatch covers all three operations.
