# Mental Math Trainer — Foundation Implementation Plan (Plan 1 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old dictation app with a running TypeScript + Tailwind/shadcn + TanStack Router/Query scaffold that renders a static arithmetic worksheet from a declarative `BoardState`.

**Architecture:** Greenfield rebuild in the same repo. Code-based TanStack Router with a Query provider. A pure `BoardState`/`Step` type model describes the worksheet; a static `WorksheetRenderer` draws it (animation comes in Plan 2). Everything is unit-tested with Vitest.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`), shadcn-style components (`cn` + CVA), lucide-react, TanStack Router, TanStack Query, Framer Motion (installed, used in Plan 2), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-13-mental-math-trainer-design.md`

---

## Plan Roadmap (the rebuild is split into 6 sequential plans)

1. **Foundation (this plan)** — stack scaffold, remove old app, routing/query shell, type model, static worksheet renderer.
2. **Solver engine + Addition** — `useSolveEngine` state machine, Framer Motion animation primitives (reveal/carryFly/highlight), `buildAddition` step generator, blocking quiz, working `/solve/add` session.
3. **Subtraction + Multiplication** — `buildSubtraction` (borrow), `buildMultiplication` (distributive tree: decompose → branch regions → place-zero emphasis → gather/merge).
4. **Curriculum & Levels** — problem patterns (M1..M4 etc.), verbosity (full/partial/answer), `generateProblem`, stage selection screens, mastery gating.
5. **Persistence** — wa-sqlite + OPFS + Drizzle, repositories, TanStack Query wiring, progress/stats screens.
6. **Mobile-compact polish** — responsive solve layout (bottom-sheet quiz, scale-to-fit worksheet, tree reflow), reduced-motion.

Each plan ends with working, testable software. Write the next plan only after the current one is green.

---

## File Structure (created in this plan)

```
package.json                     (modify: deps, scripts, name, type)
tsconfig.json / tsconfig.node.json (create)
vite.config.ts                   (create; delete vite.config.js)
vitest.setup.ts                  (create)
index.html                       (modify: entry → main.tsx, title, lang)
src/
  main.tsx                       (create; delete main.jsx)
  index.css                      (modify: Tailwind v4 + theme vars)
  router.tsx                     (create: code-based route tree)
  routes/
    Home.tsx                     (create)
    Solve.tsx                    (create)
  lib/utils.ts                   (create: cn)
  components/ui/button.tsx       (create: shadcn-style Button)
  features/solver/
    steps/types.ts               (create: Step/BoardState model)
    WorksheetRenderer.tsx        (create: static renderer)
    sampleBoards.ts              (create: fixture board for /solve + tests)
```
Deleted: `src/App.jsx`, `src/App.css`, `src/main.jsx`, `src/components/{LevelSelector,Game,Question,Results}.jsx`, `src/data/dictationData.js`, `src/assets/react.svg`, `vite.config.js`, `pnpm-lock.yaml`.

---

## Task 1: Standardize package manager and install dependencies

**Files:**
- Modify: `package.json`
- Delete: `pnpm-lock.yaml`

- [ ] **Step 1: Remove the duplicate lockfile (standardize on npm)**

Run:
```bash
rm -f pnpm-lock.yaml
```

- [ ] **Step 2: Install runtime dependencies**

Run:
```bash
npm install @tanstack/react-router @tanstack/react-query framer-motion lucide-react class-variance-authority clsx tailwind-merge
```
Expected: completes without error; these appear under `dependencies` in `package.json`.

- [ ] **Step 3: Install dev dependencies (TypeScript, Tailwind v4, Vitest, Testing Library)**

Run:
```bash
npm install -D typescript @types/react @types/react-dom @types/node tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react
```
Expected: completes without error.

- [ ] **Step 4: Set the package name and scripts**

Replace the top of `package.json` `name`/`scripts` so it reads:
```json
{
  "name": "mental-math-trainer",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint ."
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'chore: install TS/Tailwind/TanStack/test deps, standardize on npm\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 2: TypeScript configuration

**Files:**
- Create: `tsconfig.json`, `tsconfig.node.json`
- Create: `vite.config.ts`
- Delete: `vite.config.js`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts` (and delete the old JS config)**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Run:
```bash
rm -f vite.config.js
```

