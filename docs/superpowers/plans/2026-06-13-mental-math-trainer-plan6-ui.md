# Mental Math Trainer — Real Learning-App UI (Plan 6 of 6)

> **For agentic workers:** superpowers:subagent-driven-development / executing-plans.

**Goal:** Make it look and feel like a polished, friendly, **mobile-first learning app**: an app shell with header + mobile bottom nav, a warm theme with per-operation accent colors, card-based screens with progress, a focused responsive solve screen (scalable worksheet, sticky bottom quiz, big touch controls), a celebratory completion screen, and a polished progress dashboard.

**Builds on:** Plans 1–5 (all functionality complete). This plan is **presentation only** — do NOT change engine/generator/persistence logic or any step/quiz behavior. **Preserve all test-relevant text, roles, labels, and `data-*` attributes** (e.g. button names `다음`/`확인`/`다시 풀기`, quiz prompts, `data-role="result"`, headings the router tests assert) so the existing 130 tests keep passing.

**Scope:** visual/layout/responsive only. Keep it accessible and respect `prefers-reduced-motion` (already honored in the renderer).

---

## Design system

**Theme (extend `src/index.css`):** a soft, friendly palette. Light neutral background (`oklch(0.98 0.01 250)`), card surface white, rounded-2xl, soft shadows. Per-operation accents:
- add → sky/blue (`#0ea5e9`), sub → emerald (`#10b981`), mul → violet (`#8b5cf6`).
Expose them as CSS vars `--op-add`, `--op-sub`, `--op-mul` and a helper `opAccent(operation)` returning Tailwind classes. Friendly rounded sans (system stack is fine); larger touch targets (min h-12) on interactive elements.

**New primitives in `src/components/ui/`** (hand-written, shadcn-style, using `cn`):
- `card.tsx` — `Card`, `CardHeader`, `CardTitle`, `CardContent` (rounded-2xl, border, subtle shadow, `bg-card`).
- `badge.tsx` — small pill (`variant: default|success|muted`).
- `progress-bar.tsx` — `<ProgressBar value={0..1} />` a rounded track + fill (accent color via prop).

---

## Task 1: Theme + UI primitives + AppShell

**Files:** modify `src/index.css`; create `components/ui/{card,badge,progress-bar}.tsx`, `components/AppShell.tsx`; modify `src/router.tsx` (root route renders AppShell).

- [ ] Extend `index.css` with the palette, `--card`, `--op-*` vars, and `@theme inline` mappings; nicer base typography; a subtle page background.
- [ ] Create the three UI primitives.
- [ ] Create `AppShell`: a max-w-screen-sm centered column on mobile, comfortable on desktop. Top header: app mark (lucide `Brain` or `Calculator`) + “암산 학습”, and on desktop a right-side link to `/progress`. A **mobile bottom navigation bar** (fixed, `sm:hidden`) with two items: Home (`/`, lucide `House`) and 진도 (`/progress`, lucide `ChartColumn`), active state by current route. Content area renders `<Outlet/>` with bottom padding so the nav doesn’t overlap.
- [ ] `router.tsx`: root route `component` renders `<AppShell><Outlet/></AppShell>` (AppShell can render `<Outlet/>` itself). Keep all existing routes. Ensure router tests still find their headings (AppShell adds chrome but keeps page headings).
- [ ] Smoke test for AppShell (renders header brand text). Commit `feat: theme, UI primitives, app shell + mobile nav`.

---

## Task 2: Home dashboard

**Files:** rewrite `src/routes/Home.tsx`.

- [ ] A warm hero: greeting (“오늘도 암산 연습해요 👋”) + one-line subtitle. 
- [ ] Three large operation cards (덧셈/뺄셈/곱셈), each in its accent color, with a lucide icon, the count of mastered stages (`useAllProgress()` → count `mastered` among `stagesFor(op)`), and a small `ProgressBar`. Tapping a card → `/learn/$operation`.
- [ ] A “학습 진도 보기” secondary link/card → `/progress`.
- [ ] Keep an `h1` containing “암산 학습”? The router test asserts the home heading — keep a heading the test can find (check `router.test.tsx`; if it asserts `'암산 학습'` keep that text somewhere as a heading, or update the test minimally if you intentionally change the brand heading — preferred: keep it). 
- [ ] Responsive: cards stack on narrow, grid on wider. Commit `feat: home dashboard`.

