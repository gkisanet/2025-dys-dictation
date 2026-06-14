# Mental Math Trainer — Curriculum, Levels & Verbosity (Plan 4 of 6)

> **For agentic workers:** superpowers:subagent-driven-development / executing-plans. TDD per task.

**Goal:** A level system: pick an operation → choose a curriculum **stage** (difficulty pattern × verbosity) → solve. Adds the user-requested **× multiple-of-10 middle level** (single-branch place-zero), the three **verbosity** modes (full / partial / answer), pattern-based problem generation, and stage-selection routing.

**Builds on:** Plans 1–3 (`buildAddition/Subtraction/Multiplication`, `useSolveEngine`, `SolveSession`, generators, router). Types in `steps/types.ts` (`Verbosity = 'full'|'partial'|'answer'` already exists).

**Scope:** curriculum + verbosity + patterns + the ×10 single-branch multiply + stage screens. NOT persistence (Plan 5) or visual polish (Plan 6).

---

## File Structure
```
src/features/solver/steps/verbosity.ts            (create) + .test.ts
src/features/solver/steps/buildMultiplication.ts  (modify: onesB===0 single-branch path) + test additions
src/features/problems/generateProblem.ts          (create: pattern-based) + .test.ts
src/features/curriculum/curriculum.ts             (create: stages) + .test.ts
src/features/solver/SolveSession.tsx              (modify: accept `verbosity`, apply it)
src/routes/LearnStages.tsx                        (create: stage cards)
src/routes/Solve.tsx                              (modify: look up stage, pass verbosity)
src/routes/Home.tsx                               (modify: link to /learn/$operation)
src/router.tsx                                    (modify: add /learn/$operation, /solve/$operation/$stageId)
```

---

## Task 1: `applyVerbosity`

Pure transform over full steps. **Files:** `steps/verbosity.ts` + test.