- [ ] **Step 4: Verify TypeScript resolves**

Run: `npx tsc -b --dry 2>/dev/null; npx tsc -p tsconfig.json --noEmit`
Expected: no errors (no source files referencing missing modules yet; an empty/near-empty `src` is fine).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'chore: add TypeScript + Vite TS config with @ alias and Vitest\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 3: Tailwind v4 + theme tokens + `cn` util + Button

**Files:**
- Modify: `src/index.css`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`

- [ ] **Step 1: Replace `src/index.css` with Tailwind v4 import and shadcn-compatible tokens**

```css
@import "tailwindcss";

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.21 0.03 264);
  --primary: oklch(0.55 0.2 264);
  --primary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.97 0.01 264);
  --muted-foreground: oklch(0.55 0.02 264);
  --border: oklch(0.92 0.01 264);
  --radius: 0.75rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
}

* { border-color: var(--border); }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, "Malgun Gothic", sans-serif;
}
```

- [ ] **Step 2: Create `src/lib/utils.ts` (the shadcn `cn` helper)**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Create `src/components/ui/button.tsx` (shadcn-style Button)**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        ghost: 'bg-muted text-foreground hover:bg-muted/70',
        outline: 'border bg-background hover:bg-muted',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: add Tailwind v4 theme tokens, cn util, shadcn Button\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 4: Vitest setup + first smoke test

**Files:**
- Create: `vitest.setup.ts`
- Test: `src/lib/utils.test.ts`

- [ ] **Step 1: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Write a failing test for `cn`**

Create `src/lib/utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges and dedupes tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold');
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm test`
Expected: PASS (2 assertions). This confirms Vitest + jsdom + setup work end-to-end.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(printf 'test: wire up Vitest setup with a cn smoke test\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 5: Remove old app + new entry (`main.tsx`, `index.html`)

**Files:**
- Delete: `src/App.jsx`, `src/App.css`, `src/main.jsx`, `src/components/LevelSelector.jsx`, `src/components/Game.jsx`, `src/components/Question.jsx`, `src/components/Results.jsx`, `src/data/dictationData.js`, `src/assets/react.svg`
- Create: `src/main.tsx`
- Modify: `index.html`

- [ ] **Step 1: Delete the old dictation app files**

Run:
```bash
git rm -q src/App.jsx src/App.css src/main.jsx \
  src/components/LevelSelector.jsx src/components/Game.jsx \
  src/components/Question.jsx src/components/Results.jsx \
  src/data/dictationData.js src/assets/react.svg