---

## Task 3: Learn (stage list) redesign

**Files:** rewrite `src/routes/LearnStages.tsx` (keep `useAllProgress()` usage from Plan 5).

- [ ] Operation-accented header with a back affordance (lucide `ChevronLeft` → `/`).
- [ ] Stage cards (use `Card`): title, subtitle, a mastery badge (`CheckCircle2` filled accent when mastered, faint `Circle` otherwise) and best-score % when attempted (`progress?.[s.id]`). Whole card is a `Link` to `/solve/$operation/$stageId`, with a trailing `ChevronRight`.
- [ ] Handle unknown operation gracefully (message + back link).
- [ ] Commit `feat: learn stage list redesign`.

---

## Task 4: Solve screen redesign (mobile-compact) — SolveSession + Solve

**Files:** rewrite the LAYOUT of `src/features/solver/SolveSession.tsx` and `src/routes/Solve.tsx`. Do NOT change engine wiring, the `WorksheetRenderer` internals, or any quiz/control behavior — only restructure/style the surrounding layout. **Preserve** the `다음`/`확인`/`다시 풀기` button labels, quiz prompt text, `data-role` attrs, and the score text format the tests rely on (adjust tests only if strictly necessary and keep them green).

- [ ] **Sticky top bar:** stage title + a thin step `ProgressBar` (`(index+1)/total`) + score chip “⭐ correct/total”.
- [ ] **Worksheet stage:** centered, on a soft card; **scale-to-fit width** so big multiplication trees never overflow on phones — wrap `WorksheetRenderer` in a container that scales down when it would exceed the viewport width (e.g., measure and apply CSS `transform: scale(...)`, or a CSS `max-width:100%; overflow-x:auto` fallback with `origin-top`). Keep it simple and robust; horizontal scroll is an acceptable fallback if scaling is fiddly.
- [ ] **Narration** as a friendly speech bubble (rounded, accent left-border, a small lucide `Sparkles`/`Lightbulb`).
- [ ] **Quiz** as a prominent card; on mobile make it **sticky to the bottom** (a bottom sheet feel) with a large input and a full-width `확인`. The `다음` control is a large full-width button when no quiz/after resolved.
- [ ] **Completion state:** when `isDone`, show a celebratory summary card — 🎉, “잘했어요!”, score X/Y with a `ProgressBar`, and buttons: `다시 풀기` (reset) and a `다음 단계` link (next stage in `stagesFor(op)` after this one, if any) + a `홈으로` link. Keep the `다시 풀기` button (tests assert it) and keep the attempt-recording behavior from Plan 5 intact.
- [ ] `Solve.tsx`: pass through; ensure the stage title shows; keep `stageId`/`verbosity` wiring.
- [ ] Commit `feat: mobile-compact solve screen with completion celebration`.

---

## Task 5: Progress dashboard polish + final pass

**Files:** rewrite `src/routes/Progress.tsx`.

- [ ] Header “학습 진도” (keep this heading — the router test asserts it). A summary row: total mastered / total stages with a big `ProgressBar`.
- [ ] Group by operation (accent section headers); each stage as a row/card with mastery badge, best %, attempts count, and a `Link` to play it.
- [ ] Empty state (no attempts yet): friendly “아직 기록이 없어요. 첫 학습을 시작해요!” with a link home.
- [ ] **Final pass:** run the full suite + build; click through `npm run dev` mentally against the manual checklist; ensure `prefers-reduced-motion` still yields instant reveals; ensure no horizontal overflow on a 360px-wide viewport for the `18×24` multiplication tree (scale-to-fit or scroll).
- [ ] Commit `feat: progress dashboard polish`.

---

## Manual verification
- Phone-width (360px): Home cards, stage lists, and the solve screen all fit with no broken horizontal overflow; quiz sits at the bottom; big tap targets; bottom nav works.
- Desktop: comfortable centered layout, header nav.
- A full multiplication run shows the tree scaled to fit; completion screen celebrates and offers next stage; progress reflects the run after reload (OPFS).
- `npm test` (130+) and `npm run build` green.

## Self-review
- §8 mobile-compact + real-app polish across all screens ✓; per-operation theming, app shell + bottom nav, completion celebration, progress dashboard ✓.
- No logic changed — engine/generators/persistence untouched; test-relevant text/roles/labels preserved.
- `prefers-reduced-motion` respected.
