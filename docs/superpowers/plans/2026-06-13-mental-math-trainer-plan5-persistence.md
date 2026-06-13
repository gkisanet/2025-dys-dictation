# Mental Math Trainer — Persistence & Progress (Plan 5 of 6)

> **For agentic workers:** superpowers:subagent-driven-development / executing-plans. TDD per task.

**Goal:** Persist solve results in **SQLite running in the browser (OPFS)** via `sqlocal` + Drizzle, and surface **progress** (per-stage best score, attempts, mastery) on Home / Learn / a new `/progress` page. TanStack Query manages the async data.

**Builds on:** Plans 1–4. Stages from `curriculum.ts`; `SolveSession` reports a final score.

**Scope:** persistence + progress display. NOT visual redesign (Plan 6).

---

## Architecture

- **Pluggable store.** A `ProgressStore` interface with two implementations:
  - `sqliteStore` — browser, `sqlocal` (OPFS-backed SQLite) + Drizzle. Used by the app.
  - `memoryStore` — in-memory Map. Used by tests and as an SSR/no-OPFS fallback.
  This keeps the SQLite requirement (real SQLite in the browser) while letting us unit-test the logic without OPFS in jsdom.
- **Pure progress logic** (mastery rules, aggregation) lives in `progressLogic.ts` and is fully unit-tested against `memoryStore`.
- **TanStack Query** wraps the active store (`useStageProgress`, `useAllProgress`, `useRecordAttempt`).
- `SolveSession` calls the record mutation when a run completes (final step reached), passing `{ stageId, operation, operands, quizCorrect, quizTotal }`.

## File Structure
```
src/db/schema.ts                 (Drizzle tables: attempts, progress)
src/db/client.ts                 (sqlocal + drizzle init; CREATE TABLE IF NOT EXISTS; browser-only)
src/features/progress/types.ts   (Attempt, StageProgress, ProgressStore interface)
src/features/progress/progressLogic.ts (+ .test.ts)  (mastery, fold attempts → StageProgress)
src/features/progress/memoryStore.ts   (+ .test.ts)
src/features/progress/sqliteStore.ts   (browser impl)
src/features/progress/store.ts         (selects sqlite in browser, memory otherwise)
src/features/progress/queries.ts       (TanStack Query hooks)
src/features/solver/SolveSession.tsx   (modify: record attempt on completion + show "끝!" summary)
src/routes/Progress.tsx          (new) ; src/router.tsx (add /progress) ; Home.tsx (link to /progress)
src/routes/LearnStages.tsx       (modify: show per-stage mastery badge + best score)
vite.config.ts                   (modify: optimizeDeps.exclude sqlocal; worker if needed)
```

---

## Task 1: Install sqlocal + drizzle; types + pure logic

- [ ] **Install:** `npm install sqlocal drizzle-orm`. Add to `vite.config.ts`: `optimizeDeps: { exclude: ['sqlocal'] }` (sqlocal ships a worker; excluding from prebundle avoids dev issues). Keep existing config.
- [ ] **`src/features/progress/types.ts`:**
```ts
import type { Operation } from '@/features/solver/steps/types';

export interface Attempt {
  id?: number;
  stageId: string;
  operation: Operation;
  operandA: number;
  operandB: number;
  quizCorrect: number;
  quizTotal: number;
  createdAt: number; // epoch ms
}

export interface StageProgress {
  stageId: string;
  attempts: number;
  bestScore: number;   // best quizCorrect/quizTotal as 0..1 (0 if quizTotal 0)
  lastScore: number;
  mastered: boolean;
}

export interface ProgressStore {
  recordAttempt(a: Attempt): Promise<void>;
  getAllAttempts(): Promise<Attempt[]>;
}
```
- [ ] **`src/features/progress/progressLogic.ts`:** pure functions over attempts.
```ts
import type { Attempt, StageProgress } from './types';

const ratio = (a: Attempt) => (a.quizTotal > 0 ? a.quizCorrect / a.quizTotal : 0);

/** Mastered once any attempt scores a perfect run with at least one quiz, OR
 *  best ratio >= 0.8 across >= 2 attempts. */
export function foldStage(stageId: string, attempts: Attempt[]): StageProgress {
  const mine = attempts.filter((a) => a.stageId === stageId);
  if (mine.length === 0) return { stageId, attempts: 0, bestScore: 0, lastScore: 0, mastered: false };
  const best = Math.max(...mine.map(ratio));
  const last = ratio(mine[mine.length - 1]);
  const perfect = mine.some((a) => a.quizTotal > 0 && a.quizCorrect === a.quizTotal);
  const mastered = perfect || (best >= 0.8 && mine.length >= 2);
  return { stageId, attempts: mine.length, bestScore: best, lastScore: last, mastered };
}

export function foldAll(stageIds: string[], attempts: Attempt[]): Record<string, StageProgress> {
  return Object.fromEntries(stageIds.map((id) => [id, foldStage(id, attempts)]));
}
```
- [ ] **Test `progressLogic.test.ts`:** empty → zeros, not mastered; one perfect attempt (`quizCorrect===quizTotal>0`) → mastered; two attempts best 0.8 → mastered; one 0.8 attempt → NOT mastered (needs ≥2); `bestScore`/`lastScore` correct; `foldAll` keys = stage ids. Commit.

---

## Task 2: memoryStore (+ tests) and the store selector