```

- [ ] **Step 2: Update `index.html`** (entry → `main.tsx`, Korean lang, title)

Replace the whole file with:
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, user-scalable=no"
    />
    <title>암산 학습</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `src/main.tsx`** (providers + router; depends on Task 6's `router.tsx`)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

> Note: `src/router.tsx` is created in Task 6. The app will not build until Task 6 is done — that's expected; commit this task's deletions/entry, then complete Task 6 before running `dev`/`build`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(printf 'feat!: remove dictation app, add TS entry point\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 6: Code-based TanStack Router with Home and Solve routes

**Files:**
- Create: `src/routes/Home.tsx`, `src/routes/Solve.tsx`, `src/router.tsx`
- Test: `src/router.test.tsx`

- [ ] **Step 1: Create `src/routes/Home.tsx`**

```tsx
import { Link } from '@tanstack/react-router';
import { Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OPS = [
  { to: '/solve/add', label: '덧셈', icon: Plus },
  { to: '/solve/sub', label: '뺄셈', icon: Minus },
  { to: '/solve/mul', label: '곱셈', icon: X },
] as const;

export function Home() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">암산 학습</h1>
      <div className="grid grid-cols-3 gap-3">
        {OPS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Button variant="outline" className="h-24 w-full flex-col">
              <Icon className="size-7" />
              <span>{label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create `src/routes/Solve.tsx` (placeholder; real worksheet wired in Task 8)**

```tsx
import { useParams } from '@tanstack/react-router';

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">풀이: {operation}</h1>
      <div data-testid="worksheet-slot" className="mt-4" />
    </main>
  );
}
```

- [ ] **Step 3: Create `src/router.tsx` (code-based route tree)**

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { Home } from './routes/Home';
import { Solve } from './routes/Solve';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const solveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solve/$operation',
  component: Solve,
});

const routeTree = rootRoute.addChildren([indexRoute, solveRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

- [ ] **Step 4: Write a failing router test**

Create `src/router.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { router } from './router';

function renderAt(path: string) {
  const testRouter = createRouter({
    routeTree: router.routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={testRouter as never} />);
}

describe('router', () => {
  it('renders Home at /', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: '암산 학습' })).toBeInTheDocument();
  });

  it('renders Solve with the operation param', async () => {
    renderAt('/solve/add');
    expect(await screen.findByText('풀이: add')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npm test`
Expected: PASS (Home heading found, Solve param rendered).

- [ ] **Step 6: Verify the app builds and dev-serves**

Run: `npm run build`
Expected: `tsc -b` passes and Vite produces `dist/` with no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: code-based TanStack Router with Home and Solve routes\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 7: Step/BoardState type model

**Files:**
- Create: `src/features/solver/steps/types.ts`
- Test: `src/features/solver/steps/types.test.ts`

- [ ] **Step 1: Write a failing test that constructs a `BoardState` and a `Step`**

Create `src/features/solver/steps/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { BoardState, Step } from './types';

describe('type model', () => {
  it('builds a minimal one-cell board and a step using it', () => {
    const board: BoardState = {
      regions: ['main'],
      cells: [
        { id: 'a-o', region: 'main', row: 0, place: 0, value: '8', role: 'operand', visible: true },
      ],
      dividers: [],
    };
    const step: Step = { id: 's1', kind: 'setup', narration: '세로로 써요', board };
    expect(step.board.cells[0].value).toBe('8');
    expect(step.kind).toBe('setup');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- src/features/solver/steps/types.test.ts`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Create `src/features/solver/steps/types.ts`**

```ts
export type Operation = 'add' | 'sub' | 'mul';

/** 0 = ones, 1 = tens, 2 = hundreds … (place value, used as a column index) */
export type Place = number;

/** Layout regions. 'main' for +/−; tree regions for × decomposition. */
export type Region = 'main' | 'top' | 'left' | 'right' | 'merge';

export type CellRole =
  | 'operand'
  | 'operator'
  | 'partial'
  | 'carry'
  | 'result'
  | 'zero-placeholder';

export type Highlight = 'now' | 'pair' | 'zero' | null;

export interface Cell {
  id: string;
  region: Region;
  row: number;          // row within its region (0 = top)
  place: Place;         // column by place value (0 = ones, increasing leftward)
  value: string;        // '0'..'9' or an operator glyph '+', '−', '×'
  role: CellRole;
  visible: boolean;
  highlight?: Highlight;
  superscript?: boolean; // carry digit drawn small, above the column
}

export interface BoardState {
  regions: Region[];
  cells: Cell[];
  dividers: { region: Region; row: number }[];
}

export interface Quiz {
  prompt: string;
  answer: number;
  hints: string[];
}

export type StepKind =
  | 'setup'
  | 'decompose'
  | 'digit-op'
  | 'carry'
  | 'borrow'
  | 'place-zero'
  | 'partial'
  | 'gather'
  | 'sum'
  | 'result';

export interface Step {
  id: string;
  kind: StepKind;
  narration: string;
  board: BoardState;
  quiz?: Quiz;
}

export type Verbosity = 'full' | 'partial' | 'answer';
export interface Level {
  verbosity: Verbosity;
}
export interface Problem {
  operation: Operation;
  operands: [number, number];
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- src/features/solver/steps/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: add Step/BoardState type model for the solver\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Task 8: Static WorksheetRenderer + sample board, wired into /solve

**Files:**
- Create: `src/features/solver/sampleBoards.ts`
- Create: `src/features/solver/WorksheetRenderer.tsx`
- Test: `src/features/solver/WorksheetRenderer.test.tsx`
- Modify: `src/routes/Solve.tsx`

- [ ] **Step 1: Create `src/features/solver/sampleBoards.ts` (fixture used by test + /solve)**

```ts
import type { BoardState } from './steps/types';

/** 18 + 24 just after the "set up vertically" step (no result yet). */
export const sampleAdditionBoard: BoardState = {
  regions: ['main'],
  cells: [
    { id: 'a-t', region: 'main', row: 0, place: 1, value: '1', role: 'operand', visible: true },
    { id: 'a-o', region: 'main', row: 0, place: 0, value: '8', role: 'operand', visible: true },
    { id: 'op',  region: 'main', row: 1, place: 2, value: '+', role: 'operator', visible: true },
    { id: 'b-t', region: 'main', row: 1, place: 1, value: '2', role: 'operand', visible: true },
    { id: 'b-o', region: 'main', row: 1, place: 0, value: '4', role: 'operand', visible: true },
  ],
  dividers: [{ region: 'main', row: 1 }],
};
```

- [ ] **Step 2: Write a failing renderer test**

Create `src/features/solver/WorksheetRenderer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorksheetRenderer } from './WorksheetRenderer';
import { sampleAdditionBoard } from './sampleBoards';

describe('WorksheetRenderer', () => {
  it('renders only visible cells with their values', () => {
    render(<WorksheetRenderer board={sampleAdditionBoard} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('does not render invisible cells', () => {
    const board = {
      ...sampleAdditionBoard,
      cells: [
        ...sampleAdditionBoard.cells,
        { id: 'res', region: 'main' as const, row: 2, place: 0, value: '2', role: 'result' as const, visible: false },
      ],
    };
    render(<WorksheetRenderer board={board} />);
    // '2' from the hidden result must not appear (operand '2' lives in tens of 24)
    expect(screen.queryByText('2')).toBeInTheDocument(); // the '2' of 24 is visible
    expect(screen.getAllByText('2')).toHaveLength(1);     // hidden result '2' not rendered
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- src/features/solver/WorksheetRenderer.test.tsx`
Expected: FAIL — cannot find module `./WorksheetRenderer`.

- [ ] **Step 4: Create `src/features/solver/WorksheetRenderer.tsx` (static, region-aware grid)**

```tsx
import type { BoardState, Cell, Region } from './steps/types';

const HL_CLASS: Record<string, string> = {
  now: 'bg-amber-200 text-amber-800 rounded-md',
  pair: 'bg-blue-100 text-blue-700 rounded-md',
  zero: 'bg-orange-200 text-orange-800 rounded-md',
};

function cellClass(cell: Cell): string {
  const base = cell.superscript
    ? 'flex items-start justify-center text-sm text-red-600 h-4'
    : 'flex items-end justify-center text-3xl font-bold h-12';
  const hl = cell.highlight ? HL_CLASS[cell.highlight] ?? '' : '';
  const role = cell.role === 'operator' ? 'text-muted-foreground' : '';
  return `${base} ${hl} ${role}`.trim();
}

/** Renders one region as a place-value grid (ones column on the right). */
function RegionGrid({ board, region }: { board: BoardState; region: Region }) {
  const cells = board.cells.filter((c) => c.region === region && c.visible);
  if (cells.length === 0) return null;

  const maxPlace = Math.max(...cells.map((c) => c.place), 0);
  const maxRow = Math.max(...cells.map((c) => c.row), 0);
  const cols = maxPlace + 1; // place 0..maxPlace, rendered right→left

  return (
    <div
      className="inline-grid gap-x-1.5 gap-y-0.5 font-mono"
      style={{ gridTemplateColumns: `repeat(${cols}, 2.5rem)` }}
    >
      {Array.from({ length: maxRow + 1 }).flatMap((_, row) =>
        Array.from({ length: cols }).map((__, colFromLeft) => {
          const place = maxPlace - colFromLeft; // leftmost col = highest place
          const cell = cells.find((c) => c.row === row && c.place === place);
          const key = `${region}-${row}-${place}`;
          return (
            <div key={key} className={cell ? cellClass(cell) : 'h-12'}>
              {cell?.value ?? ''}
            </div>
          );
        }),
      )}
      {board.dividers
        .filter((d) => d.region === region)
        .map((d) => (
          <div
            key={`div-${region}-${d.row}`}
            className="col-span-full h-0.5 bg-foreground rounded-full"
            style={{ gridRow: d.row + 1 }}
          />
        ))}
    </div>
  );
}

export function WorksheetRenderer({ board }: { board: BoardState }) {
  return (
    <div className="flex flex-col items-center gap-2" data-testid="worksheet">
      {board.regions.map((region) => (
        <RegionGrid key={region} board={board} region={region} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run the renderer test to confirm it passes**

Run: `npm test -- src/features/solver/WorksheetRenderer.test.tsx`
Expected: PASS.

- [ ] **Step 6: Wire the renderer into the Solve route**

Replace `src/routes/Solve.tsx` with:
```tsx
import { useParams } from '@tanstack/react-router';
import { WorksheetRenderer } from '@/features/solver/WorksheetRenderer';
import { sampleAdditionBoard } from '@/features/solver/sampleBoards';

const TITLES: Record<string, string> = { add: '덧셈', sub: '뺄셈', mul: '곱셈' };

export function Solve() {
  const { operation } = useParams({ from: '/solve/$operation' });
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-xl font-bold">{TITLES[operation] ?? operation}</h1>
      <div data-testid="worksheet-slot">
        <WorksheetRenderer board={sampleAdditionBoard} />
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Run the full suite and build**

Run: `npm test`
Expected: PASS (cn, router, types, renderer).

Run: `npm run build`
Expected: type-checks and builds with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(printf 'feat: static WorksheetRenderer rendering a BoardState on /solve\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Manual verification (end of Plan 1)

- [ ] Run `npm run dev`, open the local URL.
- [ ] `/` shows the 암산 학습 home with three operation cards (Plus/Minus/X lucide icons).
- [ ] Clicking 덧셈 navigates to `/solve/add` and shows the static `18 + 24` worksheet (place-value aligned, ones column on the right, divider line above the second operand).
- [ ] `npm test` and `npm run build` are both green.

---

## Self-Review (against the spec)

- **§3 Tech stack** — Vite/React/TS ✓ (T1–T2), Tailwind v4/shadcn-style/lucide ✓ (T3, T6), TanStack Router/Query ✓ (T5–T6), Framer Motion installed ✓ (T1, used Plan 2), Vitest/RTL ✓ (T1, T4). wa-sqlite/Drizzle intentionally deferred to Plan 5.
- **§4 Domain model** — `Step`/`BoardState`/`Cell` types ✓ (T7); `buildSteps`/`useSolveEngine`/animations deferred to Plan 2 (engine) by design.
- **§8 UI/routes** — `/`, `/solve/$operation` shell ✓ (T6); `/learn`, `/progress`, mobile-compact deferred to Plans 4–6.
- **§12 Directory structure & migration** — old dictation files removed ✓ (T5); `features/solver/steps`, `lib`, `components/ui` created ✓.
- **§13 Testing** — Vitest harness + renderer/router/type tests ✓; step-generator and engine tests arrive with their code in Plans 2–3.
- **Placeholder scan** — no TBD/“add error handling”/uncoded steps; every code step has complete code.
- **Type consistency** — `WorksheetRenderer({ board })`, `BoardState.regions/cells/dividers`, `Cell.{place,row,region,visible,highlight,superscript}`, route id `/solve/$operation` are used identically across T6–T8.

Scope note: Plan 1 deliberately ships a *static* renderer. Animation, the solve engine, and the addition step generator are Plan 2 — that is where the core "단계별 애니메이션 + 주관식 퀴즈" loop becomes real.