```ts
import type { Problem, Quiz, Step } from './types';

const SIGN = { add: '+', sub: '−', mul: '×' } as const;
const finalAnswer = (p: Problem) => {
  const [a, b] = p.operands;
  return p.operation === 'add' ? a + b : p.operation === 'sub' ? a - b : a * b;
};

/**
 * full    → every checkpoint quiz (unchanged).
 * partial → keep only the FIRST quiz (one checkpoint); other steps auto-advance.
 * answer  → setup + a single "a ∘ b = ?" quiz + result (no process).
 */
export function applyVerbosity(full: Step[], problem: Problem): Record<'full' | 'partial' | 'answer', Step[]> & { of: (v: Problem['operation'] extends never ? never : 'full' | 'partial' | 'answer') => Step[] } {
  throw new Error('use applyVerbosityFor');
}

export function applyVerbosityFor(full: Step[], verbosity: 'full' | 'partial' | 'answer', problem: Problem): Step[] {
  if (verbosity === 'full') return full;

  const [a, b] = problem.operands;
  const quiz: Quiz = {
    prompt: `${a} ${SIGN[problem.operation]} ${b} = ?`,
    answer: finalAnswer(problem),
    hints: ['배운 과정을 떠올려 최종 답을 구해보세요.', `${a} ${SIGN[problem.operation]} ${b} 를 계산하면?`],
  };

  if (verbosity === 'partial') {
    let kept = false;
    return full.map((s) => {
      if (s.quiz && !kept) { kept = true; return s; }
      return { ...s, quiz: undefined };
    });
  }

  // answer
  const setup: Step = { ...full[0], quiz: undefined };
  const ask: Step = { id: 'final-ask', kind: 'digit-op', narration: '바로 답을 구해보세요.', board: setup.board, quiz };
  const result: Step = { ...full[full.length - 1] };
  return [setup, ask, result];
}
```
> Drop the broken `applyVerbosity` stub above — keep only `applyVerbosityFor`. (Written this way so the implementer doesn't accidentally export two names; export ONLY `applyVerbosityFor`.)

- [ ] **Tests:** `full` returns same array; `partial` → exactly one step has a `quiz` (the first that had one); `answer` → length 3, `steps[1].quiz` = `{prompt:'18 + 24 = ?', answer:42, ...}`, `steps[0].id==='setup'`, last step is the original result. Commit `feat: verbosity transform`.

---

## Task 2: × multiple-of-10 single branch (the middle level)

When `b % 10 === 0` (e.g., 18 × 20), the two-branch tree is degenerate. Produce a **single-region** place-zero animation instead. **Files:** modify `buildMultiplication.ts`; add tests.

In `buildMultiplication`, branch at the top: `if (onesB === 0) return buildMultiplyByTen(problem);` else the existing two-branch tree.

`buildMultiplyByTen({operands:[a,b]})` — region `main`. `tensB = b/10`. Rows: 0 carry, 1 `a`, 2 `× b`(op + 2 digits), divider, 3 result. Result = `a*b` (= a*tensB*10). The ones result cell is the place-zero (`role:'zero-placeholder'`, highlight `zero`, value `'0'`). Use `multiplyByDigit(a, tensB)` for the shifted digits.

Steps:
1. `setup` — reveal `a`, `× b`.
2. `place-zero` — narration "b는 ×10이라 일의 자리에 0을 먼저 놓아요." reveal result ones `0` (zero highlight). quiz optional: none.
3. `ask` — narration "이제 a × tensB 를 구해 그 앞에 놓아요." quiz `{prompt:'18 × 2 = ?', answer:a*tensB}`. highlight the b tens digit.
4. `write` — reveal the shifted product digits + carries. narration "18×2=36, 뒤에 0 붙여 360."
5. `result` — narration `a × b = a*b`.

Step ids: `['setup','place-zero','ask','write','result']`.

- [ ] **Tests** (add to `buildMultiplication.test.ts`): `18 × 20` → ids above; `ask.quiz` `{answer:36}`; result digits concatenate to `360`; the ones result cell has `role:'zero-placeholder'` + `highlight:'zero'` and is the only `0` placeholder. Keep the existing 2-branch `18×24` tests passing (now reached only when `onesB!==0`). Commit `feat: single-branch × multiple-of-10 (place-zero) level`.

---

## Task 3: Pattern-based `generateProblem`

**Files:** `problems/generateProblem.ts` + test. A `Pattern` selects operand ranges; reuse helpers.

```ts
import type { Operation, Problem } from '@/features/solver/steps/types';

export type Pattern =
  | 'add-nocarry' | 'add-carry' | 'add-3digit'
  | 'sub-noborrow' | 'sub-borrow' | 'sub-3digit'
  | 'mul-byten' | 'mul-2x2';

const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateProblem(pattern: Pattern): Problem {
  switch (pattern) {
    case 'add-nocarry': { // each column sum < 10
      const a = r(11, 44), b = r(11, 44);
      // adjust ones so no carry; simplest: regenerate-free construction
      const oa = a % 10, ta = Math.floor(a / 10);
      const ob = r(0, 9 - oa), tb = r(1, 9 - ta < 1 ? 1 : 9 - ta);
      return { operation: 'add', operands: [ta * 10 + oa, Math.min(tb, 9) * 10 + ob] };
    }
    case 'add-carry': { const oa = r(1, 9); return { operation: 'add', operands: [r(1,9)*10+oa, r(1,9)*10 + r(10-oa,9)] }; }
    case 'add-3digit': return { operation: 'add', operands: [r(100, 999), r(100, 999)] };
    case 'sub-noborrow': { const a = r(20, 99); const b = r(10, a); /* may borrow */ return { operation: 'sub', operands: [Math.max(a,b), Math.min(a,b)] }; }
    case 'sub-borrow': { const oa = r(0, 8); const a = r(2,9)*10+oa; const b = r(1, Math.floor(a/10)-1)*10 + r(oa+1,9); return { operation:'sub', operands:[a, b] }; }
    case 'sub-3digit': { const a = r(300, 999), b = r(100, a); return { operation:'sub', operands:[a, b] }; }
    case 'mul-byten': return { operation: 'mul', operands: [r(11, 99), r(1, 9) * 10] };
    case 'mul-2x2': return { operation: 'mul', operands: [r(11, 99), r(1, 9) * 10 + r(1, 9)] };
  }
}
```
> The implementer should make the constraints actually hold (e.g., `add-nocarry` truly no carry; `sub-borrow` truly borrows; `mul-byten` ones digit 0; `sub-*` always `a >= b`). Adjust the arithmetic above if a case can violate its invariant — the tests below enforce the invariants, so make them pass reliably over many iterations.

- [ ] **Tests** `generateProblem.test.ts`: 100 iterations each — `add-nocarry`: `(oa+ob)<10` and no tens carry; `add-carry`: ones carry; `sub-borrow`: `a>=b` and `a%10 < b%10`; `sub-*`: `a>=b`; `mul-byten`: `operands[1]%10===0`; `mul-2x2`: `operands[1]%10!==0`; all operands within their stated digit ranges. Commit.

---

## Task 4: Curriculum stages

**Files:** `curriculum/curriculum.ts` + test.

```ts
import type { Operation, Verbosity } from '@/features/solver/steps/types';
import type { Pattern } from '@/features/problems/generateProblem';

export interface Stage {
  id: string;            // unique, URL-safe
  operation: Operation;
  pattern: Pattern;
  verbosity: Verbosity;
  title: string;
  subtitle: string;
}

export const STAGES: Stage[] = [
  // 덧셈
  { id: 'add-1', operation: 'add', pattern: 'add-nocarry', verbosity: 'full',    title: '받아올림 없는 덧셈', subtitle: '두 자리 · 모든 단계' },
  { id: 'add-2', operation: 'add', pattern: 'add-carry',   verbosity: 'full',    title: '받아올림 덧셈',      subtitle: '두 자리 · 모든 단계' },
  { id: 'add-3', operation: 'add', pattern: 'add-carry',   verbosity: 'partial', title: '받아올림 덧셈 (부분)', subtitle: '핵심만 질문' },
  { id: 'add-4', operation: 'add', pattern: 'add-3digit',  verbosity: 'full',    title: '세 자리 덧셈',       subtitle: '세 자리 · 모든 단계' },
  { id: 'add-5', operation: 'add', pattern: 'add-carry',   verbosity: 'answer',  title: '덧셈 암산',         subtitle: '답만 입력' },
  // 뺄셈
  { id: 'sub-1', operation: 'sub', pattern: 'sub-noborrow', verbosity: 'full',   title: '받아내림 없는 뺄셈', subtitle: '두 자리 · 모든 단계' },
  { id: 'sub-2', operation: 'sub', pattern: 'sub-borrow',   verbosity: 'full',   title: '받아내림 뺄셈',     subtitle: '두 자리 · 모든 단계' },
  { id: 'sub-3', operation: 'sub', pattern: 'sub-borrow',   verbosity: 'partial', title: '받아내림 뺄셈 (부분)', subtitle: '핵심만 질문' },
  { id: 'sub-4', operation: 'sub', pattern: 'sub-3digit',   verbosity: 'full',   title: '세 자리 뺄셈',      subtitle: '세 자리 · 모든 단계' },
  { id: 'sub-5', operation: 'sub', pattern: 'sub-borrow',   verbosity: 'answer', title: '뺄셈 암산',        subtitle: '답만 입력' },
  // 곱셈
  { id: 'mul-1', operation: 'mul', pattern: 'mul-byten', verbosity: 'full',    title: '몇십 곱하기',       subtitle: '× 20·30·40 · 자리수 0' },
  { id: 'mul-2', operation: 'mul', pattern: 'mul-2x2',   verbosity: 'full',    title: '두 자리 곱셈',      subtitle: '분배해서 풀기 · 모든 단계' },
  { id: 'mul-3', operation: 'mul', pattern: 'mul-2x2',   verbosity: 'partial', title: '두 자리 곱셈 (부분)', subtitle: '핵심만 질문' },
  { id: 'mul-4', operation: 'mul', pattern: 'mul-2x2',   verbosity: 'answer',  title: '곱셈 암산',        subtitle: '답만 입력' },
];

export const stagesFor = (op: Operation): Stage[] => STAGES.filter((s) => s.operation === op);
export const getStage = (id: string): Stage | undefined => STAGES.find((s) => s.id === id);
```

- [ ] **Tests**: every stage id unique; `stagesFor('mul')` returns the 4 mul stages in order; `getStage('add-3')?.verbosity === 'partial'`; every stage's `pattern` prefix matches its `operation`. Commit.

---

## Task 5: Wire verbosity into SolveSession; add /learn and stage routes

**Files:** modify `SolveSession.tsx`, `router.tsx`, `Home.tsx`, `Solve.tsx`; create `LearnStages.tsx`.

- [ ] **`SolveSession`**: add prop `verbosity: Verbosity` (default `'full'`). After building full steps, apply `applyVerbosityFor(full, verbosity, problem)` and feed that to `useSolveEngine`. Existing addition test passes a default → still green.
- [ ] **`router.tsx`**: add routes `/learn/$operation` → `LearnStages`, and change/add `/solve/$operation/$stageId` → `Solve`. (Keep `/solve/$operation` working OR migrate Home/links to the stage route. Prefer the stage route as canonical.)
- [ ] **`LearnStages.tsx`**: read `operation` param, render `stagesFor(operation)` as a vertical list of cards (title, subtitle, a lucide chevron), each `<Link to="/solve/$operation/$stageId" params={{operation, stageId: s.id}}>`. A back link to `/`.
- [ ] **`Home.tsx`**: the three operation cards link to `/learn/$operation` (params) instead of `/solve/...`.
- [ ] **`Solve.tsx`**: read `operation` + `stageId`; `const stage = getStage(stageId)`; `const [problem] = useState(() => generateProblem(stage.pattern))`; render `<SolveSession problem={problem} verbosity={stage.verbosity} />` with the stage title as the heading. Handle unknown stage gracefully (redirect or message).
- [ ] **Integration test** (`SolveSession` or a route test): a `partial` stage shows exactly one quiz across the run; an `answer` stage shows the worksheet setup then a single `a + b = ?` quiz then the result. Update the Plan 1 router test if route shapes changed (keep it green).
- [ ] Full `npm test` + `npm run build` green. Commit `feat: curriculum stages, verbosity wiring, learn/stage routes`.

---

## Manual verification
- `/` → pick 곱셈 → `/learn/mul` shows 4 stages → pick 몇십 곱하기 → `/solve/mul/mul-1` runs an `18×20`-style single-branch place-zero animation; pick 두 자리 곱셈 → full tree; pick 곱셈 암산 → just asks `a × b = ?`.
- Verbosity behaves: full = quiz each checkpoint; partial = one checkpoint; answer = single final quiz.
- `npm test` + `npm run build` green.

## Self-review
- §6 levels: two axes (pattern × verbosity) via stages ✓; user-requested ×10 middle level ✓ (Task 2); §10 pattern generation ✓ (Task 3).
- Engine/quiz reused; verbosity is a pure pre-transform ✓.
- Out of scope (persistence, polish) not added.
- Type consistency: `Verbosity` from types.ts; `Pattern`/`Stage`/`getStage`/`stagesFor`; `SolveSession({problem, verbosity})`; routes `/learn/$operation`, `/solve/$operation/$stageId`.