- [ ] **`memoryStore.ts`:** implements `ProgressStore` with an array; `recordAttempt` pushes (assigns incrementing id); `getAllAttempts` returns a copy. Export a factory `createMemoryStore()`.
- [ ] **Test `memoryStore.test.ts`:** record two attempts → `getAllAttempts` returns both in order with ids; isolation between instances.
- [ ] **`store.ts`:** `export const progressStore: ProgressStore = isBrowserWithOPFS() ? createSqliteStore() : createMemoryStore();` where `isBrowserWithOPFS()` checks `typeof navigator !== 'undefined' && 'storage' in navigator && typeof window !== 'undefined'` (sqlocal handles the worker/OPFS details; fall back to memory in tests/SSR). Keep this module side-effect-light (lazy-init the sqlite store on first call). Commit.

---

## Task 3: sqliteStore (browser, sqlocal + Drizzle)

- [ ] **`src/db/schema.ts`:** Drizzle sqlite tables:
```ts
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const attempts = sqliteTable('attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  stageId: text('stage_id').notNull(),
  operation: text('operation').notNull(),
  operandA: integer('operand_a').notNull(),
  operandB: integer('operand_b').notNull(),
  quizCorrect: integer('quiz_correct').notNull(),
  quizTotal: integer('quiz_total').notNull(),
  createdAt: integer('created_at').notNull(),
});
```
- [ ] **`src/db/client.ts`:** initialize sqlocal + drizzle and ensure the table exists.
```ts
import { SQLocalDrizzle } from 'sqlocal/drizzle';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

let dbPromise: Promise<ReturnType<typeof drizzle>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { driver, batchDriver, sql } = new SQLocalDrizzle('mental-math.sqlite3');
      await sql`CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stage_id TEXT NOT NULL, operation TEXT NOT NULL,
        operand_a INTEGER NOT NULL, operand_b INTEGER NOT NULL,
        quiz_correct INTEGER NOT NULL, quiz_total INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`;
      return drizzle(driver, batchDriver, { schema });
    })();
  }
  return dbPromise;
}
```
> The exact sqlocal/drizzle wiring may differ slightly by version — the implementer should consult the installed `sqlocal` API (it exports `SQLocalDrizzle` with `driver`/`batchDriver`/`sql`) and make `getDb()` return a working Drizzle instance backed by OPFS. If the API differs, adapt minimally to achieve: a persistent OPFS SQLite with an `attempts` table and Drizzle queries.
- [ ] **`sqliteStore.ts`:** `createSqliteStore()` implements `ProgressStore` using `getDb()` + Drizzle insert/select on `attempts` (mapping snake_case columns ↔ camelCase `Attempt`). No dedicated test (OPFS unavailable in jsdom); verified via build + manual. Commit `feat: browser OPFS SQLite store (sqlocal + drizzle)`.

---

## Task 4: TanStack Query hooks + record on completion

- [ ] **`queries.ts`:**
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { progressStore } from './store';
import { foldAll } from './progressLogic';
import type { Attempt } from './types';

const KEY = ['progress'] as const;

export function useAllProgress(stageIds: string[]) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => foldAll(stageIds, await progressStore.getAllAttempts()),
  });
}

export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Attempt) => progressStore.recordAttempt(a),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
```
- [ ] **`SolveSession`:** when the engine reaches `isDone` for the first time, fire `useRecordAttempt().mutate({ stageId, operation, operandA, operandB, quizCorrect: score.correct, quizTotal: score.total, createdAt: Date.now() })`. Use a `useRef` guard so it records once per run (and again after reset → a new attempt). Add a `stageId` prop to `SolveSession` (Solve passes `stage.id`). Show a small "오늘도 잘했어요! 점수 X/Y" summary on the done state.
  - **Test:** mock `useRecordAttempt` (or wrap in a `QueryClientProvider` with the memory store) and assert that completing a run calls record exactly once with the right score. Keep it light.
- [ ] Commit `feat: record attempts via TanStack Query on completion`.

---

## Task 5: Progress UI (Learn badges + /progress page)

- [ ] **`LearnStages.tsx`:** use `useAllProgress(stagesFor(op).map(s=>s.id))`; on each stage card show a mastery badge (lucide `CheckCircle2` when `mastered`, else a faint `Circle`) and the best score % if attempted.
- [ ] **`Progress.tsx` + route `/progress`:** list all stages grouped by operation with attempts/best/mastery; a header summary (e.g., "마스터 N / 전체 M"). Link from Home.
- [ ] **`Home.tsx`:** add a link/button to `/progress`.
- [ ] Full `npm test` + `npm run build` green (the sqlite path is excluded from tests via the memory fallback; ensure no test imports pull OPFS at module load — keep `store.ts` lazy). Commit `feat: progress badges and /progress page`.

---

## Manual verification
- Solve a stage to completion → revisit `/learn/<op>`: the stage shows a best-score % and (after a perfect run) a mastery check; reload the page → progress persists (OPFS). `/progress` summarizes all stages.
- `npm test` + `npm run build` green.

## Self-review
- §9 persistence: real browser SQLite via OPFS (sqlocal) + Drizzle, `attempts` table, repository, TanStack Query ✓. Pluggable store keeps logic unit-tested without OPFS.
- §6/§8: per-stage progress + mastery surfaced on Learn + a Progress page ✓.
- Out of scope (visual redesign) deferred to Plan 6.
- Type consistency: `Attempt`/`StageProgress`/`ProgressStore`; `progressStore`; query key `['progress']`; `SolveSession({problem, verbosity, stageId})`.
